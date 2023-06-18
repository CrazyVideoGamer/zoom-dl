const https = require('https')
const fs = require('fs')
const ProgressBar = require('progress');

const { validateZoomURL } = require("./utils")

class CookieNotFound extends Error {
  constructor(message) {
    super(message);
    this.name = "CookieNotFound";
  }
}

// The sole purpose of this wrapper is to add an event for when the cookie changes
// so that we can close the page once we have the cookie + url info we need
class CookieWrapper {
  constructor() {
    this.cookie = null;
    this.callbacks = [];
  }

  set(cookie) {
    this.cookie = cookie
    this.callbacks.map(callback => { callback(this.cookie) })
  }

  get() {
    return this.cookie
  }

  onCookieChange(callback) {
    this.callbacks.push(callback)
  }
}


// This is to manage the found + cookies + url variables that would other be unaccessible if
// I used a normal function inside the page.on callback (the callback wouldn't be able to
// modify external variable values)

// LOL actually it might be possible with just a simple arrow function because the "this"
// of an arrow function is the background
class HandlerWrapper {
  constructor() {
    this.found = false;
    this.cookie = new CookieWrapper();
    
    this.url = null;
  }

  // main callback handler
  handler(req) {
    if (req.isInterceptResolutionHandled()) return;
    if (!this.found && req.resourceType() === "media" && req.url().includes(".mp4") && req.url().includes("ssrweb.zoom.us")) {
      this.cookie.set(req.headers().cookie)
      this.url = req.url()
      this.found = true
    }
    req.continue();
  }

  // external api to create a promise on cookie change (converts callback format into promise)
  waitUntilCookieFound() {
    return new Promise((resolve, _) => {
      let callback = () => {
        resolve()
      }
      this.cookie.onCookieChange(callback)
    })
  }
}


/**
 * Downloads recording from url.
 * 
 * Note: must use executablePath so zoom mp4 recording loads (chromium doesn't support mp4)
 * @param {puppeteer.Browser} browser 
 * @param {string[]} urls 
 * @param {string} [path="./Recording.mp4"] 
 * @param {string} [progress_bar_prefix="Downloading "] 
 */
async function downloadRecording(browser, urls, prefix="Recording", progress_bar_prefix="Downloading ") {

  const page = await browser.newPage();
  await page.setRequestInterception(true);

  for (let i=0; i < urls.length; i++) {
    let url = urls[i];
    validateZoomURL(url)

    let handler_wrapper = new HandlerWrapper();
    let handler = handler_wrapper.handler.bind(handler_wrapper)

    console.log("Retrieving cookie")
    page.on("request", handler) // needs bind otherwise "this" keyword is undefined

    await Promise.race([
      handler_wrapper.waitUntilCookieFound(),
      page.goto(url, { waitUntil: "networkidle0" }), 
    ]);

    page.off("request", handler)

    if (handler_wrapper.cookie.get() === null) {
      throw CookieNotFound("Cookie was unable to be intercepted.")
    }

    let path = urls.length > 1 ? `./${prefix} ${i+1}.mp4` : `./${prefix}.mp4`

    await downloadFile(handler_wrapper.url, {
      Cookie: handler_wrapper.cookie.get(),
      Referer: "https://zoom.us/"
    }, path, progress_bar_prefix);

  }

  await page.setRequestInterception(false);
  await page.close();
}


async function downloadFile(url, headers, path="./Recording.mp4", progress_bar_prefix="Downloading ") {
  const file = fs.createWriteStream(path);

  return new Promise((resolve, reject) => {
    try {
      https.get(url, { 
        headers
      }, (response) => {
        if (response.statusCode !== 200) {
          console.error('Request Failed.\n' + `Status Code: ${response.statusCode}`);
          response.resume();
          reject()
          return;
        }

        let len = parseInt(response.headers['content-length'], 10);
        let start = new Date();
        let bar = new ProgressBar(`${progress_bar_prefix}[:bar] :mbrateMB/s :percent :etas`, {
          incomplete: ' ',
          // width: 40,
          total: len
        });

        let curr_len = 0;

        response.on("data", (chunk) => {
          curr_len += chunk.length

          let elapsed = (new Date() - start) / 1000

          let mbrate = (curr_len / elapsed) * 0.000001
          
          bar.tick(chunk.length, {
            "mbrate": Math.round(100*mbrate)/100
          })
        })

        response.pipe(file)

        file.on("finish", () => {
          file.close();
          resolve()
        })
      })
    } catch (e) {
      reject(e.message)
    }
  })
}


module.exports = downloadRecording