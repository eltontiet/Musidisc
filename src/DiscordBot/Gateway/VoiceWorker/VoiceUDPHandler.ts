import debug_print from 'debug/debug';
import dgram from 'dgram';
import { EventEmitter } from 'events';

export default class VoiceUDPHandler {

    private server: dgram.Socket;
    private ip: string;
    private port: number;
    private myAddress: string;

    private myAddressFound: any | EventEmitter;

    constructor(ip, port) {
        this.server = dgram.createSocket('udp4');
        this.setupListeners();
        this.ip = ip;
        this.port = port;
        this.server.bind(port);

        debug_print(`Setup server at ${ip}:${port}`);
    }

    private setupListeners() {
        this.server.on('message', (msg, rinfo) => {
            debug_print(`Got message ${msg} from ${rinfo.address}:${rinfo.port}`);

            if (msg.readInt16BE() === 2) {
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


            }
        });

        this.server.on('error', (err) => {
            console.error(`UDP Server was closed with error:`);
            console.error(err);
        })
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
}