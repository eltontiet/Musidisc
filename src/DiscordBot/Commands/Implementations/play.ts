import { GatewayWorkerCache } from "DiscordBot/Gateway/GatewayWorkerCache";
import VoiceWorker from "DiscordBot/Gateway/VoiceWorker/VoiceWorker";
import { VoiceWorkerCache } from "DiscordBot/Gateway/VoiceWorker/VoiceWorkerCache";
import debug_print from "debug/debug";
import { ApplicationCommand, InteractionResponseType } from "discord.js";

var worker;

export default async function play(req, res) {
    let interaction = req.body as ApplicationCommand;

    debug_print("Running the play function");



    let gatewayWorker = await GatewayWorkerCache.get("");

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

    if (voiceWorker === undefined || voiceWorker === null || voiceWorker.isClosed()) {
        let voiceInformation = await gatewayWorker.getVoiceInformation(serverID, channelID);

        // Setup VoiceWorker

        voiceWorker = new VoiceWorker(voiceInformation);

        VoiceWorkerCache.add(serverID, voiceWorker);

    }


    // TODO: Send music data
}