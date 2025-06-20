import config from '@config'
import SearchResults, { Result } from '@customTypes/Results'

const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search?"

const YOUTUBE_SEARCH_PARAMETERS = {
    part: "snippet",
    key: config.YOUTUBE_API_KEY,
    maxResults: "10",
    order: "relevance",
    type: "video",

}

const YOUTUBE_SEARCH_REQUEST_OPTIONS = {
    method: "GET",
    headers: { "Content-Type": "application/json", }
}

const YOUTUBE_VIDEO_LIST_URL = "https://www.googleapis.com/youtube/v3/videos?"

const YOUTUBE_VIDEO_LIST_PARAMETERS = {
    part: "contentDetails",
    key: config.YOUTUBE_API_KEY,
    maxResults: "10",
}

const YOUTUBE_VIDEO_LIST_REQUEST_OPTIONS = {
    method: "GET",
    headers: { "Content-Type": "application/json", }
}

export async function search(query: string, pageToken?: string): Promise<SearchResults> {
    let parameters = YOUTUBE_SEARCH_PARAMETERS;
    parameters["q"] = query;

    if (pageToken !== undefined && pageToken !== null) parameters["pageToken"] = pageToken;

    let searchResults = await doFetch(YOUTUBE_SEARCH_URL + new URLSearchParams(parameters), YOUTUBE_SEARCH_REQUEST_OPTIONS)


    let videoDetails = await getVideoDetails(searchResults);

    if (!videoDetails) return null;

    let parsedSearchResults = parseSearchResults(searchResults, videoDetails, query);
    return parsedSearchResults;
};

async function getVideoDetails(searchResults) {
    let parameters = YOUTUBE_VIDEO_LIST_PARAMETERS;
    let ids = []

    for (let r of searchResults.items) {
        ids.push(r.id.videoId);
    }

    parameters["id"] = ids.toString();

    console.log(ids.toString());

    let videoDetails = await doFetch(YOUTUBE_VIDEO_LIST_URL + new URLSearchParams(parameters), YOUTUBE_VIDEO_LIST_REQUEST_OPTIONS);

    return videoDetails;
}

async function doFetch(url: string, requestOptions): Promise<Object> {
    try {
        let response = await fetch(url, requestOptions);

        if (!response.ok) {
            throw ({ status: response.status, statusText: response.statusText })
        }

        var body = await response.json();

    } catch (e) {
        if (e.status == 403) {
            console.error("Request Forbidden: Check that the api key is correct and try again");
            return null;
        } else {
            console.error("An unexpected error has occurred");
            console.error(e.statusText);
            return null;
        }
    }

    return body
}


export async function getNextPage(searchResult: SearchResults): Promise<SearchResults> {
    if (searchResult.nextPageToken === undefined) {
        throw new Error("This is the last page") // TODO: Create errors
    }

    return search(searchResult.query, searchResult.nextPageToken);
}

export async function getPrevPage(searchResult: SearchResults): Promise<SearchResults> {
    if (searchResult.prevPageToken === undefined) {
        throw new Error("This is the first page") // TODO: Create errors
    }

    return search(searchResult.query, searchResult.prevPageToken);
}


function parseSearchResults(searchResults, videoDetails, query: string): SearchResults {



    let parsedResults: SearchResults = {
        query: query,
        nextPageToken: searchResults.nextPageToken,
        prevPageToken: searchResults.prevPageToken,
        tag: searchResults.etag,
        pageInfo: {
            resultsPerPage: searchResults.pageInfo.resultsPerPage,
            totalResults: searchResults.pageInfo.totalResults
        },
        results: []
    };

    for (let idx in searchResults.items) {
        let r = searchResults.items[idx];
        let details = videoDetails.items[idx].contentDetails;

        let result: Result = {
            id: r.id.videoId,
            title: r.snippet.title,
            length: details.duration,
            channelID: r.snippet.channelId,
            channelTitle: r.snippet.channelTitle,
            thumbnails: r.snippet.thumbnails,
        }

        parsedResults.results.push(result);

    }
    return parsedResults;
}