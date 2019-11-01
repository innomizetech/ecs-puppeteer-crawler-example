import { archive } from './lib/s3-util';
import * as bluebird from 'bluebird';
import { emptyDirSync } from 'fs-extra';
const argv = require('yargs').argv;

const browserless = require('browserless')({
  headless: !!argv.headless,
  ignoreHTTPSErrors: true,
  defaultViewport: null,
  dumpio: false,
  args: ['--disable-setuid-sandbox', '--no-sandbox']
});

if (!argv.url) {
  console.log('Url is required');
  process.exit(1);
}

const devices = browserless.devices.slice(0, 2);
const hostname = new URL(argv.url).hostname;

console.time('Finished in');

const generatePdf = async () => {
  const generatePdfPerDevice = async device => {
    console.log(
      `${new Date().toUTCString()}: Generating pdf for ${device.name} device`
    );

    const buffer = await browserless.pdf(argv.url, {
      waitUntil: ['load', 'networkidle2'],
      fullPage: true,
      device: device.name
    });

    const fileName = `output/${hostname} on (${device.name}).pdf`;

    return { buffer, fileName };
  };

  const data = await bluebird.map(
    devices,
    device => generatePdfPerDevice(device),
    {
      concurrency: 5
    }
  );

  await bluebird.map(data, item => archive(item));

  console.timeEnd('Finished in');

  process.exit(0);
};

emptyDirSync('output');
generatePdf();
