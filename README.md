# zoom-interception-dl
Intercepts video request to obtain cookie and URL and automatically downloads recording.

Please note that for protected cloud recordings, the recording *should* have the passcode embeded inside the link (note that this is untested, so my script might even work even if the password isn't embeded inside the link, but idk)

# Prerequisites
Node.js, npm, and Chrome need to be installed (Firefox is not supported at the moment - might add if someone asks me to, but currently I have no need of adding any such support)

# Installation
Run `npm i zoom-dl -g`, or, `npx zoom-dl@latest` 

# Usage
```
Usage: zoom-dl [options] <url>

Download zoom recordings automatically

Arguments:
  url                             zoom recording url to download

Options:
  -V, --version                   output the version number
  -b, --browser-exec-path <path>
  -h, --help                      display help for command

C:\Users\lianj\Documents\Coding\zoom-interception-dl>npm start -- -h

> zoom-dl@1.0.0 start
> node cli.js -h

Usage: zoom-dl [options] <url>

Download zoom recordings automatically

Arguments:
  url                             zoom recording url to download

Options:
  -V, --version                   output the version number
  -b, --browser-exec-path <path>  path to the Chrome executable
  -h, --help                      display help for command
```

Simply use through `npm start <zoom-recording-url>`

Reference: https://michaelabrahamsen.com/posts/how-to-download-zoom-recordings/