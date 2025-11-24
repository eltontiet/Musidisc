import VoiceWorker from "DiscordBot/Gateway/VoiceWorker/VoiceWorker";
import { VoiceWorkerCache } from "DiscordBot/Gateway/VoiceWorker/VoiceWorkerCache";
import debug_print, { DebugLevels } from "debug/debug";
import { ButtonStyle, ComponentType, InteractionResponseType, MessageFlags, resolveBuilder } from "discord.js";
import YoutubeFileQueueObject from "DiscordBot/Gateway/VoiceWorker/Audio/YoutubeFileQueueObject";
import { editFollowupMessage, getVoiceInformation } from "DiscordBot/Services/DiscordAPIService";
import { Component } from "@customTypes/DiscordCommand";
import moment from "moment";
import { formatTimeFromMillis } from "DiscordBot/Util/time";
import { QueueRequestCache } from "DiscordBot/Util/Caches";
import QueueObject from "DiscordBot/Gateway/VoiceWorker/Audio/QueueObject";
import { QueueRequest } from "@customTypes/CommandState";
import SpotifyTrackQueueObject from "DiscordBot/Gateway/VoiceWorker/Audio/SpotifyTrackQueueObject";

const TIMEOUT = 5 * 60 * 1000; // 5 mins * 60 secs/min * 1000 ms/sec
const QUEUE_ITEMS_PER_PAGE = 8;

async function buildQueueResponse(queueRequest: QueueRequest, id: string): Promise<Component[]> {

    let queue = queueRequest.queue;

    if (queue.length < (queueRequest.current_page - 1) * QUEUE_ITEMS_PER_PAGE) return undefined; // The queue can advance 
    // TODO: Maybe make the queue update as the songs play? This would keep the indices correct always

    let queueAtPage = queue.slice((queueRequest.current_page - 1) * QUEUE_ITEMS_PER_PAGE, // current_page is 1 indexed
        queueRequest.current_page * QUEUE_ITEMS_PER_PAGE);

    let queueSections = [];

    for (let queueObject of queueAtPage) {
        queueSections.push(await createQueueSection(queueObject, id));
        queueSections.push({ type: ComponentType.Separator });
    };


    if (queueSections.length === 0) {
        debug_print(`There was nothing in the queue!`);
        return [{
            type: ComponentType.TextDisplay,
            content: "There is nothing in the queue or this page! Try running the command again!",
        }]
    }

    queueSections.pop() // remove last separator

    let components: Component[] = [
        {
            type: ComponentType.Container,
            components: [...queueSections, {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Secondary,
                        custom_id: `queue_prev_${id}`,
                        label: "Previous Page",
                        disabled: (queueRequest.current_page <= 1) ? "true" : "false"
                    },
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Secondary,
                        custom_id: `queue_next_${id}`,
                        label: "Next Page",
                        disabled: (queue.length <= queueRequest.current_page * QUEUE_ITEMS_PER_PAGE) ? "true" : "false"
                    }
                ]
            }]
        }
    ]

    return components
}

async function createQueueSection(queueObject: QueueObject, id: string): Promise<Component> {

    let content = "";

    if (queueObject instanceof YoutubeFileQueueObject) {

        let result = queueObject.getResult();

        let duration = moment.duration(result.length);
        let length = formatTimeFromMillis(duration.asMilliseconds());

        content = `[${result.title}](https://youtu.be/${result.id}) ` +
            `by [${result.channelTitle}](https://youtube.com/channel/${result.channelID})` +
            ` - ${length}`;


    } else if (queueObject instanceof SpotifyTrackQueueObject) {

        let result = await queueObject.getYoutubeResult();

        let duration = moment.duration(result.length);
        let length = formatTimeFromMillis(duration.asMilliseconds());

        content = `[${result.title}](https://youtu.be/${result.id}) ` +
            `by [${result.channelTitle}](https://youtube.com/channel/${result.channelID})` +
            ` - ${length}`;


    } else {
        debug_print("The queue object does not have a component representation!", DebugLevels.INFO);

        content = "Unknown song";
    }

    return {
        type: ComponentType.Section,
        components: [{
            type: ComponentType.TextDisplay,
            content: content,
        }],
        accessory: {
            type: ComponentType.Button,
            style: ButtonStyle.Danger,
            custom_id: `queue_remove_${id}_${queueObject.id}`,
            label: "Remove"
        }
    }


}


