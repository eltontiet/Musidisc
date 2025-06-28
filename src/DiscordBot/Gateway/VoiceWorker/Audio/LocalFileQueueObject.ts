import QueueObject from "./QueueObject";
import fs from 'fs';
import prism from 'prism-media';
import { OpusStream } from "prism-media/typings/opus";
import opus from "@discordjs/opus";

export default class LocalFileQueueObject implements QueueObject {
    DISCORD_CONSTANTS: { BITRATE: 48000; CHANNELS: 2; };

    public async getOpusResource() {
        let decoded = fs.createReadStream("./tmp/neck+ripping.ogg").pipe(new prism.opus.OggDemuxer())
            .pipe(new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 }))
            .pipe(fs.createWriteStream("./tmp/neck_ripping_out.pcm"));



        return fs.createReadStream("./tmp/neck+ripping.ogg").pipe(new prism.opus.OggDemuxer())
            .pipe(new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 }))
            .pipe(new prism.opus.Encoder({ rate: 48000, channels: 2, frameSize: 960 }));
    }

    public async getOpusResourceAtTimestamp(millis: number) {
        throw "Not implemented";
    }

}