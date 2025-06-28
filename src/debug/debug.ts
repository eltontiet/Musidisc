
export enum DebugLevels {
    MINIMAL = 0,
    INFO,
    DEBUG
}

interface DebugProperties {
    flag: boolean,
    level: DebugLevels
}

export var debug_properties: DebugProperties = {
    flag: false,
    level: DebugLevels.DEBUG
};

export default function debug_print(message: string, level: DebugLevels = DebugLevels.INFO) {
    if (debug_properties.flag && level <= debug_properties.level) {
        console.log("DEBUG: " + message);
    }
}

export function getDebugLevel(val: string): DebugLevels {
    val = val.toLowerCase();
    switch (val) {
        case "minimal":
            return DebugLevels.MINIMAL;
        case "info":
            return DebugLevels.INFO;
        case "debug":
        default:
            return DebugLevels.DEBUG;
    }
}