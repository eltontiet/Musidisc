# Musidisc (WIP)

A simple discord music bot.

## Commands

The bot can be interacted with using the "slash" commands in discord.

- `/play [url]` plays the audio of the video specified in the url (Supports Youtube)
- `/play [title]` plays the first result when searching youtube
- `/search [title]` returns a list of videos from youtube that can then be selected to play
- `/stop` stops playback
- `/pause` pauses playback
- `/unpause` unpauses playback
- `/skip` skips current song
- `/queue` returns the queue
- `/remove [num]` removes the specified song from the queue
- `/clear` clears the queue


The bot can add cookies through DMs. To do this "[Insert Method Here (Slash command?)]". It will store the cookies locally and will try to use your cookies when downloading a youtube video (To get private videos). 

TODO: If making a web server, perhaps try to use OAuth instead for better security, but this is just a proof of concept for now.