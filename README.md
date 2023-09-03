# zoom-interception-dl
Intercepts video requests to obtain cookies and URL and automatically downloads recording.

Please note that for protected cloud recordings, the recording *should* have the passcode embedded inside the link (note that this is untested, so my script might even work even if the password isn't embedded inside the link potentially if it still sends the cookie and video information for the recording, but idk)

# Prerequisites
Node.js, npm, and Chrome need to be installed (Firefox is not supported at the moment - might add if someone asks me to, but currently I have no need to add any such support)

# Installation
Run `npm i zoom-dl -g` or `npx zoom-dl@latest (...)` 

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
```

Reference: https://michaelabrahamsen.com/posts/how-to-download-zoom-recordings/
