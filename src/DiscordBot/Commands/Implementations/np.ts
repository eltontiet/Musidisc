import VoiceWorker from "DiscordBot/Gateway/VoiceWorker/VoiceWorker";
import { VoiceWorkerCache } from "DiscordBot/Gateway/VoiceWorker/VoiceWorkerCache";
import debug_print from "debug/debug";
import { ApplicationCommand, ComponentType, InteractionResponseType, MessageFlags } from "discord.js";
import { createFollowupMessage, editFollowupMessage, getVoiceInformation } from "DiscordBot/Services/DiscordAPIService";
import { Component } from "@customTypes/DiscordCommand";
import { Result } from "@customTypes/Results";
import { getHighestResThumbnail } from "@VideoHandlers/YoutubeVideoHandler/YoutubeAPIUtils";


var worker;

export default async function np(req, res) {
    let interaction = req.body as ApplicationCommand;

    debug_print("Running the now playing function!");


    // let channelID = gatewayWorker.getUserChannel(req.body.member.user.id); // LEGACY CODE

    let serverID = req.body.guild_id;
    let channelID = (await getVoiceInformation(serverID, req.body.member.user.id)).channel_id;
    let token = req.body.token;

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

    res.status(200).send({
        type: InteractionResponseType.DeferredChannelMessageWithSource
    })

    let audioHandler = voiceWorker.getAudioHandler();

    let result: Result = audioHandler.getCurrentSong();

    let thumbnail = getHighestResThumbnail(result.thumbnails);

    // TODO: have a text formattor to have a max width of container

    let components: Component[] = [
        {
            type: ComponentType.Container,
            components: [{
                type: ComponentType.Section,
                components: [{
                    type: ComponentType.TextDisplay,
                    content: `Now Playing [${result.title}](https://youtu.be/${result.id}) by [${result.channelTitle}](https://youtube.com/channel/${result.channelID})\n` +
                        `${audioHandler.getCurrentTime()}/${result.length}`,
                }],
                accessory: {
                    type: ComponentType.Thumbnail,
                    media: {
                        url: thumbnail.url
                    }
                }
            }]
        }
    ]

    let followupResponse = await editFollowupMessage(token, { // For debugging
        flags: MessageFlags.IsComponentsV2,
        components: components
    })

    return;
}