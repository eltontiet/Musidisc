import { OpusStream } from "prism-media/typings/opus"

export default abstract class QueueObject {

    id: string = crypto.randomUUID();


    DISCORD_CONSTANTS: {
        BITRATE: 48000,
        CHANNELS: 2
    }

    abstract getOpusResource();

    abstract getOpusResourceAtTimestamp(millis: number);
}