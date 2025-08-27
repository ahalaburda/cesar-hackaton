const { App } = require('@slack/bolt');
const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000
});

// Initialize SQLite database
const db = new sqlite3.Database('cesar.db');

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    bananas INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    last_banana_given DATE,
    avatar_config TEXT DEFAULT '{"color": "yellow", "accessories": []}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS banana_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user TEXT,
    to_user TEXT,
    reason TEXT,
    channel TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS monthly_stats (
    user_id TEXT,
    year INTEGER,
    month INTEGER,
    bananas_given INTEGER DEFAULT 0,
    bananas_received INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, year, month)
  )`);
});

// Helper functions
const getBananasForLevel = (level) => {
  return (level * (level + 1)) / 2;
};

const getLevelFromBananas = (bananas) => {
  let level = 1;
  while (getBananasForLevel(level) <= bananas) {
    level++;
  }
  return level - 1;
};

const getBananasToNextLevel = (currentBananas) => {
  const currentLevel = getLevelFromBananas(currentBananas);
  const nextLevelBananas = getBananasForLevel(currentLevel + 1);
  return nextLevelBananas - currentBananas;
};

const getUserData = (userId) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE user_id = ?',
      [userId],
      (err, row) => {
        if (err) reject(err);
        if (!row) {
          // Create new user
          db.run(
            'INSERT INTO users (user_id, bananas, level) VALUES (?, 0, 1)',
            [userId],
            function(err) {
              if (err) reject(err);
              resolve({
                user_id: userId,
                bananas: 0,
                level: 1,
                avatar_config: '{"color": "yellow", "accessories": []}'
              });
            }
          );
        } else {
          resolve(row);
        }
      }
    );
  });
};

const updateUserBananas = (userId, bananas) => {
  return new Promise((resolve, reject) => {
    const newLevel = getLevelFromBananas(bananas);
    db.run(
      'UPDATE users SET bananas = ?, level = ? WHERE user_id = ?',
      [bananas, newLevel, userId],
      function(err) {
        if (err) reject(err);
        resolve({ bananas, level: newLevel });
      }
    );
  });
};

const recordTransaction = (fromUser, toUser, reason, channel) => {
  db.run(
    'INSERT INTO banana_transactions (from_user, to_user, reason, channel) VALUES (?, ?, ?, ?)',
    [fromUser, toUser, reason, channel]
  );
};

const updateMonthlyStats = (userId, year, month, type) => {
  const column = type === 'given' ? 'bananas_given' : 'bananas_received';
  db.run(
    `INSERT OR REPLACE INTO monthly_stats 
     (user_id, year, month, ${column}) 
     VALUES (?, ?, ?, 
       COALESCE((SELECT ${column} FROM monthly_stats WHERE user_id = ? AND year = ? AND month = ?), 0) + 1)`,
    [userId, year, month, userId, year, month]
  );
};

const getAvatarForLevel = (level) => {
  const avatars = [
    '🐒', '🙈', '🙉', '🙊', '🦍', '🦧', '🐵'
  ];
  return avatars[Math.min(level - 1, avatars.length - 1)];
};

// Listen for banana mentions in messages
app.message(/.*:banana:.*<@([UW][A-Z0-9]+)>.*/, async ({ message, context, client }) => {
  try {
    const fromUserId = message.user;
    const toUserId = context.matches[1];
    const channel = message.channel;
    const reason = message.text;

    // Don't allow self-recognition
    if (fromUserId === toUserId) {
      await client.chat.postEphemeral({
        channel: channel,
        user: fromUserId,
        text: "🚫 You can't give bananas to yourself! Share the love with teammates 🍌"
      });
      return;
    }

    // Get user data
    const [fromUserData, toUserData] = await Promise.all([
      getUserData(fromUserId),
      getUserData(toUserId)
    ]);

    // Award banana
    const newBananas = toUserData.bananas + 1;
    const oldLevel = toUserData.level;
    const newLevel = getLevelFromBananas(newBananas);
    
    await updateUserBananas(toUserId, newBananas);
    
    // Record transaction
    recordTransaction(fromUserId, toUserId, reason, channel);

    // Update monthly stats
    const now = new Date();
    updateMonthlyStats(fromUserId, now.getFullYear(), now.getMonth() + 1, 'given');
    updateMonthlyStats(toUserId, now.getFullYear(), now.getMonth() + 1, 'received');

    // Check for level up
    if (newLevel > oldLevel) {
      const avatar = getAvatarForLevel(newLevel);
      await client.chat.postMessage({
        channel: channel,
        text: `🎉 Congratulations <@${toUserId}>! You've leveled up to **Level ${newLevel}** ${avatar}!\n🍌 Total bananas: ${newBananas}`
      });

      // Send DM about Avatar Studio (Level 2+)
      if (newLevel >= 2) {
        try {
          await client.chat.postMessage({
            channel: toUserId,
            text: `🎨 You've unlocked the **Avatar Studio**! Use \`/avatar\` to customize your pet monkey with new colors and accessories!`
          });
        } catch (dmError) {
          console.log('Could not send DM:', dmError);
        }
      }
    } else {
      // Regular banana acknowledgment
      const avatar = getAvatarForLevel(toUserData.level);
      await client.reactions.add({
        channel: channel,
        timestamp: message.ts,
        name: 'banana'
      });
    }

    // Check for giver prize (every 3 bananas given)
    db.get(
      'SELECT COUNT(*) as count FROM banana_transactions WHERE from_user = ?',
      [fromUserId],
      async (err, row) => {
        if (!err && row.count % 3 === 0) {
          // Award giver prize
          const giverData = await getUserData(fromUserId);
          await updateUserBananas(fromUserId, giverData.bananas + 1);
          
          try {
            await client.chat.postMessage({
              channel: fromUserId,
              text: `🎁 **Banana Prize!** You've given ${row.count} bananas to teammates! Here's a bonus banana for being such a great helper! 🍌+1`
            });
          } catch (dmError) {
            console.log('Could not send giver prize DM:', dmError);
          }
        }
      }
    );

    // Update last banana given date
    db.run('UPDATE users SET last_banana_given = CURRENT_DATE WHERE user_id = ?', [fromUserId]);

  } catch (error) {
    console.error('Error processing banana:', error);
  }
});

