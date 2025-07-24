import { OpusStream } from 'prism-media/typings/opus';
import VoiceWorker, { VoiceWorkerListener } from '../VoiceWorker'
import QueueObject from './QueueObject';
import debug_print from 'debug/debug';
import { debug } from 'console';
import { getRandomValues, randomBytes, randomInt, randomUUID } from 'crypto';
import YoutubeFileQueueObject from './YoutubeFileQueueObject';

interface AudioHandlerState {
    playing: boolean;
    sequence: number;
    timestamp: number;
    opusStream: OpusStream;
    skipped_packets: number;
    paused: boolean;
    current_time: number;
}

const SILENCE_FRAME = Buffer.from([0xf8, 0xff, 0xfe]);

// TODO: Add a way to destroy the queue and current song
// TODO: Does not play on first call to play

// TODO: I do not like how AudioHandler and VoiceWorker interact right now, maybe make VoiceWorker part of AudioHandler, and store AudioHandler in the cache
export default class AudioHandler implements VoiceWorkerListener {

    private voiceWorker: VoiceWorker;

    private queue: QueueObject[];

    private state: AudioHandlerState;

    private framesOfSilence: number;

    private shouldPlay: boolean;

    private playTimer;

    constructor(voiceWorker: VoiceWorker) {
        this.voiceWorker = voiceWorker;
        this.queue = [];
        this.state = {
            opusStream: undefined,
            playing: false,
            sequence: 0,
            timestamp: 0,
            skipped_packets: 0,
            paused: false,
            current_time: 0 // in milliseconds
        };
        this.onReady = this.onReady.bind(this);
        voiceWorker.addListener(this);
    }

    public swapVoiceWorker(voiceWorker: VoiceWorker) {
        this.voiceWorker = voiceWorker;
        this.onReady = this.onReady.bind(this);
        voiceWorker.addListener(this);
    }

    public addToQueue(song: QueueObject) {
        this.queue.push(song);
    }

    public getQueue() {
        return this.queue;
    }

    public async playSong() {
        if (!this.voiceWorker.isReady()) {
            this.shouldPlay = true;
            return;
        }
        if (!this.state.playing) {
            debug_print("Starting audio!");

            this.voiceWorker.startSpeaking();


            this.state.opusStream = await this.queue[0].getOpusResource();
            this.state.opusStream.on('end', this.finishSong.bind(this));
            this.state.opusStream.on('error', this.songError.bind(this));
            this.state.playing = true; // Reset state function
            this.state.paused = false;
            this.state.skipped_packets = 0;
            this.state.current_time = 0;
            this.playTimer = setInterval(this.sendNextPacket.bind(this), 20);
        }
    }

    public sendNextPacket() {

        // debug_print(`Sending next packet sequence: ${this.state.sequence}, ts: ${this.state.timestamp}`)

        let packet;
        if (this.framesOfSilence > 0) {
            packet = SILENCE_FRAME;
            this.framesOfSilence--;

        } else if (!this.state.opusStream.readable && this.state.playing) {
            debug_print("Data is not readable... skipping");

            return; // Skip this iteration TODO: gracefully skip song if too many errors
        } else if (this.state.playing === true) {
            packet = this.state.opusStream.read();

        } else {
            clearInterval(this.playTimer);
            if (this.queue.length > 0) {
                this.playSong();
            } else {
                this.finishSong();
            }
            return;
        }

        if (!packet) {
            // console.error("Tried to play a null packet, skipping....");
            if (this.state.current_time > 0)
                this.state.skipped_packets++;

            if (this.state.skipped_packets > 50) {
                // this.tryResetSong();
                this.finishSong();
            }
            return;
        }

        this.voiceWorker.playPacket(packet, this.state.sequence, this.state.timestamp);

        this.state.sequence++;
        if (this.state.sequence > 2 ** 16 - 1) {
            this.state.sequence = 0;
        }

        this.state.timestamp += 960;
        if (this.state.timestamp > 2 ** 32 - 1) {
            this.state.timestamp = 0;
        }

        this.state.current_time += 20; // by opus 20 milliseconds per packet
    }

    private finishSong() {
        this.framesOfSilence = 5;
        this.state.playing = false;
        this.queue = this.queue.slice(1);

        this.voiceWorker.stopSpeaking();
    }

    public onReady(e) {
        debug_print("Got ready event")

        if (this.shouldPlay) {
            this.playSong();
        } else if (this.state.playing && this.state.paused) {
            this.resume();
        }
    }

    public onPlayed(e: Event) {
    }

    public onStopped(e: Event) {
    }

    public stop() {
        this.queue = [];
        this.state.playing = false;
        this.state.opusStream = undefined;
        clearInterval(this.playTimer);
    }

    private songError(e: Event) {
        console.error(`Error handling stream: \n${e}`);
        // this.tryResetSong();

        this.state.opusStream.destroy();
        this.finishSong();

        return;
    }

    public pause() {
        this.state.paused = true;
        this.voiceWorker.stopSpeaking();
        clearInterval(this.playTimer)
    }

    public resume() {
        this.state.paused = false;
        this.voiceWorker.startSpeaking();
        this.playTimer = setInterval(this.sendNextPacket.bind(this), 20);
    }

    public skip() {
        let currentSong = (this.queue[0] as YoutubeFileQueueObject).getResult();
        this.state.opusStream.destroy();
        this.finishSong();

        return currentSong;
    }

    public getCurrentTime() {
        return this.state.current_time;
    }

    public getCurrentSong() {
        return (this.queue[0] as YoutubeFileQueueObject)?.getResult(); // TODO: MAKE THIS BETTER
    }

    private async tryResetSong() {

        console.error("Error with song, creating new stream");

        this.state.opusStream.destroy();
        this.pause();

        let current_time = this.state.current_time;

        this.state.opusStream = await this.queue[0].getOpusResourceAtTimestamp(current_time);
        this.state.opusStream.on('end', this.finishSong.bind(this));
        this.state.opusStream.on('error', this.songError.bind(this));

        this.resume();
    }
}