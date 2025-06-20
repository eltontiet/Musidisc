import DiscordCommand from "@customTypes/DiscordCommand";

export default function np(): DiscordCommand {
    return {
        name: "np",
        description: "Returns the name and information of the current song"
    }
}