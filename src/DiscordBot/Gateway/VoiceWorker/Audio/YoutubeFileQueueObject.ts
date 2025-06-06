import QueueObject from "./QueueObject";
import prism, { opus } from 'prism-media'
import * as YoutubeVideo from '@VideoHandlers/YoutubeVideoHandler/YoutubeVideoHandler'
import { Result } from "@customTypes/Results";
import fs from 'fs';
import { OpusStream } from "prism-media/typings/opus";

export default class YoutubeFileQueueObject implements QueueObject {

    private result: Result;

    constructor(searchResult: Result) {
        this.result = searchResult;
    }

    DISCORD_CONSTANTS: { BITRATE: 48000; CHANNELS: 2; };

    public async getOpusResource() {
        let videoStream = await YoutubeVideo.downloadVideo(this.result.id);
        let transcoder = new prism.FFmpeg({
            args: [
                '-analyzeduration', '0',
                '-f', 's16le',
                '-ar', '48000',
                '-ac', '2',
            ]
        })

        return videoStream.pipe(transcoder)
            .pipe(new prism.opus.Encoder({ rate: 48000, channels: 2, frameSize: 960 }))

    }

}