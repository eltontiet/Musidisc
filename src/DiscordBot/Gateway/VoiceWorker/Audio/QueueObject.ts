import { OpusStream } from "prism-media/typings/opus"

export default interface QueueObject {

    DISCORD_CONSTANTS: {
        BITRATE: 48000,
        CHANNELS: 2
    }

    getOpusResource(): Promise<OpusStream>;
}