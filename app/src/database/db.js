const sqlite3 = require('sqlite3').verbose();

class Database {
  constructor(dbPath = 'cesar.db') {
    this.db = new sqlite3.Database(dbPath);
    this.initializeTables();
  }

  initializeTables() {
    this.db.serialize(() => {
      // Users table
      this.db.run(`CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        bananas INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        last_banana_given DATE,
        avatar_config TEXT DEFAULT '{"color": "yellow", "accessories": []}',
        avatar_image_url TEXT,
        avatar_prompt TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Banana transactions table
      this.db.run(`CREATE TABLE IF NOT EXISTS banana_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_user TEXT,
        to_user TEXT,
        reason TEXT,
        channel TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Monthly stats table
      this.db.run(`CREATE TABLE IF NOT EXISTS monthly_stats (
        user_id TEXT,
        year INTEGER,
        month INTEGER,
        bananas_given INTEGER DEFAULT 0,
        bananas_received INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, year, month)
      )`);
    });
  }

  getUserData(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (!row) {
            // Create new user
            this.db.run(
              'INSERT INTO users (user_id, bananas, level) VALUES (?, 0, 1)',
              [userId],
              function(err) {
                if (err) {
                  reject(err);
                  return;
                }
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
  }

  updateUserBananas(userId, bananas, level) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET bananas = ?, level = ? WHERE user_id = ?',
        [bananas, level, userId],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ bananas, level });
        }
      );
    });
  }

  recordTransaction(fromUser, toUser, reason, channel) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO banana_transactions (from_user, to_user, reason, channel) VALUES (?, ?, ?, ?)',
        [fromUser, toUser, reason, channel],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.lastID);
        }
      );
    });
  }

  updateMonthlyStats(userId, year, month, type) {
    const column = type === 'given' ? 'bananas_given' : 'bananas_received';
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO monthly_stats 
         (user_id, year, month, ${column}) 
         VALUES (?, ?, ?, 
           COALESCE((SELECT ${column} FROM monthly_stats WHERE user_id = ? AND year = ? AND month = ?), 0) + 1)`,
        [userId, year, month, userId, year, month],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  }

  getTopUsers(limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT u.user_id, 
               u.bananas, 
               u.level 
        FROM users u
        ORDER BY u.bananas DESC 
        LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
  }

  getUserRank(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT COUNT(*) + 1 as rank 
        FROM users u1
        WHERE u1.bananas > (
          SELECT bananas FROM users WHERE user_id = ?
        )`,
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row.rank);
        }
      );
    });
  }

  getTransactionCount(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT COUNT(*) as count FROM banana_transactions WHERE from_user = ?',
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row.count);
        }
      );
    });
  }

  getInactiveUsers(year, month) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT u.user_id 
        FROM users u 
        LEFT JOIN monthly_stats ms ON u.user_id = ms.user_id 
          AND ms.year = ? AND ms.month = ?
        WHERE COALESCE(ms.bananas_given, 0) = 0
      `, [year, month], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  updateLastBananaGiven(userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET last_banana_given = CURRENT_DATE WHERE user_id = ?',
        [userId],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  }

  updateAvatar(userId, imageUrl, prompt, accessories = []) {
    return new Promise((resolve, reject) => {
      const avatarConfig = JSON.stringify({ accessories });
      this.db.run(
        'UPDATE users SET avatar_image_url = ?, avatar_prompt = ?, avatar_config = ? WHERE user_id = ?',
        [imageUrl, prompt, avatarConfig, userId],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  }

  deductBananas(userId, amount) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET bananas = MAX(0, bananas - ?) WHERE user_id = ?',
        [amount, userId],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  }

  getUserReceivedBananas(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT COALESCE(SUM(bananas_received), 0) as received_bananas FROM monthly_stats WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row.received_bananas);
        }
      );
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;
