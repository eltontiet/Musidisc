import DiscordCommand from "@customTypes/DiscordCommand";

export default function skip(): DiscordCommand {
    return {
        name: "skip",
        description: "Skips the current song"
    }
}