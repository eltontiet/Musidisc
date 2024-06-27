import DiscordCommand from "@customTypes/DiscordCommand";

export default function stop(): DiscordCommand {
    return {
        name: "stop",
        description: "Stops playback"
    }
}