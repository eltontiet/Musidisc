import debug_print, { DebugLevels } from "debug/debug";
import { GatewayIntentBits, GatewayOpcodes } from "discord.js";
import WebSocket from "ws";
import config from "@config"
import User from "@customTypes/User"
import { EventEmitter } from 'events'
import voiceHandler from "./Handlers/VoiceHandler";
import VoiceInformation from "@customTypes/VoiceInformation";

export default class GatewayWorker {

    readonly INTENTS: GatewayIntentBits = GatewayIntentBits.GuildVoiceStates | GatewayIntentBits.GuildMessages

    protected url: string;
    protected websocket: WebSocket;
    protected heartbeatInterval: number;
    protected dispatchHandler: Function;

    protected user;
    protected resumeUrl: string;
    protected sessionId: string;
    protected application;
    protected serverID: string; // TODO: Do something with this (Set so it can only listen and interact to this guild.)

    protected sequenceNum: number;
    protected heartbeatsSinceResponse: number;
    protected closed: boolean = false;

    private users: Record<string, User>;

    private voiceCompleted: any | EventEmitter; // Bypass errors for on and emit locally, TODO: should figure out why

    constructor(url, serverID, props?) {
        this.url = url;
        this.users = {};
        this.serverID = serverID;
        this.initProps(props); // TODO: band-aid method, should create factory/extract websocket as its own things
        this.connect();
    }

    protected initProps(props) {

    }

    protected connect() {
        this.websocket = new WebSocket(this.url);
        this.websocket.on('open', () => {
            console.log(`Connected to server at ${this.url}`);
            console.log(`Sending IDENTIFY state`);
            this.sendIdentify();
        })

        this.addMessageHandlers();

        // Handle errors instead of automatically resuming
        this.addClosedHandlers();
    }

    protected addClosedHandlers() {
        this.websocket.on('close', (res) => {
            console.error(res);

            if (res === 4003 || res === 4006 || res === 4014) {
                console.error("Session was closed by Discord, start a new session to reconnect")
                this.closeConnection();
            }

            if (!this.closed) {
                console.error(`Gateway was closed, reconnecting after one second`);
                setTimeout(() => {
                    this.resume();
                }, 1000);
            } else {
                console.log("Connection Closed")
            }
        })

        this.websocket.on('error', (e) => console.error(e));
    }

    protected sendIdentify() {
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
    }

    protected resume() {
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

        this.addClosedHandlers();
    }

    protected addMessageHandlers() {
        this.websocket.on('message', (data) => {
            debug_print(`Got message ${data}`, DebugLevels.DEBUG);

            let json = JSON.parse(data.toString());

            if (json.s !== undefined) this.sequenceNum = json.s;
            // Receive Reconnect and Invalid Session
            switch (json.op) {
                case GatewayOpcodes.Hello:
                    this.heartbeatInterval = json.d.heartbeat_interval;
                    this.heartbeatsSinceResponse = 0;
                    this.heartbeat(this.heartbeatInterval * Math.random());
                    break;
                case GatewayOpcodes.Heartbeat:
                    this.sendHeartbeat();
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

    protected heartbeat(timeout: number) {
        setTimeout(() => {
            debug_print("Sending heartbeat", DebugLevels.DEBUG)
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

    protected sendHeartbeat() {
        if (!this.closed) {
            try {
                this.websocket.send(JSON.stringify({
                    op: GatewayOpcodes.Heartbeat,
                    d: this.sequenceNum
                }))
            } catch (e) {
                console.error(e);
                this.closeConnection();
            }

        }
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
            debug_print("Detected user voice state change", DebugLevels.DEBUG);
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

    public sendData(json: Object) {
        debug_print("Sending data... ")
        this.websocket.send(JSON.stringify(json));
    }

    public async getVoiceInformation(serverID, channelID): Promise<VoiceInformation> {

        while (!this.user) {
            await new Promise((res) => setTimeout(res, 200)); // wait for gateway handler to be ready, TODO: Use state + events for this
        }

        this.voiceCompleted = new EventEmitter();

        // Set up promise:
        let promise = new Promise<VoiceInformation>((res, err) => {
            this.voiceCompleted.on('voice', res);
        })

        // Call send with voice state: 
        this.sendVoiceStateUpdate(serverID, channelID);

        this.setDispatchHandler(voiceHandler(this.user.id, this.voiceCompleted));

        return promise;
    }

    private sendVoiceStateUpdate(serverID, channelID) {
        let payload = {
            op: 4,
            d: {
                guild_id: serverID,
                channel_id: channelID,
                self_mute: false,
                self_deaf: false
            }
        }

        this.sendData(payload);
    }

    public getUserChannel(userID): string {
        return this.users[userID]?.channel_id;
    }

    public closeConnection(): void {
        debug_print("Closing Connection");
        this.closed = true;
        this.websocket.close(1000);
    }

    public isClosed(): boolean {
        return this.closed;
    }

    public disconnect(serverID: string) {
        this.sendVoiceStateUpdate(serverID, null);
    }
}