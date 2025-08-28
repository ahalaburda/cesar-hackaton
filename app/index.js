require('dotenv').config();
const { App } = require('@slack/bolt');

// Import modules
const Database = require('./src/database/db');
const BananaHandler = require('./src/handlers/bananaHandler');
const TopCommand = require('./src/commands/top');
const AvatarCommand = require('./src/commands/avatar');
const HelpCommand = require('./src/commands/help');
const DecayService = require('./src/services/decayService');

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000,
  customRoutes: [
    {
      path: '/healthcheck',
      method: 'GET',
      handler: (req, res) => {
        res.writeHead(200);
        res.end(`OK`);
      }
    }
  ]
});

// Initialize database
const database = new Database();

// Initialize handlers and commands
const bananaHandler = new BananaHandler(database, app.client);
const topCommand = new TopCommand(database, app.client);
const avatarCommand = new AvatarCommand(database);
const helpCommand = new HelpCommand();

// Initialize services
const decayService = new DecayService(database, app);

// Listen for banana mentions in messages
app.message(/.*:banana:.*<@([UW][A-Z0-9]+)>.*/, async ({ message, context }) => {
  await bananaHandler.processBananaMessage(message, context);
});

// Top slash command
app.command('/top', async ({ command, ack, respond }) => {
  await topCommand.handle(command, ack, respond);
});

// Avatar customization command
app.command('/avatar', async ({ command, ack, respond }) => {
  await avatarCommand.handle(command, ack, respond);
});

// Help command
app.command('/cesar-help', async ({ command, ack, respond }) => {
  await helpCommand.handle(command, ack, respond);
});

// Error handling
app.error((error) => {
  console.error('Slack app error:', error);
});

// Start the app
(async () => {
  try {
    await app.start();
    console.log('⚡️ César Slack app is running!');
  } catch (error) {
    console.error('Failed to start app:', error);
  }
})();

module.exports = app;