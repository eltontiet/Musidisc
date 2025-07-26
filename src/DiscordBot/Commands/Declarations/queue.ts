import DiscordCommand from "@customTypes/DiscordCommand";

export default function queue(): DiscordCommand {
    return {
        name: "queue",
        description: "Displays the queue"
    }
}