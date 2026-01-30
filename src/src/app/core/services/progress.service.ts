import { Injectable, signal, computed, inject } from '@angular/core';
import {
  UserProgress,
  XPGain,
  XPRewards,
  calculateXPForLevel,
  calculateLevelFromXP,
  calculateCurrentXP
} from '../models/progress.model';
import { SoundService } from './sound.service';

/**
 * Progress Service
 * Manages user XP, levels, and progression
 */
@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private soundService = inject(SoundService);

  // State
  private readonly _totalXP = signal(0);
  private readonly _lastXPGain = signal<XPGain | null>(null);

  // Computed values
  readonly totalXP = this._totalXP.asReadonly();
  readonly lastXPGain = this._lastXPGain.asReadonly();

  readonly progress = computed<UserProgress>(() => {
    const total = this._totalXP();
    const level = calculateLevelFromXP(total);
    const currentXP = calculateCurrentXP(total, level);
    const xpToNext = calculateXPForLevel(level);

    return {
      level,
      xp: currentXP,
      xpToNextLevel: xpToNext,
      totalXP: total
    };
  });

  readonly progressPercent = computed(() => {
    const prog = this.progress();
    return Math.round((prog.xp / prog.xpToNextLevel) * 100);
  });

  constructor() {
    // Load from localStorage
    this.loadProgress();
  }

  /**
   * Award XP to the user
   */
  awardXP(amount: number, reason: string): XPGain {
    const oldLevel = this.progress().level;
    const newTotalXP = this._totalXP() + amount;
    this._totalXP.set(newTotalXP);

    const newLevel = calculateLevelFromXP(newTotalXP);
    const levelUp = newLevel > oldLevel;

    const gain: XPGain = {
      amount,
      reason,
      levelUp,
      newLevel: levelUp ? newLevel : undefined
    };

    this._lastXPGain.set(gain);
    this.saveProgress();

    console.log(`[Progress] Awarded ${amount} XP for ${reason}. Total: ${newTotalXP} (Level ${newLevel})`);

    // Play level-up sound
    if (levelUp) {
      this.soundService.play('levelUp');
    }

    // Clear last gain after animation
    setTimeout(() => this._lastXPGain.set(null), 3000);

    return gain;
  }

  /**
   * Award XP for note accuracy
   */
  awardNoteXP(pitchCorrect: boolean, isPerfect: boolean = false): XPGain {
    let amount = 0;
    let reason = '';

    if (!pitchCorrect) {
      amount = XPRewards.WRONG_NOTE;
      reason = 'Wrong note';
    } else if (isPerfect) {
      amount = XPRewards.PERFECT_NOTE;
      reason = 'Perfect note!';
    } else {
      amount = XPRewards.CORRECT_NOTE;
      reason = 'Correct note';
    }

    return this.awardXP(amount, reason);
  }

  /**
   * Award XP for lesson completion
   */
  awardLessonXP(accuracy: number): XPGain {
    const isPerfect = accuracy >= 100;
    const amount = isPerfect ? XPRewards.PERFECT_LESSON : XPRewards.COMPLETE_LESSON;
    const reason = isPerfect ? 'Perfect lesson!' : 'Lesson complete';

    return this.awardXP(amount, reason);
  }

  /**
   * Award daily practice bonus
   */
  awardDailyBonus(): XPGain {
    return this.awardXP(XPRewards.DAILY_PRACTICE, 'Daily practice bonus');
  }

  /**
   * Award streak bonus
   */
  awardStreakBonus(days: number): XPGain {
    return this.awardXP(XPRewards.WEEKLY_STREAK, `${days}-day streak!`);
  }

  /**
   * Reset progress (for testing)
   */
  reset(): void {
    this._totalXP.set(0);
    this._lastXPGain.set(null);
    this.saveProgress();
  }

  /**
   * Load progress from localStorage
   */
  private loadProgress(): void {
    const saved = localStorage.getItem('userProgress');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this._totalXP.set(data.totalXP || 0);
      } catch (e) {
        console.error('[Progress] Failed to load progress:', e);
      }
    }
  }

  /**
   * Save progress to localStorage
   */
  private saveProgress(): void {
    localStorage.setItem('userProgress', JSON.stringify({
      totalXP: this._totalXP()
    }));
  }
}
