import { GatewayWorkerCache } from "DiscordBot/Gateway/GatewayWorkerCache";
import VoiceWorker from "DiscordBot/Gateway/VoiceWorker/VoiceWorker";
import { VoiceWorkerCache } from "DiscordBot/Gateway/VoiceWorker/VoiceWorkerCache";
import debug_print from "debug/debug";
import { ApplicationCommand, ComponentType, InteractionResponseType, MessageFlags } from "discord.js";
import * as YoutubeAPIHandler from "@VideoHandlers/YoutubeVideoHandler/YoutubeAPIHandler";
import YoutubeFileQueueObject from "DiscordBot/Gateway/VoiceWorker/Audio/YoutubeFileQueueObject";
import LocalFileQueueObject from "DiscordBot/Gateway/VoiceWorker/Audio/LocalFileQueueObject";
import { editFollowupMessage, getVoiceInformation } from "DiscordBot/Services/DiscordAPIService";
import { Component } from "@customTypes/DiscordCommand";
import { getHighestResThumbnail } from "@VideoHandlers/YoutubeVideoHandler/YoutubeAPIUtils";
import moment from "moment";
import { formatTimeFromMillis } from "DiscordBot/Util/time";

var worker;

export default async function play(req, res) {
    let interaction = req.body as ApplicationCommand;

    debug_print("Running the play function");



    let gatewayWorker = await GatewayWorkerCache.get("");


    // let channelID = gatewayWorker.getUserChannel(req.body.member.user.id); // LEGACY CODE

    let serverID = req.body.guild_id;
    let channelID = (await getVoiceInformation(serverID, req.body.member.user.id)).channel_id;


    let data = {
        content: (channelID !== undefined && channelID !== null ? `Searching...` :
            `You're not in a server! Try rejoining if you are in one`)
    }

    if (channelID === undefined || channelID === null) {
        res.status(200).send({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: data
        })

        return;

    } else {
        res.status(200).send({
            type: InteractionResponseType.DeferredChannelMessageWithSource,
            data: data
        })
    }

    let token = req.body.token;


    let voiceWorker: VoiceWorker = VoiceWorkerCache.get(serverID);

    // TODO: Implement multiple channels
    // ADD ERROR HANDLING

    // || voiceWorker.getChannelID() != channelID maybe swap or tell the user not in same channel as bot. Should check what channel the bot is in first tho

    if (voiceWorker === undefined || voiceWorker === null || voiceWorker.isClosed()) {
        let voiceInformation = await gatewayWorker.getVoiceInformation(serverID, channelID);

        // Setup VoiceWorker

        voiceWorker = new VoiceWorker(voiceInformation, channelID);

        VoiceWorkerCache.add(serverID, voiceWorker);

    }

    let searchResults = await YoutubeAPIHandler.search(req.body.data.options.find((a) => a.name == 'name').value);

    let audioHandler = voiceWorker.getAudioHandler();

    let result = searchResults.results[0];

    console.log(result.id);
    console.log(result.title);
    console.log(result.length);

    audioHandler.addToQueue(new YoutubeFileQueueObject(result));

    let queue = audioHandler.getQueue();

    let duration = moment.duration(result.length);
    let length = formatTimeFromMillis(duration.asMilliseconds());

    let thumbnail = getHighestResThumbnail(result.thumbnails);

    let components: Component[] = [
        {
            type: ComponentType.Container,
            components: [{
                type: ComponentType.Section,
                components: [{
                    type: ComponentType.TextDisplay,
                    content: `${queue.length == 1 ? "Now Playing" : "Added"} [${result.title}](https://youtu.be/${result.id}) ` +
                        `by [${result.channelTitle}](https://youtube.com/channel/${result.channelID})` +
                        `${queue.length == 1 ? "" : " to queue"}` +
                        ` ${length}`,
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

    // audioHandler.addToQueue(new LocalFileQueueObject());
    audioHandler.playSong();
    // TODO: Send music data
}