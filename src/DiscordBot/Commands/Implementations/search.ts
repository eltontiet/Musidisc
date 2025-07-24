import { GatewayWorkerCache } from "DiscordBot/Gateway/GatewayWorkerCache";
import VoiceWorker from "DiscordBot/Gateway/VoiceWorker/VoiceWorker";
import { VoiceWorkerCache } from "DiscordBot/Gateway/VoiceWorker/VoiceWorkerCache";
import debug_print, { DebugLevels } from "debug/debug";
import { ApplicationCommand, ButtonStyle, ComponentType, InteractionResponseType, MessageFlags } from "discord.js";
import * as YoutubeAPIHandler from "@VideoHandlers/YoutubeVideoHandler/YoutubeAPIHandler";
import YoutubeFileQueueObject from "DiscordBot/Gateway/VoiceWorker/Audio/YoutubeFileQueueObject";
import LocalFileQueueObject from "DiscordBot/Gateway/VoiceWorker/Audio/LocalFileQueueObject";
import { editFollowupMessage, getVoiceInformation } from "DiscordBot/Services/DiscordAPIService";
import { Component } from "@customTypes/DiscordCommand";
import { getHighestResThumbnail } from "@VideoHandlers/YoutubeVideoHandler/YoutubeAPIUtils";
import moment from "moment";
import { formatTimeFromMillis } from "DiscordBot/Util/time";
import SearchResults, { Result } from "@customTypes/Results";
import { Section } from "discord-interactions";
import { SearchResultsCache } from "DiscordBot/Util/Caches";
import addResultToQueue from "../Handlers/QueueHandler";

const TIMEOUT = 5 * 60 * 1000 // 5 mins * 60 secs/min * 1000 ms/sec

function buildSearchResponse(searchResults: SearchResults): Component[] {
    let resultsHash = searchResults.tag; // TODO: For now use the tag
    SearchResultsCache.set(resultsHash, searchResults);
    setTimeout((resultsHash) => { SearchResultsCache.remove(resultsHash) }, TIMEOUT, resultsHash) // 5 mins * 60 secs * 

    let resultSections: Component[] = []

    searchResults.results.forEach((result, index) => {
        resultSections.push(createSearchSection(result, `result_${index}_${resultsHash}`));
        resultSections.push({ type: ComponentType.Separator });
    });

    resultSections.pop() // remove last separator

    let components: Component[] = [
        {
            type: ComponentType.Container,
            components: [...resultSections, {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Secondary,
                        custom_id: `search_prev_${resultsHash}`,
                        label: "Previous Page",
                        disabled: (searchResults.prevPageToken === undefined) ? "true" : "false"
                    },
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Secondary,
                        custom_id: `search_next_${resultsHash}`,
                        label: "Next Page",
                        disabled: (searchResults.nextPageToken === undefined) ? "true" : "false"
                    }
                ]
            }]
        }
    ]

    return components
}

function createSearchSection(result: Result, hash: string): Component {
    let duration = moment.duration(result.length);
    let length = formatTimeFromMillis(duration.asMilliseconds());

    return {
        type: ComponentType.Section,
        components: [{
            type: ComponentType.TextDisplay,
            content: `[${result.title}](https://youtu.be/${result.id}) ` +
                `by [${result.channelTitle}](https://youtube.com/channel/${result.channelID})` +
                ` - ${length}`,
        }],
        accessory: {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            custom_id: hash,
            label: "Select"
        }
    }
}

export async function handle_search_callback(req, res) {
    let data = req.body.data;

    let custom_id: string = data.custom_id;
    let callback_data = custom_id.substring(custom_id.search("_") + 1);
    debug_print(`callback_data: ${callback_data}`, DebugLevels.DEBUG);

    let command = callback_data.slice(0, callback_data.search("_"));
    debug_print(`Search command: ${command}`, DebugLevels.DEBUG)

    let hash = callback_data.substring(callback_data.search("_") + 1);
    debug_print(`Search hash: ${hash}`, DebugLevels.DEBUG)

    debug_print("Handling search callback")
    let results = SearchResultsCache.get(hash);

    if (results === null || results === undefined) {
        res.status(200).send({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: `The request timed out! Try sending a new one!`,
                flags: MessageFlags.Ephemeral
            }
        })

        return;
    }

    let searchResults;
    if (command === "prev") {
        searchResults = await YoutubeAPIHandler.getPrevPage(results);
    } else if (command === "next") {
        searchResults = await YoutubeAPIHandler.getNextPage(results);
    }

    let components = buildSearchResponse(searchResults);

    res.status(200).send({
        type: InteractionResponseType.UpdateMessage,
        data: {
            components: components,
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        }
    })
}

export async function handle_select_result_callback(req, res) {
    let interaction_data = req.body.data;

    let custom_id: string = interaction_data.custom_id;

    let callback_data = custom_id.substring(custom_id.search("_") + 1);
    debug_print(`callback_data: ${callback_data}`, DebugLevels.DEBUG);

    let index = parseInt(callback_data.slice(0, callback_data.search("_")));
    debug_print(`Result index: ${index}`, DebugLevels.DEBUG)

    let hash = callback_data.substring(callback_data.search("_") + 1);
    debug_print(`Search hash: ${hash}`, DebugLevels.DEBUG)


    debug_print("Playing searched song");
    let result = SearchResultsCache.get(hash)?.results[index];

    let serverID = req.body.guild_id;
    let channelID = (await getVoiceInformation(serverID, req.body.member.user.id)).channel_id;

    if (result === null || result === undefined) {
        res.status(200).send({
            type: InteractionResponseType.UpdateMessage,
            data: {
                content: `The request timed out! Try sending a new one!`,
                flags: MessageFlags.Ephemeral
            }
        })

        return;
    }
    else if (channelID === undefined || channelID === null) {

        res.status(200).send({
            type: InteractionResponseType.UpdateMessage,
            data: {
                content: `You're not in a server! Try rejoining if you are in one!`,
                flags: MessageFlags.Ephemeral
            }
        })

        return;
    }
    else {
        res.status(200).send({
            type: InteractionResponseType.DeferredChannelMessageWithSource
        })
    }

    SearchResultsCache.remove(hash);

    addResultToQueue(req, res, result)
}


export default async function search(req, res) {
    debug_print("Running the search function");

    let token = req.body.token;

    res.status(200).send({
        type: InteractionResponseType.DeferredChannelMessageWithSource,
        data: {
            flags: MessageFlags.Ephemeral
        }
    })

    let searchResults = await YoutubeAPIHandler.search(req.body.data.options.find((a) => a.name == 'name').value);
    let components = buildSearchResponse(searchResults);

    let followupResponse = await editFollowupMessage(token, { // For debugging
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: components
    })
}