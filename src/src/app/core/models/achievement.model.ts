/**
 * Achievement System Model
 * Tracks unlockable badges and milestones
 */

export type AchievementCategory = 'accuracy' | 'streak' | 'speed' | 'completion' | 'special';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;             // Material icon name
  category: AchievementCategory;
  requirement: number;      // Value needed to unlock
  progress: number;         // Current progress
  unlocked: boolean;
  unlockedAt?: Date;
  xpReward: number;
}

/**
 * Achievement definitions
 */
export const ACHIEVEMENTS: Omit<Achievement, 'progress' | 'unlocked' | 'unlockedAt'>[] = [
  // Accuracy Achievements
  {
    id: 'perfect_10',
    title: 'Perfect!',
    description: '10 perfect notes in a row',
    icon: 'looks_one',
    category: 'accuracy',
    requirement: 10,
    xpReward: 50
  },
  {
    id: 'perfect_50',
    title: 'Sharpshooter',
    description: '50 perfect notes in a row',
    icon: 'star',
    category: 'accuracy',
    requirement: 50,
    xpReward: 200
  },
  {
    id: 'flawless_lesson',
    title: 'Flawless',
    description: 'Complete a lesson with 100% accuracy',
    icon: 'emoji_events',
    category: 'accuracy',
    requirement: 1,
    xpReward: 150
  },

  // Streak Achievements
  {
    id: 'streak_5',
    title: 'On Fire!',
    description: '5-day practice streak',
    icon: 'local_fire_department',
    category: 'streak',
    requirement: 5,
    xpReward: 100
  },
  {
    id: 'streak_30',
    title: 'Dedicated',
    description: '30-day practice streak',
    icon: 'whatshot',
    category: 'streak',
    requirement: 30,
    xpReward: 500
  },
  {
    id: 'streak_100',
    title: 'Legend',
    description: '100-day practice streak',
    icon: 'military_tech',
    category: 'streak',
    requirement: 100,
    xpReward: 2000
  },

  // Completion Achievements
  {
    id: 'first_lesson',
    title: 'First Steps',
    description: 'Complete your first lesson',
    icon: 'check_circle',
    category: 'completion',
    requirement: 1,
    xpReward: 50
  },
  {
    id: 'lessons_10',
    title: 'Learner',
    description: 'Complete 10 lessons',
    icon: 'school',
    category: 'completion',
    requirement: 10,
    xpReward: 300
  },
  {
    id: 'lessons_50',
    title: 'Scholar',
    description: 'Complete 50 lessons',
    icon: 'workspace_premium',
    category: 'completion',
    requirement: 50,
    xpReward: 1000
  },

  // Special Achievements
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Practice after midnight',
    icon: 'nightlight',
    category: 'special',
    requirement: 1,
    xpReward: 25
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Practice before 6 AM',
    icon: 'wb_sunny',
    category: 'special',
    requirement: 1,
    xpReward: 25
  },
  {
    id: 'marathon',
    title: 'Marathon',
    description: '2 hours of practice in one session',
    icon: 'timer',
    category: 'special',
    requirement: 1,
    xpReward: 200
  }
];
