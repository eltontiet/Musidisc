export interface Result {
    id: string,
    title: string,
    length: number,
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