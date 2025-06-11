import debug_print from "debug/debug";
import { ApplicationCommand, InteractionResponseType } from "discord.js";
import { GatewayWorkerCache } from "DiscordBot/Gateway/GatewayWorkerCache";
import VoiceWorker from "DiscordBot/Gateway/VoiceWorker/VoiceWorker";
import { VoiceWorkerCache } from "DiscordBot/Gateway/VoiceWorker/VoiceWorkerCache";

export default async function stop(req, res) {
    let interaction = req.body as ApplicationCommand;

    debug_print("Running the stop function");



    let gatewayWorker = await GatewayWorkerCache.get("");

    let serverID = req.body.guild_id;
    let voiceWorker: VoiceWorker = VoiceWorkerCache.get(serverID);

    let data;

    if (voiceWorker === undefined || voiceWorker === null || voiceWorker.isClosed()) {
        data = {
            content: `Got Stop! Thanks for running the command <@${req.body.member.user.id}>!\n`
                + `The bot is not connected! Doing nothing...`
        }

    } else {
        data = {
            content: `Got Stop! Thanks for running the command <@${req.body.member.user.id}>!\n`
                + `Closing the bot!`
        }
        gatewayWorker.disconnect(serverID);
        voiceWorker.stop();
        voiceWorker.closeConnection();
        VoiceWorkerCache.remove(serverID);
    }



    res.status(200).send({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: data
    })


}