import VoiceWorker from "DiscordBot/Gateway/VoiceWorker/VoiceWorker";
import { VoiceWorkerCache } from "DiscordBot/Gateway/VoiceWorker/VoiceWorkerCache";
import debug_print from "debug/debug";
import { InteractionResponseType, MessageFlags } from "discord.js";
import { editFollowupMessage, getVoiceInformation } from "DiscordBot/Services/DiscordAPIService";


var worker;

export default async function resume(req, res) {

    debug_print("Running the resume function");

    res.status(200).send({
        type: InteractionResponseType.DeferredChannelMessageWithSource,
    })

    let serverID = req.body.guild_id;
    let token = req.body.token;
    let channelID = (await getVoiceInformation(serverID, req.body.member.user.id)).channel_id;
    if (channelID === undefined || channelID === null) {
        editFollowupMessage(token, {
            content: "You're not in a server! Try rejoining if you are in one"
        })

        return;
    }


    let voiceWorker: VoiceWorker = VoiceWorkerCache.get(serverID);
    if (voiceWorker === undefined || voiceWorker === null || voiceWorker.isClosed()) {
        editFollowupMessage(token, {
            content: "The bot is not connected!"
        })

        return;
    }

    let botChannelID = (await getVoiceInformation(serverID, voiceWorker.getUserID())).channel_id;
    if (channelID !== botChannelID) {
        editFollowupMessage(token, {
            content: `You're not in the same channel as the bot!`,
        })

        return;
    }

    let audioHandler = voiceWorker.getAudioHandler();
    if (!audioHandler.isPaused()) {
        editFollowupMessage(token, {
            content: "The bot isn't paused!"
        })

        return;
    }


    audioHandler.resume();
    editFollowupMessage(token, {
        content: "Resumed playback!"
    })

}