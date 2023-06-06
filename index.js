const puppeteer = require("puppeteer-core");
const https = require('https')
const fs = require('fs')
const ProgressBar = require('progress');

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
class Handler {
  constructor() {
    this.found = false;
    this.cookie = new CookieWrapper();
    
    this.url = null;
  }

  // main callback handler
  handle(req) {
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

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new", 
    executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--enable-features=NetworkService']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36')
  await page.setRequestInterception(true);

  let handler = new Handler();

  page.on("request", handler.handle.bind(handler)) // needs bind otherwise "this" keyword is undefined

  await Promise.race([
    page.goto("https://us02web.zoom.us/rec/play/ToU9UQTiwY2LZvToaELslGRf_kHL7NSlEwz1a64kx65MSyh83nUz0g0g-QbsW7Jnj6LkzQssfbO89D82.FCGTjlattB3-tWki?canPlayFromShare=true&from=share_recording_detail&continueMode=true&componentName=rec-play&originRequestUrl=https%3A%2F%2Fus02web.zoom.us%2Frec%2Fshare%2Fj3jK92NgIOpeiCmu8egt4FyW3cXHit-9CutpRhqnYNPhlwsMyzLITSHyfiIBp8dV.DdD_-BtP79gANHXw"), 
    handler.waitUntilCookieFound()
  ]);


  page.off("request", handler)
  await page.close()

  await browser.close();

  await download(handler.url, {
    Cookie: handler.cookie.get(),
    Referer: "https://zoom.us/"
  })
})()


async function download(url, headers) {
  const file = fs.createWriteStream("Recording 2.mp4");

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
        let bar = new ProgressBar('downloading [:bar] :mbrateMB/s :percent :etas', {
          complete: '=',
          incomplete: ' ',
          width: 20,
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