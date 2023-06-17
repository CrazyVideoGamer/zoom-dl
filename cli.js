#!/usr/bin/env node

const puppeteer = require("puppeteer-core");
const commander = require("commander");
const { program } = require("commander");
const downloadRecording = require('./index');
const fs = require('fs');

program.exitOverride((err) => {
  if (err.code.startsWith('commander.missing')) {
    console.log();
    program.outputHelp();
  }
  process.exit(err.exitCode);
});

program
  .name('zoom-dl')
  .description('Download zoom recordings automatically')
  .version('1.0.0')
  .argument('<url>', 'zoom recording url to download', parseURL)
  .requiredOption('-b, --browser-exec-path <path>', 'path to the Chrome executable', parseChromePath);

if (process.argv.length == 2) {
  program.outputHelp();
  process.exit(0)
}

program.parse(process.argv);

let url = program.args[0];
const options = program.opts();

(async () => {

  // must use executablePath so zoom mp4 recording loads (chromium doesn't support mp4)
  try {
    const browser = await puppeteer.launch({ 
      headless: "new", 
      executablePath: options.browserExecPath
    });

    try {
      await downloadRecording(browser, url)
    } catch (e) {
      console.error(`${e.name}: ${e.message}`);
      await browser.close()
      process.exit(1);
    }
  } catch(e) {
    if (e.message === "spawn UNKNOWN") {
      console.error("Invalid chrome path. Chrome was unable to be launched.")
      process.exit(1)
    } else {
      throw e;
    }
  }



})()

function parseURL(value) {
  try {
    let url = new URL(value)
    if (!url.hostname.endsWith("zoom.us")) {
      throw new commander.InvalidArgumentError("Invalid Zoom URL.")
    }
    return value
  } catch { // for the errors caused by new URL(value) (invalid urls, but could be zoom or not)
    throw new commander.InvalidArgumentError("Invalid URL.")
  }
}

function parseChromePath(value) {
  if (!fs.existsSync(value)) throw new commander.InvalidArgumentError("Path does not exist.");
  return value
}