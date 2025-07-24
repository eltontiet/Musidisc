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
import addResultToQueue from "../Handlers/QueueHandler";

var worker;

export default async function play(req, res) {
    let interaction = req.body as ApplicationCommand;

    debug_print("Running the play function");

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

    let searchResults = await YoutubeAPIHandler.search(req.body.data.options.find((a) => a.name == 'name').value);
    let result = searchResults.results[0];

    addResultToQueue(req, res, result);
}