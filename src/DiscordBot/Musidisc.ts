import debug_print from "debug/debug";
import { InteractionResponseType, InteractionType, time } from "discord.js";
import express from "express"
import { verifyKeyMiddleware } from "discord-interactions";
import config from '@config';
import fs from 'fs';
import path from 'path'
import { GatewayWorkerCache } from "./Gateway/GatewayWorkerCache";

const app = express();
const port = 3000;
const CMD_FOLDER = path.join(process.cwd() + "/src/DiscordBot/Commands/Implementations");

var commands;
var gatewayWorker;

export default async function StartBot() {
    debug_print("Starting up bot");

    gatewayWorker = GatewayWorkerCache.get("");

    configureMiddleware();
    configureEndpoints();
    commands = await getCommandImplementations();
    app.listen(port, () => {
        console.log(`Discord app running on port ${port}`);
    })
}

function configureMiddleware() {
}

function configureEndpoints() {

    app.post('/interactions', verifyKeyMiddleware(config.DISCORD_PUBLIC_KEY), async (req, res) => {
        debug_print("Recieved post at '/interactions'");

        if (req.body["type"] === InteractionType.Ping) {
            console.log("Recieved Ping!")
            return res.status(200).send({
                "type": InteractionResponseType.Pong
            })
        }

        if (req.body.type === InteractionType.ApplicationCommand) {
            console.log(`Recieved command ${req.body.data.name}`);

            let commandName = req.body.data.name;

            console.log(commands)
            console.log(commandName)

            return commands[commandName](req, res);


        }
    })
}


async function getCommandImplementations(): Promise<Record<string, Function>> {
    let commands: Record<string, Function> = {};
    fs.readdir(CMD_FOLDER, (err, files) => {
        if (err) {
            console.error(`The files could not be read: ${err}`);
            throw new Error("The implementation folder could not be read");
        } else {
            let promises = []
            files.forEach((file) => {
                console.log(`Found ${file}, getting implementation now`);
                promises.push(import(`${CMD_FOLDER}/${file}`).then(m => {

                    let name = file.slice(0, -3);
                    debug_print(`Adding ${name} to the commands dict`);
                    commands[name] = m.default;
                }));
            })

            return Promise.all(promises).then(() => commands);
        }
    })

    console.log(commands);

    return commands;
}