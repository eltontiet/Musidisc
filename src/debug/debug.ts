
interface DebugProperties {
    flag: boolean
}

export var debug_properties: DebugProperties = {
    flag: false
};

export default function debug_print(message: string) {
    if (debug_properties.flag) {
        console.log("DEBUG: " + message)
    }
}