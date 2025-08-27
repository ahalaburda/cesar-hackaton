const cron = require('node-cron');
const LevelSystem = require('../utils/levelSystem');

class DecayService {
  constructor(database, app) {
    this.db = database;
    this.app = app;
    this.setupSchedule();
  }

  setupSchedule() {
    // Monthly banana decay (runs on 1st of each month at 9 AM)
    cron.schedule('0 9 1 * *', () => {
      this.runMonthlyDecay();
    });
  }

  async runMonthlyDecay() {
    console.log('Running monthly banana decay...');
    
    try {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const year = lastMonth.getFullYear();
      const month = lastMonth.getMonth() + 1;

      // Find users who didn't give any bananas last month
      const inactiveUsers = await this.db.getInactiveUsers(year, month);

      for (const user of inactiveUsers) {
        try {
          await this.processUserDecay(user.user_id);
        } catch (error) {
          console.error('Error processing decay for user:', user.user_id, error);
        }
      }

      console.log(`Processed decay for ${inactiveUsers.length} inactive users`);
    } catch (error) {
      console.error('Error during monthly decay:', error);
    }
  }

  async processUserDecay(userId) {
    const userData = await this.db.getUserData(userId);
    const newBananas = Math.max(0, userData.bananas - 2);
    const newLevel = LevelSystem.getLevelFromBananas(newBananas);
    
    await this.db.updateUserBananas(userId, newBananas, newLevel);

    // Send gentle nudge DM
    try {
      await this.app.client.chat.postMessage({
        channel: userId,
        text: `🍌 Hey there! You lost 2 bananas this month for not sharing any recognition. Remember, giving bananas helps build our team culture! Try giving some kudos this month! 😊`
      });
    } catch (dmError) {
      console.log('Could not send decay notification:', dmError);
    }
  }
}

module.exports = DecayService;
