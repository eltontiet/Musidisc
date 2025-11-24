import config from '@config'
import SearchResults, { Result } from '@customTypes/Results'
import debug_print from 'debug/debug';

var spotify_authentication_token = "";

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"

const SPOTIFY_TOKEN_OPTIONS = {
    method: "POST",
    headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(config.SPOTIFY_CLIENT_ID + ":" + config.SPOTIFY_CLIENT_SECRET).toString('base64')}`
    },
    body: new URLSearchParams({
        'grant_type': "client_credentials"
    })

}

const SPOTIFY_PLAYLIST_URL = "https://api.spotify.com/v1/playlists/"

const SPOTIFY_PLAYLIST_REQUEST_OPTIONS = {
    method: "GET",
    headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer  <Auth>"
    }
}

export async function getPlaylistTracks(playlist_id: string): Promise<SpotifySearchResult[]> {
    let url = `${SPOTIFY_PLAYLIST_URL}${playlist_id}/tracks`

    let parsedSearchResults = getAllTracks(url);
    return parsedSearchResults;
};

/**
 * Get all tracks of url starting at the offset specified in the url (Allow recursion)
 * 
 * GetTracks helper
 * 
 * @param url 
 * @returns 
 */
async function getAllTracks(url: string): Promise<SpotifySearchResult[]> {

    debug_print(`Playlist URL: ${url}`)

    if (spotify_authentication_token === "") {
        await authenticate();
        SPOTIFY_PLAYLIST_REQUEST_OPTIONS.headers.Authorization = spotify_authentication_token;
    }

    let searchResults: SpotifyPlaylistResponse = await doFetch(url, SPOTIFY_PLAYLIST_REQUEST_OPTIONS).catch(async (e) => {
        // Try again after authenticating
        await authenticate();
        SPOTIFY_PLAYLIST_REQUEST_OPTIONS.headers.Authorization = spotify_authentication_token;

        return doFetch(SPOTIFY_PLAYLIST_URL, SPOTIFY_PLAYLIST_REQUEST_OPTIONS);
    }) as SpotifyPlaylistResponse;

    let tracks: SpotifySearchResult[] = parseSearchResults(searchResults);

    if (searchResults.next) {
        tracks = tracks.concat(await getAllTracks(searchResults.next));
    }

    return tracks;
}

async function doFetch(url: string, requestOptions): Promise<Object> {
    try {

        debug_print(`URL IN FETCH: ${url}`)

        let response = await fetch(url, requestOptions);

        if (!response.ok) {
            throw ({ status: response.status, statusText: response.statusText })
        }

        debug_print(`RESPONSE TO FETCH${response}`);

        var body = await response.json();

    } catch (e) {
        if (e.status == 403) {
            console.error("Request Forbidden: Check that the api key is correct and try again");
            console.error(e.statusText);
            return null;
        } else if (e.status === 401) {
            console.error("Not authenticated");
            throw new SpotifyAuthenticationError(e.statusText);
        } else {
            console.error("An unexpected error has occurred");
            console.error(e.statusText);
            return null;
        }
    }

    return body
}



function parseSearchResults(searchResults: SpotifyPlaylistResponse): SpotifySearchResult[] {
    let parsedResults: SpotifySearchResult[] = [];

    for (let item of searchResults.items) {
        let artistList = []

        for (let artist of item.track.artists) {
            artistList.push(artist.name);
        }

        parsedResults.push(
            {
                name: item.track.name,
                artists: artistList
            }
        )
    }

    return parsedResults;
}

async function authenticate() {
    return doFetch(SPOTIFY_TOKEN_URL, SPOTIFY_TOKEN_OPTIONS).then((res: any) => {
        debug_print(`ACCESS TOKEN RES: ${res}`)

        spotify_authentication_token = `Bearer  ${res.access_token}`;
    }).catch((rej) => {
        console.error(`Failed to authenticate Spotify token with reason: ${rej}`)
    })
}