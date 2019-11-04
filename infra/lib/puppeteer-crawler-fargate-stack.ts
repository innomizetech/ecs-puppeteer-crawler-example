import path = require('path');
import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import ecr = require('@aws-cdk/aws-ecr');
import events = require('@aws-cdk/aws-events');
import ecs = require('@aws-cdk/aws-ecs');
import iam = require('@aws-cdk/aws-iam');
import { EcsTask } from '@aws-cdk/aws-events-targets';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { Bucket } from '@aws-cdk/aws-s3/lib/bucket';
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets';

import { PuppeteerCrawlerFargateStackProps } from './interfaces';

export class PuppeteerCrawlerFargateStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    props?: PuppeteerCrawlerFargateStackProps
  ) {
    super(scope, id, props);

    const vpc = this.constructVpc(props);
    const cluster = new ecs.Cluster(this, 'PuppeteerCrawlerCluster', { vpc });
    const bucket = this.constructArchiveBucket(props);
    const taskDef = this.constructTaskDef(props, bucket);

    // Create rule to trigger this be run task
    new events.Rule(this, 'PuppeteerCrawlerSchedule', {
      schedule: events.Schedule.expression(
        props.scheduleExpression || 'cron(0/5 * * * ? *)'
      ),
      description: 'Starts the puppeteer crawler job',
      targets: [
        new EcsTask({
          cluster: cluster,
          taskDefinition: taskDef,
          subnetSelection: {
            subnetType: ec2.SubnetType.PUBLIC
          },
          containerOverrides: [
            {
              containerName: 'PuppeteerContainer',
              command: ['pdf']
            }
          ]
        }),
        new EcsTask({
          cluster: cluster,
          taskDefinition: taskDef,
          subnetSelection: {
            subnetType: ec2.SubnetType.PUBLIC
          },
          containerOverrides: [
            {
              containerName: 'PuppeteerContainer',
              command: ['screenshot']
            }
          ]
        })
      ]
    });
  }

  private constructVpc(props: PuppeteerCrawlerFargateStackProps) {
    if (props.useDefaultVpc) {
      return ec2.Vpc.fromLookup(this, 'VPC', {
        isDefault: true
      });
    }

    return new ec2.Vpc(this, 'EcsFargateVPC', {
      cidr: '172.15.0.0/16',
      maxAzs: 1,
      // natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 16,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC
        }
        // In case if you want to run your task under private subnet
        // then uncomment below lines and change subnetSelection
        // options above to PRIVATE
        // {
        //   cidrMask: 20,
        //   name: 'Private',
        //   subnetType: ec2.SubnetType.PRIVATE
        // }
      ]
    });
  }

  private constructArchiveBucket(props: PuppeteerCrawlerFargateStackProps) {
    return new Bucket(this, 'PuppeteerCrawlerArchiveBucket', {
      bucketName: props.bucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
  }

  private constructTaskDef(
    props: PuppeteerCrawlerFargateStackProps,
    bucket: Bucket
  ) {
    // Role for task
    const taskRole = this.constructTaskRole(bucket);
    const taskDef = new ecs.FargateTaskDefinition(
      this,
      'PuppeteerCrawlerTaskDefinition',
      {
        memoryLimitMiB: 8192,
        cpu: 2048,
        taskRole
      }
    );

    // Define docker image assets that allows to build and push docker images to ECR automatically
    // See: https://docs.aws.amazon.com/cdk/latest/guide/assets.html for more details
    const asset = new DockerImageAsset(this, 'ecs-puppeteer-crawler-example', {
      directory: path.join(__dirname, '../../'),
      exclude: ['cdk.out', 'node_modules']
    });

    taskDef.addContainer('PuppeteerContainer', {
      // Note - adding imageUri will throw invalid docker ref of the task definition
      image: ecs.ContainerImage.fromEcrRepository(asset.repository),
      logging: new ecs.AwsLogDriver({
        streamPrefix: 'puppeteer-data-crawler',
        logRetention: 1
      }),
      environment: {
        S3_BUCKET: bucket.bucketName
      }
    });

    return taskDef;
  }

  private constructTaskRole(bucket: Bucket) {
    const taskRole = new iam.Role(this, 'EcsTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
    });

    // Note: we can add more policy here
    taskRole.addToPolicy(
      new PolicyStatement({
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
        actions: ['s3:PutObject']
      })
    );

    return taskRole;
  }
}
