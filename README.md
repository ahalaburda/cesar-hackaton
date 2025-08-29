# César - Slack Kudos Bot 🐒🍌

A gamified Slack bot for team recognition and kudos using bananas, leveling system, and customizable pet monkeys.

## Features

- 🍌 **Banana Recognition System**: Give kudos to teammates using banana emojis
- 📈 **Leveling System**: Users level up based on triangular progression (1, 3, 6, 10, 15...)
- 🎨 **Avatar Studio**: Generate custom AI avatars using Google Gemini at Level 2+
- 🤖 **AI Image Generation**: Create unique monkey avatars with accessories using Gemini 2.5 Flash Image
- 💰 **Avatar Economy**: Spend bananas to generate and customize avatars
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
- `/cesar-top` - View leaderboard and your stats
- `/cesar-avatar` - Avatar Studio info and options (Level 2+)
- `/cesar-generate-avatar` - Generate new AI avatar (Level 2+)
- `/cesar-help` - Show help information

### Avatar Studio Usage
- `/cesar-generate-avatar accessories hat sneakers` - Generate with accessories
- `/cesar-generate-avatar custom "A monkey wearing a superhero cape"` - Custom prompt
- `/cesar-generate-avatar preview` - Show available options and costs

## Project Structure

```
├── src/
│   ├── assets/
│   │   └── base_monkey.png    # Base monkey image for AI generation
│   ├── database/
│   │   └── db.js              # Database operations
│   ├── handlers/
│   │   └── bananaHandler.js   # Banana message processing
│   ├── commands/
│   │   ├── top.js             # Top users command
│   │   ├── avatar.js          # Avatar Studio info
│   │   ├── generateAvatar.js  # AI avatar generation
│   │   └── help.js            # Help command
│   ├── services/
│   │   ├── decayService.js    # Monthly decay scheduler
│   │   └── imageGenerationService.js # AI image generation
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
- `GEMINI_API_KEY` - Google Gemini API key for image generation
- `PORT` - Server port (default: 3000)

## Level System

The bot uses a triangular progression system:
- Level 1: 1 banana 🍌
- Level 2: 3 bananas 🍌🍌🍌 (unlocks Avatar Studio)
- Level 3: 6 bananas (unlocks sneakers, glasses)
- Level 4: 10 bananas (unlocks backpack, watch)
- Level 5: 15 bananas (unlocks necklace, earrings)
- Level n: n×(n+1)/2 bananas

## Avatar Studio Economy

- **Base Generation**: 1 🍌
- **Accessories**: +0.5 🍌 each (collar, bracelet, hat, sneakers, glasses, etc.)
- **Custom Prompts**: 3 🍌 (unlimited creativity)
- **Level Progression**: Unlock more accessories as you level up
- **AI Technology**: Powered by Google Gemini 2.5 Flash Image using the official @google/genai library

## Contributing

This bot was created for team culture building and recognition. Feel free to customize and extend for your team's needs!

## License

MIT
