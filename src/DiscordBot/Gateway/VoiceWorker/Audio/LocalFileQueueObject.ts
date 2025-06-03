import QueueObject from "./QueueObject";
import fs from 'fs';
import prism from 'prism-media';

export default class LocalFileQueueObject implements QueueObject {
    DISCORD_CONSTANTS: { BITRATE: 48000; CHANNELS: 2; };

    public async getOpusResource() {
        return fs.createReadStream("./tmp/neck+ripping.ogg").pipe(new prism.opus.OggDemuxer())
            .pipe(new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 20 }));
    }

}