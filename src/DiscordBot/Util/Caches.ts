import { QueueRequest } from "@customTypes/CommandState";
import SearchResults, { Result } from "@customTypes/Results";

class SimpleCache<Val> { // Using generic key would not allow the cache to be assigned to {}
    // TODO: Create cache for each server
    private cache: Record<string, Val>;

    public get(key: string) {
        if (this.cache === undefined || this.cache === null) {
            this.cache = {};
        }

        return this.cache[key];
    }

    public set(key: string, val: Val) {
        if (this.cache === undefined || this.cache === null) {
            this.cache = {};
        }

        this.cache[key] = val;
    }

    public remove(key: string) {
        if (this.cache === undefined || this.cache === null) {
            this.cache = {};
        }

        delete this.cache[key];
    }
}

export var SearchResultsCache: SimpleCache<SearchResults> = new SimpleCache();

export var QueueRequestCache: SimpleCache<QueueRequest> = new SimpleCache();

