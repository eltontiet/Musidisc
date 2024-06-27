import debug_print from "debug/debug";
import { GatewayIntentBits, GatewayOpcodes, IntentsBitField } from "discord.js";
import WebSocket from "ws";
import config from "@config"
import User from "@customTypes/User"

export default class GatewayWorker {

    readonly INTENTS: GatewayIntentBits = GatewayIntentBits.GuildVoiceStates | GatewayIntentBits.GuildMessages

    private url: string;
    private websocket: WebSocket;
    private heartbeatInterval: number;
    private dispatchHandler: Function;

    private user;
    private resumeUrl: string;
    private sessionId: string;
    private application;

    private sequenceNum: number;
    private heartbeatsSinceResponse: number;

    private users: Record<string, User>;

    constructor(url) {
        this.url = url;
        this.users = {};
        this.connect();
    }

    private connect() {
        this.websocket = new WebSocket(this.url);
        this.websocket.on('open', () => {
            console.log(`Connected to server at ${this.url}`);
            console.log(`Sending IDENTIFY state`);
            this.websocket.send(JSON.stringify({
                op: GatewayOpcodes.Identify,
                d: {
                    token: config.DISCORD_BOT_TOKEN,
                    intents: this.INTENTS,
                    properties: {
                        os: "windows",
                        browser: "Musidisc",
                        device: "Musidisc"
                    }
                }
            }))
        })

        this.addMessageHandlers();

        // Handle errors instead of automatically resuming
        this.websocket.on('close', (res) => {
            console.error(res);
            console.error(`Gateway was closed, reconnecting after one second`);
            setTimeout(() => {
                this.resume();
            }, 1000);
        })
    }

    private resume() {
        this.websocket = new WebSocket(this.resumeUrl);
        this.websocket.on('open', () => {
            console.log(`Connected to server at ${this.resumeUrl}`);
            this.websocket.send(JSON.stringify({
                op: GatewayOpcodes.Resume,
                d: {
                    token: config.DISCORD_BOT_TOKEN,
                    session_id: this.sessionId,
                    seq: this.sequenceNum
                }
            }))
        })

        this.addMessageHandlers();

        this.websocket.on('close', () => {
            console.error(`Gateway was closed, reconnecting after one second`);
            setTimeout(() => {
                this.resume();
            }, 1000);
        })
    }

    private addMessageHandlers() {
        this.websocket.on('message', (data) => {
            console.log(`Got message ${data}`);

            let json = JSON.parse(data.toString());

            if (json.s !== undefined) this.sequenceNum = json.s;
            // Receive Reconnect and Invalid Session
            switch (json.op) {
                case GatewayOpcodes.Hello:
                    this.heartbeatInterval = json.d.heartbeat_interval;
                    this.heartbeatsSinceResponse = 0;
                    this.heartbeat(this.heartbeatInterval * Math.random());
                    break;
                case GatewayOpcodes.HeartbeatAck:
                    this.heartbeatsSinceResponse = 0;
                    break;
                case GatewayOpcodes.Dispatch:
                    this.handleDispatch(json);
                    break;
            }
        });
    }

    private heartbeat(timeout: number) {
        setTimeout(() => {
            debug_print("Sending heartbeat")
            this.websocket.send(JSON.stringify({
                op: GatewayOpcodes.Heartbeat,
                d: this.sequenceNum
            }))

            if (this.heartbeatsSinceResponse < 2) {
                this.heartbeat(this.heartbeatInterval);
                this.heartbeatsSinceResponse++;
            } else {
                console.error("No ack was seen before last heartbeat, reconnecting")
                this.websocket.close();

            }

        }, timeout);
    }

    private handleDispatch(json) {
        if (json.t === "READY") {
            debug_print("Socket is ready!")
            this.user = json.d.user;
            this.resumeUrl = json.d.resume_gateway_url + `/?v=10&encoding=json`;
            this.sessionId = json.d.session_id;
            this.application = json.d.application
            return;
        } else if (json.t === "VOICE_STATE_UPDATE") {
            debug_print("Detected user voice state change");
            this.users[json.d.member.user.id] = { channel_id: json.d.channel_id, id: json.d.member.user.id, username: json.d.member.user.username };

            console.log(this.users[json.d.member.user.id]);
        }



        if (this.dispatchHandler !== undefined && this.dispatchHandler !== null && this.dispatchHandler instanceof Function) {
            debug_print("Running dispatch handler");
            this.dispatchHandler(json)
        }
    }

    public setDispatchHandler(handler: Function) {
        this.dispatchHandler = handler;
    }

    public sendData(json: JSON) {
        debug_print("Sending data... ")
        this.websocket.send(JSON.stringify(json));
    }
}