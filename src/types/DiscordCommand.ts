import { InteractionType, User } from "discord.js"

export default interface DiscordCommand {
    name: string,
    description: string,
    options?: DiscordCommandOption[],
    default_member_permissions?: string,
    integration_types?: IntegrationType[],
    contexts?: InteractionContextType[],



}

export interface DiscordCommandOption {
    type: DiscordCommandOptionType,
    name: string,
    description: string,
    required: boolean,
    choices?: DiscordCommandOptionChoice[],
    options?: DiscordCommandOption[],
    autocomplete?: boolean
}

export interface DiscordCommandOptionChoice {
    name: string,
    value: string | number
}

export enum DiscordCommandOptionType {
    NONE,
    SUB_COMMAND,
    SUB_COMMAND_GROUP,
    STRING,
    INTEGER,
    BOOLEAN,
    USER,
    CHANNEL,
    ROLE,
    MENTIONABLE,
    NUMBER,
    ATTACHMENT
}

export enum IntegrationType {
    GUILD_INSTALL,
    USER_INSTALL
}

export enum InteractionContextType {
    GUILD,
    BOT_DM,
    PRIVATE_CHANNEL
}

export interface DiscordInteractionObject {
    id: string,
    application_id: string,
    type: InteractionType,

}


export interface VoiceState {
    guild_id: string,
    channel_id?: string,
    user_id: string,
    member?: Object, // guild member object: see https://discord.com/developers/docs/resources/guild#guild-member-object
    session_id: string,
    deaf: boolean,
    mute: boolean,
    self_deaf: boolean,
    self_mute: boolean,
    self_stream?: boolean,
    self_video: boolean,
    suppress: boolean,
    request_to_speak_timestamp?: string // ISO8601 timestamp
}

export interface Message {
    id: string,
    channel_id: string,
    author: User,
    content: string,

    // ...

    components?: Object[], // array of component objects: https://discord.com/developers/docs/components/reference#component-object


    [key: string]: any
}

export interface Component {
    type: number,
    id?: number,
    [key: string]: unknown
}