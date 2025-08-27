import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';

interface StackProps extends cdk.StackProps {
  slackBotToken: string;
  slackSigningSecret: string;
  slackAppToken: string;
  domainName: string;
  certificateArn: string;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
      tags: {
        'environment': "non-production",
        'purpose': 'vpc'
      }
    });

    const subdomainHostedZone: route53.IHostedZone = route53.HostedZone.fromLookup(this, "subDomainZoneLookup", { domainName: props.domainName });
    const envCert: acm.ICertificate = acm.Certificate.fromCertificateArn(this, 'Certificate', props.certificateArn);

    const clusterName = 'cesar-bot';

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: vpc,
      clusterName: clusterName
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      family: 'cesar-task',
    });

    const container = taskDefinition.addContainer('CesarContainer', {
      image: ecs.ContainerImage.fromAsset('../app/'),
      memoryLimitMiB: 512,
      cpu: 256,
      essential: true,
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'cesar-bot',
      }),
      environment: {
        SLACK_BOT_TOKEN: props?.slackBotToken || '',
        SLACK_SIGNING_SECRET: props?.slackSigningSecret || '',
        SLACK_APP_TOKEN: props?.slackAppToken || '',
        DATABASE_PATH: '/data/cesar.db',
      },
      portMappings: [
        {
          containerPort: 3000,
        }
      ]
    });

    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      serviceName: clusterName,
      cluster: cluster, // Required
      cpu: 256, // Default is 256
      desiredCount: 1, // Default is 1
      taskDefinition: taskDefinition,
      memoryLimitMiB: 512, // Default is 512
      publicLoadBalancer: true,// Default is false
      assignPublicIp: false,
      redirectHTTP: false, // Disabled HTTP redirect to avoid HTTPS requirement
      certificate: envCert,
      circuitBreaker: {rollback: true},
      minHealthyPercent: 100,
      propagateTags: ecs.PropagatedTagSource.TASK_DEFINITION,
      domainName: 'cesar-bot',
      domainZone: subdomainHostedZone
    });

    //add health check
    service.targetGroup.configureHealthCheck({
      path: '/healthcheck',
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 5,
      interval: cdk.Duration.seconds(10),
      timeout: cdk.Duration.seconds(5),
      healthyHttpCodes: '200,301,302,404',
    });
  }
}
