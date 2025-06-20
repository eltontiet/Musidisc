
export interface Result {
    id: string,
    title: string,
    length: number,
    channelID: string,
    channelTitle: string,
    thumbnails: Thumbnails
    // ... Add more as needed
}

export default interface SearchResults {
    tag: string,
    query: string,
    nextPageToken?: string,
    prevPageToken?: string,
    results: Result[],
    pageInfo: PageInfo
}

export interface PageInfo {
    totalResults: number,
    resultsPerPage: number
}

export interface Thumbnails {
    default: Thumbnail,
    medium?: Thumbnail,
    high?: Thumbnail,
    standard?: Thumbnail,
    maxres?: Thumbnail,

}

export interface Thumbnail {
    url: string,
    width: number,
    height: number,
}