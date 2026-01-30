/**
 * User Progress Model
 * Tracks XP, levels, and progression
 */

export interface UserProgress {
  level: number;           // Player level (1-100)
  xp: number;             // Current XP within this level
  xpToNextLevel: number;  // XP needed for next level
  totalXP: number;        // Lifetime XP earned
}

export interface XPGain {
  amount: number;
  reason: string;
  levelUp: boolean;
  newLevel?: number;
}

/**
 * XP reward amounts for different actions
 */
export const XPRewards = {
  PERFECT_NOTE: 10,
  GOOD_NOTE: 5,
  CORRECT_NOTE: 3,
  WRONG_NOTE: 0,
  COMPLETE_LESSON: 100,
  PERFECT_LESSON: 200,    // 100% accuracy
  DAILY_PRACTICE: 50,
  WEEKLY_STREAK: 200,
  ACHIEVEMENT_UNLOCK: 50
} as const;

/**
 * Calculate XP needed for a level
 * Uses exponential curve: level^2 * 100
 */
export function calculateXPForLevel(level: number): number {
  return Math.floor(Math.pow(level, 2) * 100);
}

/**
 * Calculate level from total XP
 */
export function calculateLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpRequired = 0;

  while (xpRequired <= totalXP) {
    level++;
    xpRequired += calculateXPForLevel(level - 1);
  }

  return Math.max(1, level - 1);
}

/**
 * Calculate current XP within level
 */
export function calculateCurrentXP(totalXP: number, level: number): number {
  let xpRequired = 0;
  for (let i = 1; i < level; i++) {
    xpRequired += calculateXPForLevel(i);
  }
  return totalXP - xpRequired;
}
