import { search } from "@VideoHandlers/YoutubeVideoHandler/YoutubeAPIHandler";
import QueueObject from "./QueueObject";
import YoutubeFileQueueObject from "./YoutubeFileQueueObject";
import { Result } from "@customTypes/Results";

export default class SpotifyTrackQueueObject extends QueueObject {

    private track: SpotifySearchResult;

    constructor(track: SpotifySearchResult) {
        super();
        this.track = track;
    }

    private youtubeFile: YoutubeFileQueueObject;

    private async getYoutubeFile() {
        let results = await search(`${this.track.name} - ${this.track.artists.join(",")}`);

        this.youtubeFile = new YoutubeFileQueueObject(results.results[0]);

        return;
    }

    public async getYoutubeResult(): Promise<Result> {
        if (!this.youtubeFile) {
            await this.getYoutubeFile();
        }

        return this.youtubeFile.getResult();
    }

    public async getOpusResource() {
        if (!this.youtubeFile) {
            await this.getYoutubeFile();
        }

        return this.youtubeFile.getOpusResource();
    }

    public async getOpusResourceAtTimestamp(millis: number) {
        return this.getOpusResource();
    }

}