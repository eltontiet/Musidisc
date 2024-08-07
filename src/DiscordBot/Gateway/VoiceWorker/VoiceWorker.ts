import VoiceInformation from "@customTypes/VoiceInformation";
import GatewayWorker from "../GatewayWorker";
import { VoiceOpcodes } from "@customTypes/VoiceOpcodes";
import debug_print from "debug/debug";
import WebSocket from "ws";
import VoiceUDPHandler from "./VoiceUDPHandler"

export default class VoiceWorker extends GatewayWorker {

    private token: string;
    private nonce: number; // TODO: check against ack to make sure is same
    private user_id: string;

    private ssrc: number;
    private udpIP: string;
    private udpPort: number;
    private compressionModes: Array<string>;
    private secretKey: Uint8Array;

    private udpServer: VoiceUDPHandler;

    private lastHeartbeat;

    constructor(voiceInformation: VoiceInformation) {
        super(voiceInformation.endpoint, voiceInformation.server_id, voiceInformation);
    }

    override initProps(props: VoiceInformation): void {
        this.token = props.token;
        this.sessionId = props.session_id;
        this.user_id = props.user_id;
        this.resumeUrl = props.endpoint;
    }

    protected override sendIdentify(): void {
        this.websocket.send(JSON.stringify({
            op: VoiceOpcodes.Identify,
            d: {
                token: this.token,
                server_id: this.serverID,
                user_id: this.user_id,
                session_id: this.sessionId
            }
        }))
    }

    protected addMessageHandlers(): void {
        debug_print("Set VoiceWorker message handlers")
        this.websocket.on('message', (data) => {
            console.log(`Got message ${data}`);

            let json = JSON.parse(data.toString());

            if (json.s !== undefined) this.sequenceNum = json.s;
            // Receive Reconnect and Invalid Session
            switch (json.op) {
                case VoiceOpcodes.Hello:
                    this.heartbeatInterval = json.d.heartbeat_interval;
                    this.heartbeatsSinceResponse = 0;
                    this.heartbeat(this.heartbeatInterval);
                    break;
                case VoiceOpcodes.HeartbeatAck:
                    this.heartbeatsSinceResponse = 0;
                    break;
                case VoiceOpcodes.Ready:
                    this.ssrc = json.d.ssrc;
                    this.udpIP = json.d.ip;
                    this.udpPort = json.d.port;
                    this.compressionModes = json.d.modes;
                    this.setupUDPServer();
                    this.sendSelect(json);
                    break;
                case VoiceOpcodes.Heartbeat:
                    // this.sendHeartbeat();
                    break;
                case VoiceOpcodes.Session_Description:
                    this.secretKey = json.d.secretKey;
                    break;
            }
        });
    }

    private setupUDPServer() {
        this.udpServer = new VoiceUDPHandler(this.udpIP, this.udpPort);
        this.udpServer.sendIPDiscovery(this.ssrc);
    }

    private async sendSelect(json) {
        let output = {
            op: 1,
            d: {
                protocol: "udp",
                data: {
                    "address": await this.udpServer.getMyAddress(),
                    "port": this.udpPort,
                    "mode": "xsalsa20_poly1305"
                }
            }
        }

        this.sendData(output);
    }

    private async sendSpeaking(json) {
        let output = {
            op: 5,
            d: {
                speaking: 1,
                delay: 0,
                ssrc: this.ssrc
            }
        }

        this.sendData(output);
    }

    private async stopSpeaking(json) {
        let output = {
            op: 5,
            d: {
                speaking: 0,
                delay: 0,
                ssrc: this.ssrc
            }
        }

        this.sendData(output);
    }

    protected override heartbeat(timeout: number): void {
        setTimeout(() => {
            debug_print("Sending heartbeat")
            this.sendHeartbeat();

            if (this.heartbeatsSinceResponse < 2 && !this.closed) {
                this.heartbeat(this.heartbeatInterval);
                this.heartbeatsSinceResponse++;
            } else {
                console.error("No ack was seen before last heartbeat, reconnecting")
                this.websocket.close();

            }

        }, timeout);
    }

    protected override sendHeartbeat() {
        this.lastHeartbeat = Date.now();
        let nonce = this.lastHeartbeat;
        this.websocket.send(JSON.stringify({
            op: VoiceOpcodes.Heartbeat,
            d: nonce
        }));
    }

    protected override resume() {
        this.websocket = new WebSocket(this.resumeUrl);
        this.websocket.on('open', () => {
            console.log(`Connected to server at ${this.resumeUrl}`);
            this.websocket.send(JSON.stringify({
                op: VoiceOpcodes.Resume,
                d: {
                    token: this.token,
                    session_id: this.sessionId,
                    seq: this.sequenceNum
                }
            }))
        })

        this.addMessageHandlers();

        this.addClosedHandlers();
    }

    public override closeConnection() {
        super.closeConnection();
    }

    /** 
     * 
     * TODO NEXT:
     * 
     * Send Select payload (Opcode 1)
     * Do IP Discovery
     * get session description (includes secret key)
     * Set speaking payload (Opcode 5)
     * Encrypt and send voice
     * Hope everything works and the heartbeats are not a problem!
     * 
     */

}