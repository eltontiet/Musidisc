import { OpusStream } from 'prism-media/typings/opus';
import VoiceWorker, { VoiceWorkerListener } from '../VoiceWorker'
import QueueObject from './QueueObject';
import debug_print from 'debug/debug';
import { debug } from 'console';
import { getRandomValues, randomBytes, randomInt, randomUUID } from 'crypto';

interface AudioHandlerState {
    playing: boolean;
    sequence: number;
    timestamp: number;
    opusStream: OpusStream;
}

const SILENCE_FRAME = Buffer.from([0xf8, 0xff, 0xfe]);

// TODO: Add a way to destroy the queue and current song

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
            timestamp: 0
        };
        voiceWorker.addListener(this);
    }

    public addToQueue(song: QueueObject) {
        this.queue.push(song);
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
            this.state.playing = true;
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
                this.voiceWorker.stopSpeaking();
            }
            return;
        }

        if (!packet) {
            console.error("Tried to play a null packet, skipping....");
            return;
        }

        this.voiceWorker.playPacket(packet, this.state.sequence, this.state.timestamp);
        this.state.sequence++;
        this.state.timestamp += 960;
    }

    private finishSong(e) {
        this.framesOfSilence = 5;
        this.state.playing = false;
        this.queue = this.queue.slice(1);

        this.voiceWorker.stopSpeaking();
    }

    public onReady(e) {
        debug_print("Got ready event")

        if (this.shouldPlay) {
            this.playSong();
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


}