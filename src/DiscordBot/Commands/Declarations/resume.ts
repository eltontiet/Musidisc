import DiscordCommand from "@customTypes/DiscordCommand";

export default function pause(): DiscordCommand {
    return {
        name: "resume",
        description: "Resumes playback"
    }
}