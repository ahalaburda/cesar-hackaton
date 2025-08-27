# César - Slack Kudos Bot 🐒🍌

A gamified Slack bot for team recognition and kudos using bananas, leveling system, and customizable pet monkeys.

## Features

- 🍌 **Banana Recognition System**: Give kudos to teammates using banana emojis
- 📈 **Leveling System**: Users level up based on triangular progression (1, 3, 6, 10, 15...)
- 🎨 **Avatar Studio**: Customize your pet monkey at Level 2+ with colors and accessories
- 🏆 **Leaderboards**: See top performers and your ranking
- 🎁 **Giver Rewards**: Bonus bananas for being generous with recognition
- 🔄 **Monthly Decay**: Gentle nudge system to keep engagement active

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your Slack app credentials
   ```

3. **Create Slack App**:
   - Go to https://api.slack.com/apps
   - Create new app → From scratch
   - Enable Socket Mode and create App-Level Token
   - Add OAuth scopes: `chat:write`, `reactions:write`, `users:read`, `commands`
   - Install app to workspace

4. **Run the bot**:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## Usage

### Giving Bananas
In any public channel:
```
🍌 @username for helping me with the deploy!
```

### Commands
- `/ranking` - View leaderboard and your stats
- `/avatar` - Customize your pet monkey (Level 2+)
- `/cesar-help` - Show help information

## Project Structure

```
├── src/
│   ├── database/
│   │   └── db.js              # Database operations
│   ├── handlers/
│   │   └── bananaHandler.js   # Banana message processing
│   ├── commands/
│   │   ├── ranking.js         # Ranking command
│   │   ├── avatar.js          # Avatar customization
│   │   └── help.js            # Help command
│   ├── services/
│   │   └── decayService.js    # Monthly decay scheduler
│   └── utils/
│       └── levelSystem.js     # Level calculation utilities
├── index.js                   # Main application entry point
├── package.json
└── README.md
```

## Environment Variables

- `SLACK_BOT_TOKEN` - Bot User OAuth Token (xoxb-...)
- `SLACK_SIGNING_SECRET` - App signing secret
- `SLACK_APP_TOKEN` - App-Level Token for Socket Mode (xapp-...)
- `PORT` - Server port (default: 3000)

## Level System

The bot uses a triangular progression system:
- Level 1: 1 banana 🍌
- Level 2: 3 bananas 🍌🍌🍌 (unlocks Avatar Studio)
- Level 3: 6 bananas
- Level n: n×(n+1)/2 bananas

## Contributing

This bot was created for team culture building and recognition. Feel free to customize and extend for your team's needs!

## License

MIT
