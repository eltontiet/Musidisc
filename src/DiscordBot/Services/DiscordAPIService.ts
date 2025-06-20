import config from '@config'
import { Message, VoiceState } from '@customTypes/DiscordCommand';

const DISCORD_API_ENDPOINT = `https://discord.com/api/v10`
const WEBHOOK_ENDPOINT = `${DISCORD_API_ENDPOINT}/webhooks/${config.DISCORD_APPLICATION_ID}`

const DISCORD_API_HEADERS = {
    "Content-Type": "application/json",
    "Authorization": `Bot ${config.DISCORD_BOT_TOKEN}`,
}

export async function getVoiceInformation(guild_id: string, user_id: string): Promise<VoiceState> {
    let get_user_voice_endpoint = `${DISCORD_API_ENDPOINT}/guilds/${guild_id}/voice-states/${user_id}`;

    return fetch(get_user_voice_endpoint, {
        method: "GET",
        headers: DISCORD_API_HEADERS
    }).then(
        (res) => res.json()
    ).catch((e) => {
        throw e
    });
}

export async function editFollowupMessage(token: string, message: Object): Promise<Message> { // 
    let edit_original_message_endpoint = `${WEBHOOK_ENDPOINT}/${token}/messages/@original?` + new URLSearchParams({
        'with_components': 'true'
    });

    return fetch(edit_original_message_endpoint, {
        method: "PATCH",
        headers: DISCORD_API_HEADERS,
        body: JSON.stringify(message),
    }).then(
        (res) => res.json()
    ).catch((e) => {
        throw e
    });
}

export async function createFollowupMessage(token: string, message: Object): Promise<Message> { // 
    let create_followup_message_endpoint = `${WEBHOOK_ENDPOINT}/${token}?` + new URLSearchParams({
        'with_components': 'true'
    });

    return fetch(create_followup_message_endpoint, {
        method: "POST",
        headers: DISCORD_API_HEADERS,
        body: JSON.stringify(message),
    }).then(
        (res) => res.json()
    ).catch((e) => {
        throw e
    });
}