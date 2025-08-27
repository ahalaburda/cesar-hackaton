#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import { getSecret } from '../lib/utils';



const main = async () => {

  const secret = await getSecret('/cesar-secret');

  if (!secret) {
    throw new Error('No secret found');
  }

  const secretValue = JSON.parse(secret);

  const slackBotToken = secretValue.SLACK_BOT_TOKEN;
  const slackSigningSecret = secretValue.SLACK_SIGNING_SECRET;
  const slackAppToken = secretValue.SLACK_APP_TOKEN;

  const app = new cdk.App();
  new CdkStack(app, 'CesarStack', {
    slackBotToken,
    slackSigningSecret,
    slackAppToken,
    env: {
      account: '692859917636',
      region: 'us-east-1',
    },
  });


}

main()