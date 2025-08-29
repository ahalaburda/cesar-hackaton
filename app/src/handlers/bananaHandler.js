const LevelSystem = require('../utils/levelSystem');

class BananaHandler {
  constructor(database, client) {
    this.db = database;
    this.client = client;
  }

  async processBananaMessage(message, context) {
    console.log('🍌 processBananaMessage called');
    console.log('Message:', message);
    console.log('Context matches:', context.matches);
    
    try {
      const fromUserId = message.user;
      const toUserId = context.matches[1];
      const channel = message.channel;
      const reason = message.text;

      console.log(`🍌 Processing banana: ${fromUserId} → ${toUserId} in ${channel}`);

      // Don't allow self-recognition
      if (fromUserId === toUserId) {
        await this.client.chat.postEphemeral({
          channel: channel,
          user: fromUserId,
          text: "🚫 You can't give bananas to yourself! Share the love with teammates 🍌"
        });
        return;
      }

      // Get user data
      const [fromUserData, toUserData] = await Promise.all([
        this.db.getUserData(fromUserId),
        this.db.getUserData(toUserId)
      ]);

      // Award banana
      const newBananas = toUserData.bananas + 1;
      const levelCheck = LevelSystem.checkLevelUp(toUserData.bananas, newBananas);
      
      await this.db.updateUserBananas(toUserId, newBananas, levelCheck.newLevel);
      
      // Record transaction
      await this.db.recordTransaction(fromUserId, toUserId, reason, channel);

      // Update monthly stats
      const now = new Date();
      await Promise.all([
        this.db.updateMonthlyStats(fromUserId, now.getFullYear(), now.getMonth() + 1, 'given'),
        this.db.updateMonthlyStats(toUserId, now.getFullYear(), now.getMonth() + 1, 'received')
      ]);

      // Handle level up or regular acknowledgment
      if (levelCheck.leveledUp) {
        await this.handleLevelUp(toUserId, levelCheck.newLevel, newBananas, channel);
      } else {
        await this.handleRegularBanana(message, channel);
      }

      // Check for giver prize
      await this.checkGiverPrize(fromUserId);

      // Update last banana given date
      await this.db.updateLastBananaGiven(fromUserId);

    } catch (error) {
      console.error('🚫 Error processing banana:', error);
      console.error('Stack trace:', error.stack);
    }
  }

  async handleLevelUp(userId, newLevel, totalBananas, channel) {
    const avatar = LevelSystem.getAvatarForLevel(newLevel);
    const monkeyType = LevelSystem.getMonkeyType(newLevel);
    
    // Get a random monkey GIF from Giphy
    const monkeyGif = await this.getRandomMonkeyGif();
    
    await this.client.chat.postMessage({
      channel: channel,
      text: `🎉 Congratulations <@${userId}>! You've evolved to *Level ${newLevel} - ${monkeyType}* ${avatar}!\n🍌 Total bananas: ${totalBananas}`,
      blocks: monkeyGif ? [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🎉 Congratulations <@${userId}>! You've evolved to *Level ${newLevel} - ${monkeyType}* ${avatar}!\n🍌 Total bananas: ${totalBananas}`
          }
        },
        {
          type: "image",
          image_url: monkeyGif,
          alt_text: `${monkeyType} celebration`
        }
      ] : undefined
    });

    // Send DM about Avatar Studio (Level 2+)
    if (newLevel >= 2) {
      try {
        await this.client.chat.postMessage({
          channel: userId,
          text: `🎨 You've unlocked the *Avatar Studio*! Use \`/cesar-avatar\` to customize your pet monkey with new colors and accessories!`
        });
      } catch (dmError) {
        console.log('Could not send DM:', dmError);
      }
    }
  }

  async getRandomMonkeyGif() {
    try {
      // Use a predefined list of monkey-related GIFs for reliability
      const monkeyGifs = [
        'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/5Zesu5VPNGJlm/100.gif', 
        'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/H5C8CevNMbpBqNqFjl/200w.gif',
        'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Rlwz4m0aHgXH13jyrE/200w.gif',
        'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l4FGmO3MZkGng9Bp6/200w.gif',
        'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o85xAYQLOhSrmINHO/200w.gif',
        'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/42YlR8u9gV5Cw/200w.gif',
        'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/1BCIlYHwJ3hu0/100.gif',
        'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/H4zeDO4ocDYqY/200w.gif',
        'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/BBkKEBJkmFbTG/100.gif',
        'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/JcEbzHIM7lJBe/200w.gif',
        'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3oEdvbpl0X32bXD2Vi/200w.gif',
        'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/1wqYonEBtues7jlngs/200w.gif',
        'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/73vsXqHC22yuA/200w.gif',
        'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/KzGCAlMiK6hQQ/200w.gif',
        'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/dchERAZ73GvOE/100.gif',
        'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/qixJFUXq1UNLa/200w.gif',
        'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/5oYgxQKHhEjEk/200w.gif',
        'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/26DMYM4S4RytWCoQU/200w.gif',
        'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/qQP3sciaFQWAM/200w.gif',
        'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJqcGMzbjh0aWwyOTBucWIzamNuM2c1bXBxdG9heDN2dHcyZDRyMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ylyUQlf4VUVF9odXKU/100.gif',
        'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjZxdmw2M3g4azNlcG00NmZ4cXBmNHczeXR6eTczM2M0eWpzd3luZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1wqYonEBtues7jlngs/giphy.gif',
        'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGp1aXZmajV5c2R0dmZidXVoamJ6cHdmeWFoajltc2MwNzByZWRwbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/zVPfGm0EbLJNS/giphy.gif',
      ];
      
      
      return monkeyGifs[Math.floor(Math.random() * monkeyGifs.length)];
    } catch (error) {
      console.error('Error getting monkey GIF:', error);
      return null;
    }
  }

  async handleRegularBanana(message, channel) {
    try {
      await this.client.reactions.add({
        channel: channel,
        timestamp: message.ts,
        name: 'banana'
      });
    } catch (error) {
      console.error('Error adding banana reaction:', error);
    }
  }

  async checkGiverPrize(userId) {
    try {
      const count = await this.db.getTransactionCount(userId);
      
      if (count % 3 === 0 && count > 0) {
        // Award giver prize
        const giverData = await this.db.getUserData(userId);
        const newBananas = giverData.bananas + 1;
        const newLevel = LevelSystem.getLevelFromBananas(newBananas);
        
        await this.db.updateUserBananas(userId, newBananas, newLevel);
        
        // Check if giver leveled up too
        const levelCheck = LevelSystem.checkLevelUp(giverData.bananas, newBananas);
        if (levelCheck.leveledUp) {
          // Send level up notification to channel (not DM) so everyone can see
          await this.handleLevelUp(userId, levelCheck.newLevel, newBananas, userId);
        }
        
        try {
          await this.client.chat.postMessage({
            channel: userId,
            text: `🎁 *Banana Prize!* You've given ${count} bananas to teammates! Here's a bonus banana for being such a great helper! 🍌+1`
          });
        } catch (dmError) {
          console.log('Could not send giver prize DM:', dmError);
        }
      }
    } catch (error) {
      console.error('Error checking giver prize:', error);
    }
  }
}

module.exports = BananaHandler;
