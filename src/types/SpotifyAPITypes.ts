class SpotifyAuthenticationError extends Error {

}

interface SpotifySearchResult {
    name: string,
    artists: string[],
}


// PARTIAL VERSION OF SPOTIFY API TYPE FOR USE IN THIS APP
interface SpotifyPlaylistResponse {
    next: string;
    items: PlaylistTrackObject[];
}

interface PlaylistTrackObject {
    track: TrackObject
}

interface TrackObject {
    name: string,
    artists: SimplifiedArtistObject[]
}

interface SimplifiedArtistObject {
    name: string
}