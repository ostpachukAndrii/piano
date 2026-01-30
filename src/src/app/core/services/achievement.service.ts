import { Injectable, signal, inject } from '@angular/core';
import { Achievement, ACHIEVEMENTS } from '../models/achievement.model';
import { ProgressService } from './progress.service';
import { SoundService } from './sound.service';

/**
 * Achievement Service
 * Manages unlockable achievements and badges
 */
@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  private progressService = inject(ProgressService);
  private soundService = inject(SoundService);

  // State
  private readonly _achievements = signal<Achievement[]>([]);
  private readonly _recentUnlock = signal<Achievement | null>(null);

  // Public signals
  readonly achievements = this._achievements.asReadonly();
  readonly recentUnlock = this._recentUnlock.asReadonly();

  // Counters for achievement tracking
  private perfectNoteStreak = 0;
  private lessonsCompleted = 0;
  private practiceSessionStart: Date | null = null;

  constructor() {
    this.loadAchievements();
  }

  /**
   * Check and update progress for an achievement
   */
  checkAchievement(achievementId: string, currentValue: number): void {
    const achievements = this._achievements();
    const achievement = achievements.find(a => a.id === achievementId);

    if (!achievement || achievement.unlocked) return;

    // Update progress
    achievement.progress = Math.min(currentValue, achievement.requirement);

    // Check if unlocked
    if (achievement.progress >= achievement.requirement) {
      this.unlockAchievement(achievement);
    }

    this._achievements.set([...achievements]);
    this.saveAchievements();
  }

  /**
   * Unlock an achievement
   */
  private unlockAchievement(achievement: Achievement): void {
    achievement.unlocked = true;
    achievement.unlockedAt = new Date();

    // Play achievement sound
    this.soundService.play('achievement');

    // Award XP
    this.progressService.awardXP(achievement.xpReward, `Achievement: ${achievement.title}`);

    // Show notification
    this._recentUnlock.set(achievement);
    console.log(`[Achievement] Unlocked: ${achievement.title}`);

    // Clear notification after 5 seconds
    setTimeout(() => {
      if (this._recentUnlock() === achievement) {
        this._recentUnlock.set(null);
      }
    }, 5000);

    this.saveAchievements();
  }

  /**
   * Track perfect note streak
   */
  onPerfectNote(): void {
    this.perfectNoteStreak++;

    // Check achievements
    this.checkAchievement('perfect_10', this.perfectNoteStreak);
    this.checkAchievement('perfect_50', this.perfectNoteStreak);
  }

  /**
   * Reset perfect note streak
   */
  onWrongNote(): void {
    this.perfectNoteStreak = 0;
  }

  /**
   * Track lesson completion
   */
  onLessonComplete(accuracy: number): void {
    this.lessonsCompleted++;

    // Check completion achievements
    this.checkAchievement('first_lesson', this.lessonsCompleted);
    this.checkAchievement('lessons_10', this.lessonsCompleted);
    this.checkAchievement('lessons_50', this.lessonsCompleted);

    // Check flawless
    if (accuracy >= 100) {
      this.checkAchievement('flawless_lesson', 1);
    }
  }

  /**
   * Track practice session start
   */
  startPracticeSession(): void {
    this.practiceSessionStart = new Date();

    // Check time-based achievements
    const hour = this.practiceSessionStart.getHours();
    if (hour >= 0 && hour < 6) {
      this.checkAchievement('early_bird', 1);
    } else if (hour === 0) {
      this.checkAchievement('night_owl', 1);
    }
  }

  /**
   * Track practice session end
   */
  endPracticeSession(): void {
    if (!this.practiceSessionStart) return;

    const sessionDuration = Date.now() - this.practiceSessionStart.getTime();
    const twoHours = 2 * 60 * 60 * 1000;

    if (sessionDuration >= twoHours) {
      this.checkAchievement('marathon', 1);
    }

    this.practiceSessionStart = null;
  }

  /**
   * Update daily streak achievement
   */
  updateStreakAchievements(streakDays: number): void {
    this.checkAchievement('streak_5', streakDays);
    this.checkAchievement('streak_30', streakDays);
    this.checkAchievement('streak_100', streakDays);
  }

  /**
   * Get achievements by category
   */
  getByCategory(category: string): Achievement[] {
    return this._achievements().filter(a => a.category === category);
  }

  /**
   * Get unlocked achievements
   */
  getUnlocked(): Achievement[] {
    return this._achievements().filter(a => a.unlocked);
  }

  /**
   * Get locked achievements
   */
  getLocked(): Achievement[] {
    return this._achievements().filter(a => !a.unlocked);
  }

  /**
   * Reset all achievements (for testing)
   */
  reset(): void {
    const fresh = ACHIEVEMENTS.map(def => ({
      ...def,
      progress: 0,
      unlocked: false
    }));

    this._achievements.set(fresh);
    this.perfectNoteStreak = 0;
    this.lessonsCompleted = 0;
    this.saveAchievements();
  }

  /**
   * Load achievements from localStorage
   */
  private loadAchievements(): void {
    const saved = localStorage.getItem('achievements');

    if (saved) {
      try {
        const data = JSON.parse(saved) as Achievement[];
        this._achievements.set(data);
        return;
      } catch (e) {
        console.error('[Achievement] Failed to load achievements:', e);
      }
    }

    // Initialize with defaults
    const fresh = ACHIEVEMENTS.map(def => ({
      ...def,
      progress: 0,
      unlocked: false
    }));

    this._achievements.set(fresh);
  }

  /**
   * Save achievements to localStorage
   */
  private saveAchievements(): void {
    localStorage.setItem('achievements', JSON.stringify(this._achievements()));
  }
}