// Ranking slash command
app.command('/ranking', async ({ command, ack, respond, client }) => {
  await ack();

  try {
    const userId = command.user_id;
    
    // Get top 15 users
    db.all(
      'SELECT user_id, bananas, level FROM users ORDER BY bananas DESC LIMIT 15',
      async (err, topUsers) => {
        if (err) {
          await respond('Error fetching rankings 😓');
          return;
        }

        // Get current user's data
        const userData = await getUserData(userId);
        const userRank = await new Promise((resolve) => {
          db.get(
            'SELECT COUNT(*) + 1 as rank FROM users WHERE bananas > ?',
            [userData.bananas],
            (err, row) => resolve(err ? '?' : row.rank)
          );
        });

        let rankingText = '🏆 **Top 15 Banana Rankings** 🍌\n\n';
        
        for (let i = 0; i < topUsers.length; i++) {
          const user = topUsers[i];
          const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`;
          const avatar = getAvatarForLevel(user.level);
          
          try {
            const userInfo = await client.users.info({ user: user.user_id });
            const name = userInfo.user.display_name || userInfo.user.real_name || userInfo.user.name;
            rankingText += `${medal} ${avatar} **${name}** - Level ${user.level} (${user.bananas} 🍌)\n`;
          } catch {
            rankingText += `${medal} ${avatar} <@${user.user_id}> - Level ${user.level} (${user.bananas} 🍌)\n`;
          }
        }

        const bananasToNext = getBananasToNextLevel(userData.bananas);
        const userAvatar = getAvatarForLevel(userData.level);
        
        rankingText += `\n📍 **Your Stats:**\n${userAvatar} Rank: #${userRank} | Level: ${userData.level} | Bananas: ${userData.bananas} 🍌`;
        
        if (bananasToNext > 0) {
          rankingText += `\n🎯 ${bananasToNext} bananas to next level!`;
        }

        await respond({
          text: rankingText,
          response_type: 'ephemeral'
        });
      }
    );
  } catch (error) {
    console.error('Error with ranking command:', error);
    await respond('Error fetching rankings 😓');
  }
});

// Avatar customization command
app.command('/avatar', async ({ command, ack, respond }) => {
  await ack();

  try {
    const userData = await getUserData(command.user_id);
    
    if (userData.level < 2) {
      await respond({
        text: '🔒 Avatar Studio unlocks at **Level 2**! Keep earning bananas to customize your pet monkey! 🐒',
        response_type: 'ephemeral'
      });
      return;
    }

    const colors = ['yellow', 'brown', 'black', 'gray'];
    const accessories = userData.level >= 3 ? ['🎩', '👑', '🕶️', '🎀'] : ['🎩'];
    
    const config = JSON.parse(userData.avatar_config || '{"color": "yellow", "accessories": []}');
    
    let avatarText = '🎨 **Avatar Studio** 🐒\n\n';
    avatarText += `Current avatar: ${getAvatarForLevel(userData.level)}\n\n`;
    avatarText += `**Available colors:** ${colors.join(', ')}\n`;
    avatarText += `**Available accessories:** ${accessories.join(', ')}\n`;
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
});

// Monthly banana decay (runs on 1st of each month at 9 AM)
cron.schedule('0 9 1 * *', async () => {
  console.log('Running monthly banana decay...');
  
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const year = lastMonth.getFullYear();
  const month = lastMonth.getMonth() + 1;

  // Find users who didn't give any bananas last month
  db.all(`
    SELECT u.user_id 
    FROM users u 
    LEFT JOIN monthly_stats ms ON u.user_id = ms.user_id 
      AND ms.year = ? AND ms.month = ?
    WHERE COALESCE(ms.bananas_given, 0) = 0
  `, [year, month], async (err, users) => {
    if (err) {
      console.error('Error finding users for decay:', err);
      return;
    }

    for (const user of users) {
      try {
        const userData = await getUserData(user.user_id);
        const newBananas = Math.max(0, userData.bananas - 2);
        await updateUserBananas(user.user_id, newBananas);

        // Send gentle nudge DM
        try {
          await app.client.chat.postMessage({
            channel: user.user_id,
            text: `🍌 Hey there! You lost 2 bananas this month for not sharing any recognition. Remember, giving bananas helps build our team culture! Try giving some kudos this month! 😊`
          });
        } catch (dmError) {
          console.log('Could not send decay notification:', dmError);
        }
      } catch (error) {
        console.error('Error processing decay for user:', user.user_id, error);
      }
    }
  });
});

// Help command
app.command('/cesar-help', async ({ command, ack, respond }) => {
  await ack();

  const helpText = `🐒 **César - Slack Kudos Help** 🍌

**How to give bananas:**
In any public channel: \`:banana: @username for helping me with the deploy!\`

**Commands:**
• \`/ranking\` - See top 15 users and your stats
• \`/avatar\` - Customize your pet monkey (Level 2+)
• \`/cesar-help\` - Show this help

**Leveling System:**
• Level 1: 1 banana 🍌
• Level 2: 3 bananas 🍌🍌🍌 (unlocks Avatar Studio)
• Level 3: 6 bananas (more accessories)
• Level n: triangular progression (1+2+3+...+n)

**Features:**
• 🎁 **Giver Prize**: Bonus banana every 3 you give!
• 🔄 **Monthly Nudge**: -2 bananas if you don't give any in a month
• 🎨 **Avatar Studio**: Customize your monkey at Level 2+

Spread the recognition and help build our team culture! 🚀`;

  await respond({
    text: helpText,
    response_type: 'ephemeral'
  });
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