import path from 'path'
import fs from 'fs'
import config from '@config'

const CMD_FOLDER = path.join(process.cwd() + "/src/DiscordBot/Commands/Declarations");

const DISCORD_PUT_ENDPOINT = `https://discord.com/api/v10/applications/${config.DISCORD_APPLICATION_ID}/commands`

const DISCORD_PUT_OPTIONS = {
    method: "PUT",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bot ${config.DISCORD_BOT_TOKEN}`,
    }
}

fs.readdir(CMD_FOLDER, (err, files) => {
    if (err) {
        console.error(`The files could not be read: ${err}`);
    } else {
        let commands = []
        let promises = []
        files.forEach((file) => {
            console.log(`Found ${file}, running function now`);
            promises.push(import(`${CMD_FOLDER}/${file}`).then(m => {
                console.log(m.default());
                commands.push(m.default());
            }));
        })

        Promise.all(promises).then(m => {
            let options = DISCORD_PUT_OPTIONS;
            options["body"] = JSON.stringify(commands);

            fetch(DISCORD_PUT_ENDPOINT, options).then(m => {
                return m.json();
            }).then(m => {
                console.log(m);
                if (m.errors) {
                    for (let i in m.errors) {
                        console.log(m.errors[i]);
                    }
                }
            });
        })
    }
})
