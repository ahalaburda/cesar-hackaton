#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import { getParameter, getSecret } from '../lib/utils';

const main = async () => {

  const domainName = "dev.bosscat.tech";
  const appName = "cesar-bot";

  const secret = await getSecret(`/${appName}`);
  const certificateArn = await getParameter(`/${domainName}/certificate_arn`);
    if (certificateArn === null) {
        throw new Error(`No certificate found`);
    }

  if (!secret) {
    throw new Error('No secret found');
  }

  const secretValue = JSON.parse(secret);

  const slackBotToken = secretValue.SLACK_BOT_TOKEN;
  const slackSigningSecret = secretValue.SLACK_SIGNING_SECRET;
  const slackAppToken = secretValue.SLACK_APP_TOKEN;

  const app = new cdk.App();
  new CdkStack(app, 'CesarBotStack', {
    slackBotToken,
    slackSigningSecret,
    slackAppToken,
    certificateArn,
    domainName,
    appName,
    env: {
      account: '692859917636',
      region: 'us-east-1',
    },
  });


}

main()