import { OpusStream } from 'prism-media/typings/opus';
import VoiceWorker, { VoiceWorkerListener } from '../VoiceWorker'
import QueueObject from './QueueObject';
import debug_print from 'debug/debug';

interface AudioHandlerState {
    playing: boolean;
    sequence: number;
    timestamp: number;
    opusStream: OpusStream;
}

const SILENCE_FRAME = Buffer.from([0xf8, 0xff, 0xfe]);

// TODO: I do not like how AudioHandler and VoiceWorker interact right now, maybe make VoiceWorker part of AudioHandler, and store AudioHandler in the cache
export default class AudioHandler implements VoiceWorkerListener {

    private voiceWorker: VoiceWorker;

    private queue: QueueObject[];

    private state: AudioHandlerState;

    private framesOfSilence: number;

    private shouldPlay: boolean;

    private ready: boolean;


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
        if (!this.ready) {
            this.shouldPlay = true;
            return;
        }
        if (!this.playTimer) {
            this.state.opusStream = await this.queue[0].getOpusResource();
            this.state.opusStream.on('end', this.finishSong);
            this.state.playing = true;
            this.playTimer = setInterval(this.sendNextPacket.bind(this), 20);
        }
    }

    public sendNextPacket() {
        let packet;
        if (this.framesOfSilence > 0) {
            packet = SILENCE_FRAME;
            this.framesOfSilence--;

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
        this.voiceWorker.playPacket(packet, this.state.sequence, this.state.timestamp);
        this.state.sequence++;
        this.state.timestamp += 20;
    }

    private finishSong(e) {
        this.framesOfSilence = 5;
        this.state.playing = false;
        this.queue = this.queue.slice(1);
    }

    public onReady(e) {
        debug_print("Got ready event")

        this.ready = true;
        if (this.shouldPlay) {
            this.playSong();
        }
    }

    public onPlayed(e: Event) {
    }

    public onStopped(e: Event) {
    }



}