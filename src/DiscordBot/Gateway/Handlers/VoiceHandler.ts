import debug_print from "debug/debug";
import VoiceInformation from "@customTypes/VoiceInformation";

export default function voiceHandler(botID, eventHandler): (json: any) => void {

    let state_received: boolean = false;
    let server_received: boolean = false;
    let stop_receiving: boolean = false;

    let info = {};

    return (json) => {
        if (stop_receiving) return;

        if (json.t === "VOICE_STATE_UPDATE") {
            debug_print("Got Voice State Update");
            if (json.d.member.user.id === botID) {
                info["user_id"] = json.d.user_id;
                info["session_id"] = json.d.session_id;
                info["server_id"] = json.d.guild_id;
                state_received = true;
            }
        } else if (json.t === "VOICE_SERVER_UPDATE") {
            debug_print("Got Voice Server Update");
            info["token"] = json.d.token;
            info["endpoint"] = `wss://${json.d.endpoint}?v=7`;
            server_received = true;
        }

        if (state_received && server_received) {
            let voiceInformation: VoiceInformation = info as VoiceInformation;
            eventHandler.emit('voice', voiceInformation);
            stop_receiving = true;
        }
    }
}