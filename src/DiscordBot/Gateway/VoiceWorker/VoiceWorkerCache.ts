import VoiceWorker from "./VoiceWorker";

export class VoiceWorkerCache {
    // TODO: Create cache for each server
    private static cache: Record<string, VoiceWorker>;

    public static get(serverID?: string) {
        if (this.cache === undefined || this.cache === null) {
            this.cache = {};
        }

        serverID = serverID === undefined ? "" : serverID;

        return this.cache[serverID];
    }

    public static add(serverID: string, voiceWorker: VoiceWorker) {
        this.cache[serverID] = voiceWorker;
    }
}