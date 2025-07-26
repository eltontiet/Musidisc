import debug_print from "debug/debug";
import { ApplicationCommand, InteractionResponseType } from "discord.js";
import * as YoutubeAPIHandler from "@VideoHandlers/YoutubeVideoHandler/YoutubeAPIHandler";
import { getVoiceInformation } from "DiscordBot/Services/DiscordAPIService";
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

    let searchResults;

    try {
        searchResults = await YoutubeAPIHandler.search(req.body.data.options.find((a) => a.name == 'name').value);
    } catch (e) {
        debug_print(`There was an error fetching from the youtube api: ${e}`);

        // TODO: Send error through discord
        return;
    }

    let result = searchResults.results[0];

    addResultToQueue(req, res, result);
}