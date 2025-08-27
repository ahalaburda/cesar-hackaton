/**
 * Level system utilities for banana-based progression
 */
class LevelSystem {
  /**
   * Calculate total bananas needed to reach a specific level
   * Uses triangular number formula: n(n+1)/2
   */
  static getBananasForLevel(level) {
    return (level * (level + 1)) / 2;
  }

  /**
   * Calculate current level based on total bananas
   */
  static getLevelFromBananas(bananas) {
    let level = 1;
    while (this.getBananasForLevel(level) <= bananas) {
      level++;
    }
    return level - 1;
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
