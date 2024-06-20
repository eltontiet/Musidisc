import Time from "@customTypes/Time";


/**
 * Parses the ISO 8601 time format into the Time class
 * @param duration The duration returned by the youtube API call in the form "PT#H#M#S" or "P#DT#H#M#S"
 */
export default function parseDuration(duration: string) {
    // TODO: Incomplete

    // Get days if exists

    let index = 1;
    let time: Time = {
        hours: 0,
        minutes: 0,
        seconds: 0
    }


    // Now at "T"
    index++;
}