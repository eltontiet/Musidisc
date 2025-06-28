const SECONDS_IN_MILLIS = 1000;
const MINUTES_IN_MILLIS = SECONDS_IN_MILLIS * 60;
const HOURS_IN_MILLIS = MINUTES_IN_MILLIS * 60;

export function formatTimeFromMillis(millis: number) {
    let length = millis;

    let hours = Math.floor(millis / HOURS_IN_MILLIS);
    let minutes = Math.floor(millis / MINUTES_IN_MILLIS) % 60;
    let seconds = Math.floor(millis / SECONDS_IN_MILLIS) % 60;

    if (hours > 0) {
        let minutes_string = (minutes < 10 ? "0" : "") + minutes;
        let seconds_string = (seconds < 10 ? "0" : "") + seconds;
        return `${hours}:${minutes_string}:${seconds_string}`;
    } else {
        let seconds_string = (seconds < 10 ? "0" : "") + seconds;
        return `${minutes}:${seconds_string}`;
    }
}