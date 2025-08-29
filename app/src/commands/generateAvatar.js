const ImageGenerationService = require('../services/imageGenerationService');
const LevelSystem = require('../utils/levelSystem');

class GenerateAvatarCommand {
  constructor(database) {
    this.db = database;
    this.imageService = new ImageGenerationService();
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

      const args = command.text.trim().split(' ');
      const subCommand = args[0]?.toLowerCase();

      switch (subCommand) {
        case 'accessories':
          await this.handleAccessoriesCommand(command.user_id, args.slice(1), respond);
          break;
        case 'custom':
          await this.handleCustomCommand(command.user_id, args.slice(1), respond);
          break;
        case 'preview':
          await this.handlePreviewCommand(command.user_id, respond);
          break;
        default:
          await this.showHelp(respond);
      }

    } catch (error) {
      console.error('Error with generate avatar command:', error);
      await respond({
        text: 'Error generating avatar 😓',
        response_type: 'ephemeral'
      });
    }
  }

  async handleAccessoriesCommand(userId, accessories, respond) {
    if (accessories.length === 0) {
      await respond({
        text: '❌ Please specify accessories! Example: `/cesar-generate-avatar accessories hat sneakers`',
        response_type: 'ephemeral'
      });
      return;
    }

    const userData = await this.db.getUserData(userId);
    const availableAccessories = this.imageService.getAvailableAccessories(userData.level);
    
    // Validate accessories
    const invalidAccessories = accessories.filter(acc => !availableAccessories.includes(acc));
    if (invalidAccessories.length > 0) {
      await respond({
        text: `❌ Invalid accessories: ${invalidAccessories.join(', ')}\n\nAvailable accessories: ${availableAccessories.join(', ')}`,
        response_type: 'ephemeral'
      });
      return;
    }

    const cost = this.imageService.calculateGenerationCost(accessories);
    
    if (userData.bananas < cost) {
      await respond({
        text: `❌ Not enough bananas! You need ${cost} 🍌 but you have ${userData.bananas} 🍌`,
        response_type: 'ephemeral'
      });
      return;
    }

    // Send initial response
    await respond({
      text: `🎨 Generating your avatar with accessories: ${accessories.join(', ')}\nCost: ${cost} 🍌\n\n⏳ This may take a few moments...`,
      response_type: 'ephemeral'
    });

    try {
      // Generate the avatar
      const imageUrl = await this.imageService.generateAvatar(accessories, userId);
      
      // Deduct bananas and save avatar
      await this.db.deductBananas(userId, cost);
      const prompt = `A cute animated cartoon monkey with accessories: ${accessories.join(', ')}`;
      await this.db.updateAvatar(userId, imageUrl, prompt, accessories);

      // Send success response with image
      await respond({
        text: `🎉 Avatar generated successfully!\n\nAccessories: ${accessories.join(', ')}\nCost: ${cost} 🍌\nRemaining bananas: ${userData.bananas - cost} 🍌\n\nYour new avatar has been saved!`,
        response_type: 'ephemeral'
      });

    } catch (error) {
      console.error('Error generating avatar:', error);
      await respond({
        text: '❌ Failed to generate avatar. Please try again later.',
        response_type: 'ephemeral'
      });
    }
  }

  async handleCustomCommand(userId, promptParts, respond) {
    if (promptParts.length === 0) {
      await respond({
        text: '❌ Please provide a custom prompt! Example: `/cesar-generate-avatar custom "A monkey wearing a superhero cape"`',
        response_type: 'ephemeral'
      });
      return;
    }

    const customPrompt = promptParts.join(' ');
    const cost = 3; // Fixed cost for custom prompts
    const userData = await this.db.getUserData(userId);

    if (userData.bananas < cost) {
      await respond({
        text: `❌ Not enough bananas! Custom prompts cost ${cost} 🍌 but you have ${userData.bananas} 🍌`,
        response_type: 'ephemeral'
      });
      return;
    }

    // Send initial response
    await respond({
      text: `🎨 Generating custom avatar with prompt: "${customPrompt}"\nCost: ${cost} 🍌\n\n⏳ This may take a few moments...`,
      response_type: 'ephemeral'
    });

    try {
      // Generate the avatar
      const imageUrl = await this.imageService.generateCustomAvatar(customPrompt, userId);
      
      // Deduct bananas and save avatar
      await this.db.deductBananas(userId, cost);
      await this.db.updateAvatar(userId, imageUrl, customPrompt, []);

      // Send success response with image
      await respond({
        text: `🎉 Custom avatar generated successfully!\n\nPrompt: "${customPrompt}"\nCost: ${cost} 🍌\nRemaining bananas: ${userData.bananas - cost} 🍌\n\nYour new avatar has been saved!`,
        response_type: 'ephemeral'
      });

    } catch (error) {
      console.error('Error generating custom avatar:', error);
      await respond({
        text: '❌ Failed to generate custom avatar. Please try again later.',
        response_type: 'ephemeral'
      });
    }
  }

  async handlePreviewCommand(userId, respond) {
    const userData = await this.db.getUserData(userId);
    const availableAccessories = this.imageService.getAvailableAccessories(userData.level);
    
    let previewText = '🎨 *Avatar Studio - Preview* 🐒\n\n';
    previewText += `*Your Level:* ${userData.level}\n`;
    previewText += `*Your Bananas:* ${userData.bananas} 🍌\n\n`;
    
    if (userData.avatar_image_url) {
      previewText += `*Current Avatar:* Generated AI Avatar\n`;
      if (userData.avatar_prompt) {
        previewText += `*Prompt:* "${userData.avatar_prompt}"\n`;
      }
      previewText += `*File:* ${userData.avatar_image_url}\n\n`;
    }

    previewText += '*Available Accessories:*\n';
    availableAccessories.forEach(acc => {
      const cost = this.imageService.calculateGenerationCost([acc]);
      previewText += `• ${acc} (${cost} 🍌)\n`;
    });

    previewText += '\n*Commands:*\n';
    previewText += '• `/cesar-generate-avatar accessories hat sneakers` - Generate with accessories\n';
    previewText += '• `/cesar-generate-avatar custom "your prompt"` - Custom prompt (3 🍌)\n';
    previewText += '• `/cesar-generate-avatar preview` - Show this preview';

    await respond({
      text: previewText,
      response_type: 'ephemeral'
    });
  }

  async showHelp(respond) {
    const helpText = '🎨 *Avatar Studio - Generate Avatar* 🐒\n\n';
    helpText += '*Commands:*\n';
    helpText += '• `/cesar-generate-avatar accessories hat sneakers` - Generate with accessories\n';
    helpText += '• `/cesar-generate-avatar custom "your prompt"` - Custom prompt (3 🍌)\n';
    helpText += '• `/cesar-generate-avatar preview` - Show available options\n\n';
    helpText += '*Costs:*\n';
    helpText += '• Base generation: 1 🍌\n';
    helpText += '• Each accessory: +0.5 🍌\n';
    helpText += '• Custom prompt: 3 🍌';

    await respond({
      text: helpText,
      response_type: 'ephemeral'
    });
  }
}

module.exports = GenerateAvatarCommand;
