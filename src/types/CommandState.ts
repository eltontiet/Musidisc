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