import GatewayWorker from "./GatewayWorker";

const GATEWAY_URL = "https://discord.com/api/v10/gateway"

var gatewayWebSocketUrl;

async function getGatewayUrl() {
    return await fetch(GATEWAY_URL).then((res) => {
        if (res.status === 200) {
            return res.json().then((body) => body.url);
        } else {
            return "";
        }
    })
}

export default async function createGatewayConnection() {
    if (gatewayWebSocketUrl === undefined || gatewayWebSocketUrl === "") {
        gatewayWebSocketUrl = await getGatewayUrl();
        if (gatewayWebSocketUrl === "") throw Error("Cannot get gateway url");
    }

    return new GatewayWorker(`${gatewayWebSocketUrl}/?v=10&encoding=json`);
}