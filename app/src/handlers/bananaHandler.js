const LevelSystem = require('../utils/levelSystem');

class BananaHandler {
  constructor(database, client) {
    this.db = database;
    this.client = client;
  }

  async processBananaMessage(message, context) {
    try {
      const fromUserId = message.user;
      const toUserId = context.matches[1];
      const channel = message.channel;
      const reason = message.text;

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
      console.error('Error processing banana:', error);
    }
  }

  async handleLevelUp(userId, newLevel, totalBananas, channel) {
    const avatar = LevelSystem.getAvatarForLevel(newLevel);
    
    await this.client.chat.postMessage({
      channel: channel,
      text: `🎉 Congratulations <@${userId}>! You've leveled up to *Level ${newLevel}* ${avatar}!\n🍌 Total bananas: ${totalBananas}`
    });

    // Send DM about Avatar Studio (Level 2+)
    if (newLevel >= 2) {
      try {
        await this.client.chat.postMessage({
          channel: userId,
          text: `🎨 You've unlocked the *Avatar Studio*! Use \`/avatar\` to customize your pet monkey with new colors and accessories!`
        });
      } catch (dmError) {
        console.log('Could not send DM:', dmError);
      }
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
