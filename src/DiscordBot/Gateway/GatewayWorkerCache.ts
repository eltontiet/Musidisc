import GatewayWorker from "./GatewayWorker"
import createGatewayConnection from "./GatewayUtil";

export class GatewayWorkerCache {
    // TODO: Create cache for each server
    private static cache: Record<string, GatewayWorker>;

    public static async get(serverID?: string) {
        if (this.cache === undefined || this.cache === null) {
            this.cache = {};
        }

        serverID = serverID === undefined ? "" : serverID;

        if (this.cache[serverID] === undefined || this.cache[serverID].isClosed()) {
            let gatewayConnection = await createGatewayConnection(serverID);
            this.cache[serverID] = gatewayConnection;
            return gatewayConnection;
        } else {
            return this.cache[serverID];
        }
    }
}