import debug_print, { DebugLevels } from "debug/debug";
import { handle_search_callback, handle_select_result_callback } from "../Implementations/search";


/**
 * Button interactions must have a custom_id in the form of [name]_[data]
 * 
 * e.g. A search will be search_next_[search hash]
 *      where "search" is an identifier to forward the request to
 *      and "next_[search hash]" is the data required for the callback
 */
export default function handleButtonInteraction(req, res) {
    let data = req.body.data;

    let custom_id: string = data.custom_id;

    let type = custom_id.slice(0, custom_id.search("_"))

    debug_print(`Button interaction type: ${type}`, DebugLevels.DEBUG)

    switch (type) {
        case "search":
            handle_search_callback(req, res);
            break;
        case "result":
            handle_select_result_callback(req, res);
            break;
    }

}