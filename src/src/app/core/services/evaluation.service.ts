import { Injectable, computed, inject, signal } from '@angular/core';
import { EvaluationResult, SessionStats } from '../models';
import { TauriService } from './tauri.service';
import { ProgressService } from './progress.service';
import { AchievementService } from './achievement.service';
import { SoundService } from './sound.service';
import { PianoSoundService } from './piano-sound.service';

/**
 * Evaluation Service
 * Handles note checking and session statistics
 * Communicates with Rust evaluation backend
 */
@Injectable({
    providedIn: 'root'
})
export class EvaluationService {
    private tauri = inject(TauriService);
    private progressService = inject(ProgressService);
    private achievementService = inject(AchievementService);
    private soundService = inject(SoundService);
    private pianoService = inject(PianoSoundService);

    // Reactive signals for UI
    private _lastResult = signal<EvaluationResult | null>(null);
    private _stats = signal<SessionStats | null>(null);
    private _isEvaluating = signal(false);

    // Public computed signals
    readonly lastResult = this._lastResult.asReadonly();
    readonly stats = this._stats.asReadonly();
    readonly isEvaluating = this._isEvaluating.asReadonly();

    // Computed helpers
    readonly currentStreak = computed(() => this._stats()?.current_streak ?? 0);
    readonly accuracy = computed(() => this._stats()?.accuracy ?? 0);
    readonly totalNotes = computed(() => this._stats()?.total_notes ?? 0);

    /**
     * Initialize - listen for evaluation events from backend
     */
    async initialize(): Promise<void> {
        await this.tauri.listen<EvaluationResult>('note_evaluated', (result) => {
            this._lastResult.set(result);
            console.log('[Evaluation] Note evaluated:', result.feedback, result.message);
        });

        // Load initial stats
        await this.refreshStats();
    }

    /**
     * Check a single note against expected
     * Full evaluation with timing and duration
     */
    async checkNote(
        playedMidi: number,
        expectedMidi: number,
        playedTimeMs?: number,
        expectedTimeMs?: number,
        playedDurationMs?: number,
        expectedDurationMs?: number
    ): Promise<EvaluationResult> {
        this._isEvaluating.set(true);
        try {
            const result = await this.tauri.invoke<EvaluationResult>('check_note', {
                playedMidi: playedMidi,
                expectedMidi: expectedMidi,
                playedTimeMs: playedTimeMs,
                expectedTimeMs: expectedTimeMs,
                playedDurationMs: playedDurationMs,
                expectedDurationMs: expectedDurationMs
            });

            this._lastResult.set(result);
            await this.refreshStats();
            return result;
        } finally {
            this._isEvaluating.set(false);
        }
    }

    /**
     * Check pitch only (for Waiting mode)
     * Ignores timing and duration
     */
    async checkPitch(playedMidi: number, expectedMidi: number): Promise<EvaluationResult> {
        this._isEvaluating.set(true);
        try {
            const result = await this.tauri.invoke<EvaluationResult>('check_pitch', {
                playedMidi: playedMidi,
                expectedMidi: expectedMidi
            });

            this._lastResult.set(result);
            await this.refreshStats();

            // Award XP based on result
            const isPerfect = result.score >= 100;
            this.progressService.awardNoteXP(result.pitch_correct, isPerfect);

            // Track achievements and play sounds
            if (result.pitch_correct && isPerfect) {
                this.achievementService.onPerfectNote();
                // Play actual piano note for correct notes (satisfying feedback)
                this.pianoService.playNote(playedMidi, 100, 0.5);
            } else if (result.pitch_correct) {
                // Play piano note for correct notes
                this.pianoService.playNote(playedMidi, 80, 0.4);
            } else {
                this.achievementService.onWrongNote();
                // For wrong notes, play a subtle error sound (not the harsh beep)
                this.soundService.play('wrongNote');
            }

            // Play combo sound for streaks (keep this celebratory sound)
            const streak = this.currentStreak();
            if (streak >= 10 && streak % 5 === 0) {
                this.soundService.play('combo');
            }

            return result;
        } finally {
            this._isEvaluating.set(false);
        }
    }

    /**
     * Check if a chord matches expected notes
     * All notes must be correct for success
     */
    async checkChord(playedMidis: number[], expectedMidis: number[]): Promise<EvaluationResult[]> {
        const results: EvaluationResult[] = [];

        // Match each played note to nearest expected
        const remainingExpected = [...expectedMidis];

        for (const played of playedMidis) {
            // Find exact match first
            const exactIndex = remainingExpected.indexOf(played);
            if (exactIndex !== -1) {
                const result = await this.checkPitch(played, remainingExpected[exactIndex]);
                results.push(result);
                remainingExpected.splice(exactIndex, 1);
            } else if (remainingExpected.length > 0) {
                // Check against first remaining expected (will be wrong)
                const result = await this.checkPitch(played, remainingExpected[0]);
                results.push(result);
            }
        }

        return results;
    }

    /**
     * Get current session statistics
     */
    async getStats(): Promise<SessionStats> {
        const stats = await this.tauri.invoke<SessionStats>('get_stats');
        this._stats.set(stats);
        return stats;
    }

    /**
     * Refresh stats from backend
     */
    async refreshStats(): Promise<void> {
        try {
            await this.getStats();
        } catch (error) {
            console.error('[Evaluation] Failed to refresh stats:', error);
        }
    }

    /**
     * Reset all session statistics
     */
    async resetStats(): Promise<void> {
        await this.tauri.invoke('reset_stats');
        this._stats.set(null);
        this._lastResult.set(null);
    }

    /**
     * Award lesson completion XP
     * Call this when a lesson is completed
     */
    awardLessonCompletionXP(): void {
        const stats = this._stats();
        if (stats) {
            this.progressService.awardLessonXP(stats.accuracy);
            this.achievementService.onLessonComplete(stats.accuracy);
        }
    }

    /**
     * Clean up listeners
     */
    async cleanup(): Promise<void> {
        await this.tauri.unlisten('note_evaluated');
    }
}
