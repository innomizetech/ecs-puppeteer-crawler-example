import * as bluebird from 'bluebird';
const browserless = require('browserless')();
const createBrowserless = require('@browserless/pool');
const argv = require('yargs').argv;
import { archive } from './lib/s3-util';

/**
 * You also can use pool to limit number of browser instances to be opening
 */
const browserlessPool = createBrowserless(
  {
    max: 2,
    timeout: 60000
  },
  {
    headless: !!argv.headless,
    ignoreHTTPSErrors: true,
    defaultViewport: null,
    dumpio: false,
    args: ['--disable-setuid-sandbox', '--no-sandbox']
  }
);
const devices = browserless.devices.slice(0, 5);

if (!argv.url) {
  console.log('Url is required');
  process.exit(1);
}

const hostname = new URL(argv.url).hostname;

console.time('Finished in');

const generateScreenshot = async () => {
  const generateScreenshotPerDevice = async device => {
    console.log(
      `${new Date().toUTCString()}: Generating screenshot for ${
        device.name
      } device`
    );

    const buffer = await browserlessPool.pdf(argv.url, {
      waitUntil: ['load', 'networkidle2'],
      fullPage: true,
      device: device.name
    });

    const fileName = `output/${hostname} on (${device.name}).png`;

    return { buffer, fileName };
  };

  const data = await bluebird.map(
    devices,
    device => generateScreenshotPerDevice(device),
    {
      concurrency: 5
    }
  );

  await bluebird.map(data, item => archive(item));

  console.timeEnd('Finished in');

  process.exit(0);
};

generateScreenshot();
