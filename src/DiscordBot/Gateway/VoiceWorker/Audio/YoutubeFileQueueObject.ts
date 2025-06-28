import QueueObject from "./QueueObject";
import prism, { opus } from 'prism-media'
import * as YoutubeVideo from '@VideoHandlers/YoutubeVideoHandler/YoutubeVideoHandler'
import { Result } from "@customTypes/Results";
import fs from 'fs';
import { OpusStream } from "prism-media/typings/opus";
import debug_print from "debug/debug";
import { timeStamp } from "console";

export default class YoutubeFileQueueObject implements QueueObject {

    private result: Result;

    constructor(searchResult: Result) {
        this.result = searchResult;
    }

    DISCORD_CONSTANTS: { BITRATE: 48000; CHANNELS: 2; };

    public async getOpusResource() {
        let videoStream = await YoutubeVideo.downloadVideo(this.result.id);
        return this.handleStream(videoStream);

    }

    public getResult() {
        return this.result;
    }

    public async getOpusResourceAtTimestamp(millis: number) {
        let videoStream = await YoutubeVideo.downloadVideo(this.result.id, millis);
        return this.handleStream(videoStream);
    }

    private async handleStream(videoStream) {
        let transcoder = new prism.FFmpeg({
            args: [
                '-analyzeduration', '0',
                '-f', 's16le',
                '-ar', '48000',
                '-ac', '2',
            ]
        })

        let encoder = new prism.opus.Encoder({ rate: 48000, channels: 2, frameSize: 960 });

        videoStream.on('error', (err) => encoder.emit('error', err));
        transcoder.on('error', (err) => encoder.emit('error', err));

        await new Promise<void>((res) => videoStream.on('progress',
            (bytes_sent, bytes_downloaded, total_bytes) => {

                // debug_print(`Progress: ${bytes_sent} - ${bytes_downloaded} - ${total_bytes}`);
                // TODO: Do something with this in audiohandler

                if (bytes_downloaded > 100000) res();
            }));

        return videoStream.pipe(transcoder)
            .pipe(encoder);
    }
}