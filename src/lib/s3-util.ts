import AWS = require('aws-sdk');
import * as bluebird from 'bluebird';
import { writeFile } from 'fs-extra';

const s3 = new AWS.S3({ signatureVersion: 'v4' });

export const putObject = async ({
  bucketName,
  key,
  data,
  acl
}: {
  bucketName: string;
  key: string;
  data: string | Buffer;
  acl?: string;
}) => {
  if (!bucketName) {
    return;
  }

  return s3
    .putObject({
      Bucket: bucketName,
      Key: key,
      Body: data,
      ACL: acl || 'private'
    })
    .promise();
};

export const archive = async ({ fileName, buffer }) => {
  await bluebird.all([
    writeFile(fileName, buffer),
    putObject({
      bucketName: process.env.S3_BUCKET,
      key: fileName,
      data: buffer
    })
  ]);

  console.log(`${new Date().toUTCString()}: Archived '${fileName}'`);
};
