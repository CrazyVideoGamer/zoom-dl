#!/usr/bin/env node

const puppeteer = require("puppeteer-core");
const commander = require("commander");
const { program } = require("commander");
const downloadRecordings = require('./index');
const fs = require('fs');

program.exitOverride((err) => {
  if (err.code.startsWith('commander.missing')) {
    console.log();
    program.outputHelp();
  }
  process.exit(err.exitCode);
});

const pkg = require("./package.json")

program
  .name('zoom-dl')
  .description(`Download zoom recordings automatically.

Specify an URL with -u or --url, or create a urls.txt file in the 
same directory and place the URLs you want to download in each line`)
  .version(pkg.version, '-v, --version', 'output the version number')
  .option('-u, --url <URL>', 'zoom recording url to download if you do not want to create a urls.txt file')
  .requiredOption('-b, --browser-exec-path <path>', 'path to the Chrome executable', parseChromePath);

if (process.argv.length <= 2) {
  program.outputHelp();
  process.exit(0)
}

program.parse(process.argv);

// let url = program.args[0];
const options = program.opts();

let urls;

if (options.url) {
  urls = [options.url]
} else {
  if (!fs.existsSync("./urls.txt")) {
    console.error("error: ./urls.txt does not exist and -u, --url option was not used");
    console.log();
    program.outputHelp();
    process.exit(1);
  }

  urls = fs.readFileSync("./urls.txt").toString().replace(/\r\n/g,'\n').split('\n');
  for (let url of urls) {
    try {
      validateZoomURL(url)
    } catch {
      console.error(`Invalid zoom url: ${url}`)
      process.exit(1)
    }
  }
}

(async () => {

  let browser;
  try {
    // must use executablePath so zoom mp4 recording loads (chromium doesn't support mp4)
    browser = await puppeteer.launch({ 
      headless: "new", 
      executablePath: options.browserExecPath
    });
  } catch(e) {
    if (e.message === "spawn UNKNOWN") {
      console.error("Invalid Chrome path. Puppeteer was unable to launch Chrome.");
      process.exit(1);
    } else {
      throw e;
    }
  }

  try {
    await downloadRecordings(browser, urls);
    await browser.close();
  } catch (e) {
    console.error(`${e.name}: ${e.message}`);
    await browser.close();
    process.exit(1);
  }
})();


function parseChromePath(value) {
  if (!fs.existsSync(value)) throw new commander.InvalidArgumentError("Path does not exist.");
  return value
}