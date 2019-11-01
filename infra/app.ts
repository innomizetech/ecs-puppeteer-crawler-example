import 'source-map-support/register';
import cdk = require('@aws-cdk/core');

import { PuppeteerCrawlerFargateStack } from './lib/puppeteer-crawler-fargate-stack';

const env = {
  region: 'us-east-2',
  account: process.env.CDK_DEFAULT_ACCOUNT
};

const app = new cdk.App();

new PuppeteerCrawlerFargateStack(app, 'PuppeteerCrawlerDemoStack', {
  description:
    'The AWS CloudFormation template for ecs-puppeteer-crawler-example',
  env,
  useDefaultVpc: true,
  bucketName: 'ecs-puppeteer-crawler-archives',
  // Make sure it matched the REPO_NAME in the build_and_push.sh script
  repoName: 'ecs-puppeteer-crawler-example',
  scheduleExpression: 'rate(5 minutes)'
});
