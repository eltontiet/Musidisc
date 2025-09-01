import QueueObject from "./QueueObject";
import prism from 'prism-media'
import * as YoutubeVideo from '@VideoHandlers/YoutubeVideoHandler/YoutubeVideoHandler'
import { Result } from "@customTypes/Results";
import debug_print, { DebugLevels } from 'debug/debug';
import { Readable } from 'stream'

export default class YoutubeFileQueueObject extends QueueObject {

    private result: Result;

    constructor(searchResult: Result) {
        super();
        this.result = searchResult;
    }

    DISCORD_CONSTANTS: { BITRATE: 48000; CHANNELS: 2; };

    public async getOpusResource() {
        let videoStream = await YoutubeVideo.downloadVideo(this.result.id);
        debug_print("Downloaded video!", DebugLevels.DEBUG);
        return this.handleStream(videoStream);

    }

    public getResult() {
        return this.result;
    }

    public async getOpusResourceAtTimestamp(millis: number) {
        let videoStream = await YoutubeVideo.downloadVideo(this.result.id, millis);
        return this.handleStream(videoStream);
    }

    private async handleStream(videoStream: Readable) {
        let transcoder = new prism.FFmpeg({
            args: [
                '-analyzeduration', '0',
                '-f', 's16le',
                '-ar', '48000',
                '-ac', '2',
            ]
        })

        // let encoder = new prism.opus.Encoder({ rate: 48000, channels: 2, frameSize: 960 });

        let encoder = new prism.opus.WebmDemuxer();

        videoStream.on('error', (err) => encoder.emit('error', err));
        transcoder.on('error', (err) => encoder.emit('error', err));
        encoder.on('close', () => videoStream.destroy());

        await new Promise((res) => setTimeout(res, 3000)); // 3 seconds to buffer

        return videoStream
            .pipe(encoder);
    }
}