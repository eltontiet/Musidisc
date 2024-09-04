import debug_print from 'debug/debug';
import dgram from 'dgram';
import { EventEmitter } from 'events';
import { VoiceUDPState } from './VoiceUDPState';
import libsodium from 'libsodium-wrappers';

export default class VoiceUDPHandler {

    private server: dgram.Socket;
    private ip: string;
    private port: number;
    private myAddress: string;

    private myAddressFound: any | EventEmitter;

    private state: VoiceUDPState;

    constructor(ip, port) {
        this.server = dgram.createSocket('udp4');
        this.setupListeners();
        this.ip = ip;
        this.port = port;
        this.server.bind(port);
        this.state = VoiceUDPState.INIT

        debug_print(`Setup server at ${ip}:${port}`);
    }

    private setupListeners() {
        this.server.on('message', this.handleMessage);

        this.server.on('error', (err) => {
            console.error(`UDP Server was closed with error:`);
            console.error(err);
        })
    }

    private handleMessage(msg, rinfo) {
        debug_print(`Got message ${msg} from ${rinfo.address}:${rinfo.port}`);

        if (this.state === VoiceUDPState.IP_DISCOVERY && msg.readInt16BE() === 2) {
            let length = msg.readInt16BE(2);
            let ssrc = msg.readBigInt64BE(4);
            let i = 8;
            let address = [];
            let byte;
            do {
                byte = msg.readInt8(i);
                address.push(byte);
                i++;
            } while (byte !== 0);

            this.myAddress = Buffer.from(address).toString('ascii');
            this.myAddressFound?.emit('completed');


        } else {

        }
    }

    public getMyAddress(): Promise<string> {
        if (this.myAddress === null || this.myAddress === undefined) {
            this.myAddressFound = new EventEmitter();

            return new Promise<string>((resolve, reject) => {
                this.myAddressFound.on('completed', () => {
                    resolve(this.myAddress);
                })
            })

        } else {
            return Promise.resolve(this.myAddress);
        }
    }

    public send(msg) {
        this.server.send(msg, this.port, this.ip);
    }

    public sendIPDiscovery(ssrc: number) {
        if (this.state !== VoiceUDPState.INIT) return;

        debug_print("Sending ip discovery packet");

        let buffer = [];
        buffer.push(0x0, 0x1); // Type (2 bytes)
        buffer.push(0x0, 70); // Length (2 bytes)

        let ssrcByteArray = this.getBytes(ssrc);

        while (ssrcByteArray.length < 4) ssrcByteArray.unshift(0x00);
        buffer = buffer.concat(ssrcByteArray); // SSRC (4 bytes)

        buffer = buffer.concat(Array.from(new Uint8Array(64))); // Address (64 bytes)

        let portByteArray = this.getBytes(this.port);
        while (portByteArray.length < 2) portByteArray.unshift(0x00);

        buffer = buffer.concat(portByteArray);

        this.send(Uint8Array.from(buffer));
        this.state = VoiceUDPState.IP_DISCOVERY;
    }

    private getBytes(num: number) {
        let byteArr = [];
        let curr = num;
        while (curr > 0) {
            byteArr.unshift(curr & 0xff);
            curr = curr >> 8;
        }

        return byteArr;
    }

    public async sendPacket(packet, sequence, timestamp, ssrc, secretKey) {
        let header: Buffer = Buffer.alloc(12);
        header[0] = 0x80;
        header[1] = 0x78;

        header.writeUInt16BE(sequence, 2);
        header.writeUInt32BE(timestamp, 2);
        header.writeUInt32BE(ssrc, 2);

        let nonce = Buffer.alloc(24);
        header.copy(nonce, 0, 0, 12);

        let opus = await this.encryptOpusPacket(packet, nonce, secretKey);

        this.send(Buffer.concat([header, opus]))
    }

    private async encryptOpusPacket(packet, nonce, secretKey): Promise<Uint8Array> {
        await libsodium.ready;

        libsodium.crypto_secretbox_easy(packet, packet, nonce, secretKey);
        return packet;
    }
}