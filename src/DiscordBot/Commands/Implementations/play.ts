import debug_print from "debug/debug";
import { ApplicationCommand, InteractionResponseType } from "discord.js";
import * as YoutubeAPIHandler from "@VideoHandlers/YoutubeVideoHandler/YoutubeAPIHandler";
import { getVoiceInformation } from "DiscordBot/Services/DiscordAPIService";
import addResultToQueue from "../Handlers/QueueHandler";
import { url } from "inspector";

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
    let request: string = req.body.data.options.find((a) => a.name == 'name').value;

    try {
        let url = new URL(request);

        debug_print(`hostname: ${url.hostname}, pathname: ${url.pathname}`)

        if (url.hostname === "youtube.com" || url.hostname === "www.youtube.com") {
            switch (url.pathname) {
                case '/watch':
                    request = url.searchParams.get("v");
                    break;
                default:
                    debug_print(`The youtube url must link to a video or playlist`);
                    break;

                // TODO: Send error through discord
            }

        } else if (url.hostname === "youtu.be" || url.hostname === "www.youtu.be") {
            request = url.pathname.slice(1); // remove '/'
        }

        debug_print(`Request: ${request}`);

    } catch (e) {
        // request is not a url, try search
    }

    try {
        searchResults = await YoutubeAPIHandler.search(request);
    } catch (e) {
        debug_print(`There was an error fetching from the youtube api: ${e}`);

        // TODO: Send error through discord
        return;
    }

    let result = searchResults.results[0];

    addResultToQueue(req, res, result);
}