import VoiceWorker from "DiscordBot/Gateway/VoiceWorker/VoiceWorker";
import { VoiceWorkerCache } from "DiscordBot/Gateway/VoiceWorker/VoiceWorkerCache";
import debug_print from "debug/debug";
import { ApplicationCommand, InteractionResponseType, ComponentType, MessageFlags } from "discord.js";
import { editFollowupMessage, getVoiceInformation } from "DiscordBot/Services/DiscordAPIService";
import { Component } from "@customTypes/DiscordCommand";


var worker;

export default async function skip(req, res) {
    let interaction = req.body as ApplicationCommand;

    debug_print("Running the skip function");

    let serverID = req.body.guild_id;
    let channelID = (await getVoiceInformation(serverID, req.body.member.user.id)).channel_id;


    if (channelID === undefined || channelID === null) {
        res.status(200).send({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: "You're not in a server! Try rejoining if you are in one"
        })

        return;
    }


    let voiceWorker: VoiceWorker = VoiceWorkerCache.get(serverID);

    if (voiceWorker === undefined || voiceWorker === null || voiceWorker.isClosed()) {
        res.status(200).send({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: "The bot is not connected!"
        })

        return;
    }

    let token = req.body.token;

    res.status(200).send({
        type: InteractionResponseType.DeferredChannelMessageWithSource
    })

    let audioHandler = voiceWorker.getAudioHandler();
    let skipped_song = audioHandler.skip();

    let components: Component[] = [
        {
            type: ComponentType.Container,
            components: [{
                type: ComponentType.TextDisplay,
                content: `Skipped [${skipped_song.title}](https://www.youtu.be/${skipped_song.id}) ` +
                    `by [${skipped_song.channelTitle}](https://youtube.com/channel/${skipped_song.channelID})`
            }]
        }
    ]

    let followupResponse = await editFollowupMessage(token, { // For debugging
        flags: MessageFlags.IsComponentsV2,
        components: components
    })

}