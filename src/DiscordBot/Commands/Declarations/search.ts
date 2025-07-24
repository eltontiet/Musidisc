import DiscordCommand, { DiscordCommandOptionType } from "@customTypes/DiscordCommand";

export default function search(): DiscordCommand {
    return {
        name: "search",
        description: "Searches for a song to play.",
        options: [{
            name: "name",
            description: "The name or the video to be played",
            required: true,
            type: DiscordCommandOptionType.STRING
        }]
    }
}