import DiscordCommand from "@customTypes/DiscordCommand";

export default function pause(): DiscordCommand {
    return {
        name: "pause",
        description: "Pauses playback"
    }
}