export async function handle_queue_callback(req, res) {
    let data = req.body.data;

    let custom_id: string = data.custom_id;
    let callback_data = custom_id.substring(custom_id.search("_") + 1);
    debug_print(`callback_data: ${callback_data}`, DebugLevels.DEBUG);

    let command = callback_data.slice(0, callback_data.search("_"));
    debug_print(`Queue command: ${command}`, DebugLevels.DEBUG)

    let rest = callback_data.substring(callback_data.search("_") + 1);
    debug_print(`Queue rest: ${rest}`, DebugLevels.DEBUG)

    switch (command) {
        case "remove":
            handle_queue_remove_callback(res, rest);
            break;
        case "prev":
        case "next":
            handle_queue_page_callback(res, rest, command);
            break;
    }
}

export async function handle_queue_page_callback(res, rest, direction) {

    debug_print("Changing page of queue");

    let id = rest;

    debug_print(`Queue Request id: ${id}`, DebugLevels.DEBUG);

    let queueRequest = QueueRequestCache.get(id);

    if (queueRequest === null || queueRequest === undefined) {
        res.status(200).send({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: `The request timed out! Try sending a new one!`,
                flags: MessageFlags.Ephemeral
            }
        })

        return;
    }

    if (direction === "prev") {
        queueRequest.current_page--;
    } else if (direction === "next") {
        queueRequest.current_page++;
    }

    let components = await buildQueueResponse(queueRequest, id);

    res.status(200).send({
        type: InteractionResponseType.UpdateMessage,
        data: {
            components: components,
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        }
    })
}

export async function handle_queue_remove_callback(res, rest: string) {

    debug_print("Trying to remove song from queue");

    let id = rest.slice(0, rest.search("_"));

    let toRemoveId = rest.slice(rest.search("_") + 1);

    let queueRequest = QueueRequestCache.get(id);

    if (queueRequest === null || queueRequest === undefined) {
        res.status(200).send({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: `The request timed out! Try sending a new one!`
            }
        })

        return;
    }

    let index = queueRequest.queue.findIndex((queueObject) => queueObject.id == toRemoveId);
    let queueObject = queueRequest.queue[index];
    queueRequest.queue.splice(index, 1);

    if (!queueObject) {
        res.status(200).send({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: `The song could not be found. It was likely already played or removed previously!`
            }
        })

        return;
    }

    let songTitle = "Unknown song"

    if (queueObject instanceof YoutubeFileQueueObject) {
        songTitle = `[${queueObject.getResult().title}](https://youtu.be/${queueObject.getResult().id})`;
    } else if (queueObject instanceof SpotifyTrackQueueObject) {
        let result = await queueObject.getYoutubeResult();
        songTitle = `[${result.title}](https://youtu.be/${result.id})`;
    }

    res.status(200).send({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            flags: MessageFlags.IsComponentsV2,
            components: [
                {
                    type: ComponentType.Container,
                    components: [{
                        type: ComponentType.TextDisplay,
                        content: `Removed ${songTitle} from the queue`
                    }]
                }
            ]
        }
    })


}


export default async function queue(req, res) {
    debug_print("Running the queue function");

    let token = req.body.token;

    let serverID = req.body.guild_id;
    let channelID = (await getVoiceInformation(serverID, req.body.member.user.id)).channel_id;

    let voiceWorker: VoiceWorker = VoiceWorkerCache.get(serverID);

    if (voiceWorker === undefined || voiceWorker === null || voiceWorker.isClosed()) {
        res.status(200).send({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: `There is nothing playing!`,
                flags: MessageFlags.Ephemeral
            }
        })

        return;
    }

    let botChannelID = (await getVoiceInformation(serverID, voiceWorker.getUserID())).channel_id;
    if (channelID !== botChannelID) {
        res.status(200).send({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: `You're not in the same channel as the bot!`,
                flags: MessageFlags.Ephemeral
            }
        })

        return;
    }
    else {
        res.status(200).send({
            type: InteractionResponseType.DeferredChannelMessageWithSource,
        })
    }

    let audioHandler = voiceWorker.getAudioHandler();

    let queue = audioHandler.getQueue();
    let queueRequest: QueueRequest = {
        queue: queue,
        current_page: 1
    }

    let id = crypto.randomUUID();
    debug_print(`Queue id generated: ${id}`, DebugLevels.DEBUG);

    QueueRequestCache.set(id, queueRequest);
    setTimeout((token) => { QueueRequestCache.remove(token) }, TIMEOUT, id) // 5 mins * 60 secs * 

    let components = await buildQueueResponse(queueRequest, id);

    let followupResponse;

    if (!components) {
        followupResponse = await editFollowupMessage(token, { // For debugging
            content: "The queue is empty!"
        })
    } else {
        followupResponse = await editFollowupMessage(token, { // For debugging
            flags: MessageFlags.IsComponentsV2,
            components: components
        })
    }

    return;
}