import DiscordCommand, { DiscordCommandOptionType } from "@customTypes/DiscordCommand";

export default function play(): DiscordCommand {
    return {
        name: "play",
        description: "Plays a song using the link or, if not a link, searches and plays the top result.",
        options: [{
            name: "name",
            description: "The name or url of the video to be played",
            required: true,
            type: DiscordCommandOptionType.STRING
        }]
    }
}