# zoom-interception-dl
Intercepts video request to obtain cookie and URL and automatically downloads recording.

Please note that for protected cloud recordings, the recording *should* have the passcode embeded inside the link (note that this is untested, so my script might even work even if the password isn't embeded inside the link, but idk)

# Prerequisites
Node.js, npm, and Chrome need to be installed (Firefox is not supported at the moment - might add if someone asks me to, but currently I have no need of adding any such support)

# Installation
<!-- Run `npm i  -g`, or  -->

Simply use through `npm start <zoom-recording-url>`

Reference: https://michaelabrahamsen.com/posts/how-to-download-zoom-recordings/