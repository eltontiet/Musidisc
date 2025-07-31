import ytdl from '@distube/ytdl-core'
import fs from 'fs'
import path from 'path'
import debug_print, { DebugLevels } from 'debug/debug'


const YOUTUBE_URL = "http://www.youtube.com/watch?v="

const TEMP_FOLDER = path.join(process.cwd() + "/tmp");

export async function downloadVideo(id: string, timestamp: number = 0, cookies?: string) {
    if (!fs.existsSync(TEMP_FOLDER)) fs.mkdirSync(TEMP_FOLDER);

    let requestOptions = cookies ? {
        headers: {
            cookie: cookies
        }
    } : undefined

    let agent = ytdl.createAgent(JSON.parse(fs.readFileSync(path.join(process.cwd() + "/src/config/cookies.json"), "utf-8")));


    let url = YOUTUBE_URL + id;

    // Get audio options

    let info = await ytdl.getInfo(url, { agent });
    let formats;
    try {
        formats = ytdl.filterFormats(info.formats, 'audioonly');
    } catch (e) {
        formats = [];
    }
    let format;

    if (formats.length === 0) { // If there are no audio only formats
        format = ytdl.chooseFormat(info.formats, {
            quality: 'highestaudio',
            filter: format => !((format as any).isDrc) // TODO: weird, (use different library?) isDrc is a thing but not in the library
        });
    } else { // Otherwise choose the best audioonly format
        format = ytdl.chooseFormat(formats, {
            quality: 'highestaudio',
            filter: format => !((format as any).isDrc) // TODO: weird, (use different library?) isDrc is a thing but not in the library });
        });
    }

    debug_print(format.container);

    let container: string = format.container; // TODO: pass through the container

    let tempName = "tempFile"; // TODO: maybe use a temp file?

    return ytdl.downloadFromInfo(info,
        {
            format: format,
            requestOptions: requestOptions,
            dlChunkSize: 0,
            begin: timestamp,
            liveBuffer: 5000,
            agent,

        });

}