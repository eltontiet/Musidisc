import config from '@config'
import * as yth from '@VideoHandlers/YoutubeVideoHandler/YoutubeAPIHandler'
import * as YoutubeVideo from '@VideoHandlers/YoutubeVideoHandler/YoutubeVideoHandler'
import { debug_properties, getDebugLevel } from 'debug/debug'
import StartBot from 'DiscordBot/Musidisc'
import prism from 'prism-media';
import fs from 'fs';

process.argv.forEach((val, index) => {
    if (val === "-D") debug_properties.flag = true;
    if (val === "-L") var level_index = index + 1;
    if (level_index == index) debug_properties.level = getDebugLevel(val);
})

// fs.createReadStream("./tmp/spying.opus")
//     .pipe(new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 }))
//     .pipe(fs.createWriteStream("./tmp/spying.pcm"));


StartBot();


// yth("Payphone").then((searchResults) => {
//     console.log(searchResults);
//     yvh(searchResults.results[0].id);
// })


// yth.search("Payphone").then((searchResults) => {
//     return YoutubeVideo.downloadVideo(searchResults.results[0].id);
// }).then((videoStream) => {

//     console.log("Got video stream");
//     let transcoder = new prism.FFmpeg({
//         args: [
//             '-analyzeduration', '0',
//             '-f', 's16le',
//             '-ar', '48000',
//             '-ac', '2',
//         ]
//     })


//     return fs.createReadStream("./tmp/neck+ripping.ogg").pipe(new prism.opus.OggDemuxer())
//         .pipe(new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 }))
//         .pipe(fs.createWriteStream('./audio.pcm'));

// })

