import { GatewayWorkerCache } from "DiscordBot/Gateway/GatewayWorkerCache";
import VoiceWorker from "DiscordBot/Gateway/VoiceWorker/VoiceWorker";
import { VoiceWorkerCache } from "DiscordBot/Gateway/VoiceWorker/VoiceWorkerCache";
import debug_print from "debug/debug";
import { ApplicationCommand, InteractionResponseType } from "discord.js";
import * as YoutubeAPIHandler from "@VideoHandlers/YoutubeVideoHandler/YoutubeAPIHandler";
import YoutubeFileQueueObject from "DiscordBot/Gateway/VoiceWorker/Audio/YoutubeFileQueueObject";
import LocalFileQueueObject from "DiscordBot/Gateway/VoiceWorker/Audio/LocalFileQueueObject";

var worker;

export default async function play(req, res) {
    let interaction = req.body as ApplicationCommand;

    debug_print("Running the play function");



    let gatewayWorker = await GatewayWorkerCache.get("");

    // TODO: change how channel is found to use the api call instead.

    let channelID = gatewayWorker.getUserChannel(req.body.member.user.id);

    let data = {
        content: `Got play! Thanks for running the command <@${req.body.member.user.id}>\n` +
            (channelID !== undefined && channelID !== null ? `Joining server with ID ${channelID}` :
                `You're not in a server! Try rejoining if you are in one`)
    }

    res.status(200).send({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: data
    })

    if (channelID === undefined || channelID === null) return;

    let serverID = req.body.guild_id;
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

    console.log(searchResults.results[0].id);
    console.log(searchResults.results[0].title);
    console.log(searchResults.results[0].length);

    audioHandler.addToQueue(new YoutubeFileQueueObject(searchResults.results[0]));

    // audioHandler.addToQueue(new YoutubeFileQueueObject(searchResults.results[0]));
    audioHandler.addToQueue(new LocalFileQueueObject());
    // audioHandler.addToQueue(new LocalFileQueueObject());
    // audioHandler.addToQueue(new LocalFileQueueObject());
    // audioHandler.addToQueue(new LocalFileQueueObject());
    audioHandler.playSong();
    // TODO: Send music data
}