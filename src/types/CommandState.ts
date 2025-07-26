import QueueObject from "DiscordBot/Gateway/VoiceWorker/Audio/QueueObject"
import { Result } from "./Results"

export interface CommandState {
    id: string,
    server_id: string,
    payload: CommandData
}

export interface CommandData {

}

export interface SearchCommandData extends CommandData {
    result: Result
}

export interface QueueRequest {
    queue: QueueObject[],
    current_page: number
}