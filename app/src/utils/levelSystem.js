/**
 * Level system utilities for banana-based progression
 */
class LevelSystem {
  /**
   * Calculate total bananas needed to reach a specific level
   * Level 1 = 0 bananas, Level 2 = 1 banana, Level 3 = 3 bananas, etc.
   * Uses triangular number formula: (n-1)*n/2
   */
  static getBananasForLevel(level) {
    if (level <= 1) return 0;
    return ((level - 1) * level) / 2;
  }

  /**
   * Calculate current level based on total bananas
   */
  static getLevelFromBananas(bananas) {
    let level = 1;
    while (this.getBananasForLevel(level + 1) <= bananas) {
      level++;
    }
    return level;
  }

  /**
   * Calculate bananas needed to reach next level
   */
  static getBananasToNextLevel(currentBananas) {
    const currentLevel = this.getLevelFromBananas(currentBananas);
    const nextLevelBananas = this.getBananasForLevel(currentLevel + 1);
    return nextLevelBananas - currentBananas;
  }

  /**
   * Get avatar emoji based on level
   */
  static getAvatarForLevel(level) {
    const avatars = [
      '🐒', '🙈', '🙉', '🙊', '🦍', '🦧', '🐵'
    ];
    return avatars[Math.min(level - 1, avatars.length - 1)];
  }

  /**
   * Check if user leveled up after gaining bananas
   */
  static checkLevelUp(oldBananas, newBananas) {
    const oldLevel = this.getLevelFromBananas(oldBananas);
    const newLevel = this.getLevelFromBananas(newBananas);
    return {
      leveledUp: newLevel > oldLevel,
      oldLevel,
      newLevel
    };
  }
}

module.exports = LevelSystem;
