import { StackProps } from '@aws-cdk/core';

export interface PuppeteerCrawlerFargateStackProps extends StackProps {
  useDefaultVpc?: boolean;
  bucketName: string;
  scheduleExpression?: string;
  repoName: string;
}
