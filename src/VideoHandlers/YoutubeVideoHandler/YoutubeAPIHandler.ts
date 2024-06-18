import config from '@config'

const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search?"

const YOUTUBE_SEARCH_PARAMETERS = {
    part: "snippet",
    key: config.youtube_key,
    maxResults: 10,
    order: "relevance"
}

const YOUTUBE_SEARCH_REQUEST_OPTIONS = {
    method: "GET",
    headers: { "Content-Type": "application/json", }
}

export default function search(query: string) {
    console.log(config.youtube_key);
    let parameters = YOUTUBE_SEARCH_PARAMETERS;
    parameters["q"] = query;
    fetch(YOUTUBE_SEARCH_URL + new URLSearchParams(parameters), YOUTUBE_SEARCH_REQUEST_OPTIONS)
        .then((m) => m.json()).then((m) => console.log(m));
    return null;
};