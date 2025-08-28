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

      const colors = ['yellow', 'brown', 'black', 'gray'];
      const accessories = userData.level >= 3 ? ['🎩', '👑', '🕶️', '🎀'] : ['🎩'];
      
      const config = JSON.parse(userData.avatar_config || '{"color": "yellow", "accessories": []}');
      
      let avatarText = '🎨 *Avatar Studio* 🐒\n\n';
      avatarText += `Current avatar: ${LevelSystem.getAvatarForLevel(userData.level)}\n\n`;
      avatarText += `*Available colors:* ${colors.join(', ')}\n`;
      avatarText += `*Available accessories:* ${accessories.join(', ')}\n`;
      avatarText += `\nCurrent config: Color: ${config.color}, Accessories: ${config.accessories.join(', ') || 'none'}\n\n`;
      avatarText += `Use \`/avatar color yellow\` or \`/avatar accessory 🎩\` to customize!`;

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
