#!/usr/bin/env node

const puppeteer = require("puppeteer-core");
const { program } = require("commander")
const downloadRecording = require('./index');

program
  .name('zoom-dl')
  .description('Download zoom recordings automatically')
  .version('1.0.0')
  .argument('<url>', 'zoom recording url to download', parseURL)
  .requiredOption('-b, --browser-exec-path <path>')
  .parse(process.argv);


let url = program.args[0];
const options = program.opts();

(async () => {

  // must use executablePath so zoom mp4 recording loads (chromium doesn't support mp4)
  const browser = await puppeteer.launch({ 
    headless: "new", 
    executablePath: options.browserExecPath
  });

  try {
    await downloadRecording(browser, url)
  } catch (e) {
    console.error(`${e.name}: ${e.message}`);
  }

  await browser.close();

})()

function parseURL(value) {
  try {
    let url = new URL(value)
    if (!url.hostname.endsWith("zoom.us")) {
      throw new commander.InvalidArgumentError("Invalid Zoom URL.")
    }
    return value
  } catch {
    throw new commander.InvalidArgumentError("Invalid Zoom URL.")
  }
}