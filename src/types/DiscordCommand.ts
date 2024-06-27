import { InteractionType } from "discord.js"

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