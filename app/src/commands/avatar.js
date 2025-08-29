const LevelSystem = require('../utils/levelSystem');

class AvatarCommand {
  constructor(database) {
    this.db = database;
  }

  async handle(command, ack, respond) {
    await ack();

    try {
      const userData = await this.db.getUserData(command.user_id);
      
      if (userData.level < 2) {
        await respond({
          text: '🔒 Avatar Studio unlocks at *Level 2*! Keep earning bananas to customize your pet monkey! 🐒',
          response_type: 'ephemeral'
        });
        return;
      }

      let avatarText = '🎨 *Avatar Studio* 🐒\n\n';
      
      // Show current avatar info
      if (userData.avatar_image_url) {
        avatarText += `*Current Avatar:* Generated AI Avatar\n`;
        if (userData.avatar_prompt) {
          avatarText += `*Prompt:* "${userData.avatar_prompt}"\n`;
        }
        avatarText += `*File:* ${userData.avatar_image_url}\n\n`;
      } else {
        avatarText += `*Current avatar:* ${LevelSystem.getAvatarForLevel(userData.level)}\n\n`;
      }

      avatarText += `*Your Level:* ${userData.level}\n`;
      avatarText += `*Your Bananas:* ${userData.bananas} 🍌\n\n`;
      
      avatarText += '*🎨 Generate New Avatar:*\n';
      avatarText += '• `/cesar-generate-avatar accessories hat sneakers` - Add accessories\n';
      avatarText += '• `/cesar-generate-avatar custom "your prompt"` - Custom prompt (3 🍌)\n';
      avatarText += '• `/cesar-generate-avatar preview` - Show available options\n\n';
      
      avatarText += '*💰 Costs:*\n';
      avatarText += '• Base generation: 1 🍌\n';
      avatarText += '• Each accessory: +0.5 🍌\n';
      avatarText += '• Custom prompt: 3 🍌\n\n';
      
      avatarText += '*📋 Available Accessories by Level:*\n';
      avatarText += '• Level 2+: collar, bracelet, hat\n';
      avatarText += '• Level 3+: + sneakers, glasses\n';
      avatarText += '• Level 4+: + backpack, watch\n';
      avatarText += '• Level 5+: + necklace, earrings';

      await respond({
        text: avatarText,
        response_type: 'ephemeral'
      });

    } catch (error) {
      console.error('Error with avatar command:', error);
      await respond('Error accessing Avatar Studio 😓');
    }
  }
}

module.exports = AvatarCommand;
