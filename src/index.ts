import config from '@config'
import yth, { getNextPage } from '@VideoHandlers/YoutubeVideoHandler/YoutubeAPIHandler'
import yvh from '@VideoHandlers/YoutubeVideoHandler/YoutubeVideoHandler'
import { debug_properties } from 'debug/debug'
import StartBot from 'DiscordBot/Musidisc'

process.argv.forEach((val, index) => {
    if (val === "-D") debug_properties.flag = true;
})

StartBot();


// yth("Payphone").then((searchResults) => {
//     yvh(searchResults.results[0].id);
// })
