import DiscordCommand, { DiscordCommandOptionType } from "@customTypes/DiscordCommand";
import createGatewayConnection from "DiscordBot/Gateway/GatewayUtil";
import debug_print from "debug/debug";
import { ApplicationCommand, InteractionResponse, InteractionResponseType } from "discord.js";

var worker;

export default async function play(req, res) {
    let interaction = req.body as ApplicationCommand;

    debug_print("Running the play function");

    let data = {
        content: `Got play! Thanks for running the command <@${req.body.member.user.id}>`
    }

    res.status(200).send({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: data
    })

    let GatewayWorker = await createGatewayConnection();
    // TODO: Send music data
}