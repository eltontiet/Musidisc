import fs, { read } from 'fs'
import path from 'path'
import debug_print, { DebugLevels } from 'debug/debug'
import { Innertube, FormatUtils } from 'youtubei.js'
import ytdl from '@distube/ytdl-core'
import { opus } from 'prism-media'
import { Readable } from 'stream'
import { Format } from 'youtubei.js/dist/src/parser/misc'

const YOUTUBE_URL = "http://www.youtube.com/watch?v="

const TEMP_FOLDER = path.join(process.cwd() + "/tmp");

const MAX_TRIES = 5;

export async function downloadVideo(id: string, timestamp: number = 0) {
    if (!fs.existsSync(TEMP_FOLDER)) fs.mkdirSync(TEMP_FOLDER);

    let cookies = JSON.parse(fs.readFileSync(path.join(process.cwd() + "/src/config/cookies.json"), "utf-8"));

    let url = YOUTUBE_URL + id;

    return iyoutubeDownload(id, timestamp, cookies).then(
        (readableStream) => Readable.fromWeb(readableStream)
    );

    // return ytdlDownload(url, timestamp, cookies);
}



async function iyoutubeDownload(id: string, timestamp: number, cookies) {
    const innertube = await Innertube.create({
        cookie: cookies
    });

    let info = await innertube.getBasicInfo(id, {
        client: 'TV'
    });

    info.streaming_data.adaptive_formats = info.streaming_data.adaptive_formats.filter((format) => !format.is_drc); // remove all drc formats

    let tries = 0;

    while (tries < MAX_TRIES) {
        try {
            return FormatUtils.download({ // use inner util function directly
                quality: 'best',
                type: 'audio',
                format: 'any',
                client: 'TV',
                codec: 'opus'
            }, info.actions, info.playability_status, info.streaming_data, undefined, info.cpn)

        } catch (e) {
            debug_print(`Error downloading video, retrying after 500ms: ${tries}/${MAX_TRIES}`, DebugLevels.DEBUG);
            tries++;
            await new Promise((res) => setTimeout(res, 500));
        }
    }

    throw new Error("Failed to download video");

    // return innertube.download(id, {
    //     quality: 'best',
    //     type: 'audio',
    //     format: 'any',
    //     client: 'TV',
    //     codec: 'opus'
    // })
}

async function ytdlDownload(url: string, timestamp: number, cookies) {
    let agent = ytdl.createAgent(cookies);




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
            dlChunkSize: 0,
            begin: timestamp,
            liveBuffer: 5000,
            agent,

        });
}