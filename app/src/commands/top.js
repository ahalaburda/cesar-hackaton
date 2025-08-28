const LevelSystem = require('../utils/levelSystem');

class TopCommand {
  constructor(database, client) {
    this.db = database;
    this.client = client;
  }

  async handle(command, ack, respond) {
    await ack();

    try {
      const userId = command.user_id;
      
      // Get top 10 users, current user data, and received bananas in parallel
      const [topUsers, userData, userReceivedBananas] = await Promise.all([
        this.db.getTopUsers(10),
        this.db.getUserData(userId),
        this.db.getUserReceivedBananas(userId)
      ]);

      // Get current user's rank
      const userRank = await this.db.getUserRank(userId);

      let rankingText = '🏆 **Top 10 Banana Rankings** 🍌\n\n';
      
      // Build ranking list
      for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`;
        const avatar = LevelSystem.getAvatarForLevel(user.level);
        
        try {
          const userInfo = await this.client.users.info({ user: user.user_id });
          const name = userInfo.user.display_name || userInfo.user.real_name || userInfo.user.name;
          rankingText += `${medal} ${avatar} **${name}** - Level ${user.level} (${user.bananas} 🍌)\n`;
        } catch {
          rankingText += `${medal} ${avatar} <@${user.user_id}> - Level ${user.level} (${user.bananas} 🍌)\n`;
        }
      }

      // Add user stats
      const bananasToNext = LevelSystem.getBananasToNextLevel(userReceivedBananas);
      const userAvatar = LevelSystem.getAvatarForLevel(userData.level);
      
      rankingText += `\n📍 **Your Stats:**\n${userAvatar} Rank: #${userRank} | Level: ${userData.level} | Bananas: ${userReceivedBananas} 🍌`;
      
      if (bananasToNext > 0) {
        rankingText += `\n🎯 ${bananasToNext} bananas to next level!`;
      }

      await respond({
        text: rankingText,
        response_type: 'ephemeral'
      });

    } catch (error) {
      console.error('Error with ranking command:', error);
      await respond('Error fetching rankings 😓');
    }
  }
}

module.exports = TopCommand;
