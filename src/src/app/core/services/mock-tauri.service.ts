import { Injectable } from '@angular/core';
import { EvaluationResult, SessionStats } from '../models';
import { LessonDTO, LessonMetadataDTO } from '../models/lesson.model';
import { MAD_WORLD_LESSON } from './mock-lessons/mad-world.data';

/**
 * Mock Tauri Service for E2E testing
 *
 * Drop-in replacement for TauriService that handles all Tauri commands
 * in-memory. Used when the app runs in E2E test mode (?e2e query param).
 */
@Injectable({
    providedIn: 'root'
})
export class MockTauriService {
    private listeners: Map<string, Function> = new Map();

    private stats: SessionStats = {
        total_notes: 0,
        correct_notes: 0,
        perfect_notes: 0,
        current_streak: 0,
        best_streak: 0,
        accuracy: 0,
        average_score: 0,
    };

    private totalScore = 0;

    private mockLessons: LessonMetadataDTO[] = [
        {
            id: 'ode-to-joy',
            title: 'Ode to Joy',
            description: 'Beethoven - Simple melody',
            mode: 'study_right_hand_no_timing',
            duration_seconds: 30,
        },
        {
            id: 'c-major-scale',
            title: 'C Major Scale',
            description: 'Basic scale exercise',
            mode: 'study_two_hands_no_timing',
            duration_seconds: 15,
        },
        {
            id: 'all-note-types',
            title: 'All Note Types',
            description: 'Learn different note durations: whole, half, quarter, and eighth notes',
            mode: 'study_right_hand_no_timing',
            duration_seconds: 16,
        },
        {
            id: 'mad-world-piano',
            title: 'Mad World',
            description: 'Roland Orzbal / Michael Andrew — Piano arrangement with both hands',
            mode: 'study_two_hands_no_timing',
            duration_seconds: 94,
        },
    ];

    private mockLessonData: Record<string, LessonDTO> = {
        'ode-to-joy': {
            title: 'Ode to Joy',
            description: "Beethoven's famous melody from Symphony No. 9",
            mode: 'study_right_hand_no_timing',
            tempo: 100,
            time_signature: '4/4',
            key_signature: 'C major',
            total_beats: 32,
            total_seconds: 77,
            measures: [
                {
                    number: 1,
                    notes: [
                        { midi: 64, duration: 1.0, hand: 'right' }, // E
                        { midi: 64, duration: 1.0, hand: 'right' }, // E
                        { midi: 65, duration: 1.0, hand: 'right' }, // F
                        { midi: 67, duration: 1.0, hand: 'right' }, // G
                    ],
                },
                {
                    number: 2,
                    notes: [
                        { midi: 67, duration: 1.0, hand: 'right' }, // G
                        { midi: 65, duration: 1.0, hand: 'right' }, // F
                        { midi: 64, duration: 1.0, hand: 'right' }, // E
                        { midi: 62, duration: 1.0, hand: 'right' }, // D
                    ],
                },
                {
                    number: 3,
                    notes: [
                        { midi: 60, duration: 1.0, hand: 'right' }, // C
                        { midi: 60, duration: 1.0, hand: 'right' }, // C
                        { midi: 62, duration: 1.0, hand: 'right' }, // D
                        { midi: 64, duration: 1.0, hand: 'right' }, // E
                    ],
                },
                {
                    number: 4,
                    notes: [
                        { midi: 64, duration: 1.5, hand: 'right' }, // E dotted quarter
                        { midi: 62, duration: 0.5, hand: 'right' }, // D eighth
                        { midi: 62, duration: 2.0, hand: 'right' }, // D half
                    ],
                },
                {
                    number: 5,
                    notes: [
                        { midi: 64, duration: 1.0, hand: 'right' }, // E
                        { midi: 64, duration: 1.0, hand: 'right' }, // E
                        { midi: 65, duration: 1.0, hand: 'right' }, // F
                        { midi: 67, duration: 1.0, hand: 'right' }, // G
                    ],
                },
                {
                    number: 6,
                    notes: [
                        { midi: 67, duration: 1.0, hand: 'right' }, // G
                        { midi: 65, duration: 1.0, hand: 'right' }, // F
                        { midi: 64, duration: 1.0, hand: 'right' }, // E
                        { midi: 62, duration: 1.0, hand: 'right' }, // D
                    ],
                },
                {
                    number: 7,
                    notes: [
                        { midi: 60, duration: 1.0, hand: 'right' }, // C
                        { midi: 60, duration: 1.0, hand: 'right' }, // C
                        { midi: 62, duration: 1.0, hand: 'right' }, // D
                        { midi: 64, duration: 1.0, hand: 'right' }, // E
                    ],
                },
                {
                    number: 8,
                    notes: [
                        { midi: 62, duration: 1.5, hand: 'right' }, // D dotted quarter
                        { midi: 60, duration: 0.5, hand: 'right' }, // C eighth
                        { midi: 60, duration: 2.0, hand: 'right' }, // C half
                    ],
                },
            ],
        },
        'all-note-types': {
            title: 'All Note Types',
            description: 'Learn different note durations: whole, half, quarter, and eighth notes',
            mode: 'study_right_hand_no_timing',
            tempo: 60,
            time_signature: '4/4',
            key_signature: 'C major',
            total_beats: 16,
            total_seconds: 16,
            measures: [
                {
                    number: 1,
                    notes: [
                        { midi: 60, duration: 4.0, hand: 'right' }, // C4 whole note
                    ],
                },
                {
                    number: 2,
                    notes: [
                        { midi: 62, duration: 2.0, hand: 'right' }, // D4 half note
                        { midi: 64, duration: 2.0, hand: 'right' }, // E4 half note
                    ],
                },
                {
                    number: 3,
                    notes: [
                        { midi: 65, duration: 1.0, hand: 'right' }, // F4 quarter
                        { midi: 67, duration: 1.0, hand: 'right' }, // G4 quarter
                        { midi: 69, duration: 1.0, hand: 'right' }, // A4 quarter
                        { midi: 71, duration: 1.0, hand: 'right' }, // B4 quarter
                    ],
                },
                {
                    number: 4,
                    notes: [
                        { midi: 72, duration: 0.5, hand: 'right' }, // C5 eighth
                        { midi: 74, duration: 0.5, hand: 'right' }, // D5 eighth
                        { midi: 76, duration: 0.5, hand: 'right' }, // E5 eighth
                        { midi: 77, duration: 0.5, hand: 'right' }, // F5 eighth
                        { midi: 79, duration: 0.5, hand: 'right' }, // G5 eighth
                        { midi: 77, duration: 0.5, hand: 'right' }, // F5 eighth
                        { midi: 76, duration: 0.5, hand: 'right' }, // E5 eighth
                        { midi: 74, duration: 0.5, hand: 'right' }, // D5 eighth
                    ],
                },
            ],
        },
        'mad-world-piano': MAD_WORLD_LESSON,
        'c-major-scale': {
            title: 'C Major Scale',
            description: 'Basic scale exercise',
            mode: 'study_two_hands_no_timing',
            tempo: 100,
            time_signature: '4/4',
            key_signature: 'C major',
            total_beats: 8,
            total_seconds: 15,
            measures: [
                {
                    number: 1,
                    notes: [
                        { midi: 60, duration: 1.0, hand: 'right' },
                        { midi: 62, duration: 1.0, hand: 'right' },
                        { midi: 64, duration: 1.0, hand: 'right' },
                        { midi: 65, duration: 1.0, hand: 'right' },
                    ],
                },
                {
                    number: 2,
                    notes: [
                        { midi: 67, duration: 1.0, hand: 'right' },
                        { midi: 69, duration: 1.0, hand: 'right' },
                        { midi: 71, duration: 1.0, hand: 'right' },
                        { midi: 72, duration: 1.0, hand: 'right' },
                    ],
                },
            ],
        },
    };

    async invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
        switch (cmd) {
            case 'check_pitch':
                return this.handleCheckPitch(args) as T;

            case 'check_note':
                return this.handleCheckNote(args) as T;

            case 'get_stats':
                return { ...this.stats } as T;

            case 'reset_stats':
                this.resetStats();
                return undefined as T;

            case 'list_lessons':
                return [...this.mockLessons] as T;

            case 'load_lesson': {
                const lessonId = args?.['lessonId'] as string;
                const lesson = this.mockLessonData[lessonId];
                if (!lesson) {
                    throw new Error(`Lesson not found: ${lessonId}`);
                }
                return { ...lesson } as T;
            }

            default:
                console.warn(`[MockTauri] Unhandled command: ${cmd}`, args);
                return undefined as T;
        }
    }

    async listen<T>(_event: string, handler: (payload: T) => void): Promise<void> {
        this.listeners.set(_event, handler);
    }

    async unlisten(event: string): Promise<void> {
        this.listeners.delete(event);
    }

    async cleanup(): Promise<void> {
        this.listeners.clear();
    }

    isTauri(): boolean {
        return true;
    }

    private handleCheckPitch(args?: Record<string, unknown>): EvaluationResult {
        const played = args?.['playedMidi'] as number ?? 0;
        const expected = args?.['expectedMidi'] as number ?? 0;
        const isCorrect = played === expected;

        const result: EvaluationResult = {
            pitch_correct: isCorrect,
            timing_correct: true,
            duration_correct: true,
            feedback: isCorrect ? 'Perfect' : 'Wrong',
            score: isCorrect ? 100 : 0,
            message: isCorrect ? 'Perfect pitch!' : `Expected ${expected}, got ${played}`,
            timing_offset_ms: 0,
            duration_diff_percent: 0,
        };

        this.updateStats(result);
        return result;
    }

    private handleCheckNote(args?: Record<string, unknown>): EvaluationResult {
        const played = args?.['playedMidi'] as number ?? 0;
        const expected = args?.['expectedMidi'] as number ?? 0;
        const isCorrect = played === expected;

        const result: EvaluationResult = {
            pitch_correct: isCorrect,
            timing_correct: isCorrect,
            duration_correct: isCorrect,
            feedback: isCorrect ? 'Perfect' : 'Wrong',
            score: isCorrect ? 100 : 0,
            message: isCorrect ? 'Perfect!' : 'Wrong note',
            timing_offset_ms: 0,
            duration_diff_percent: 0,
        };

        this.updateStats(result);
        return result;
    }

    private updateStats(result: EvaluationResult): void {
        this.stats.total_notes++;
        this.totalScore += result.score;

        if (result.pitch_correct) {
            this.stats.correct_notes++;
            this.stats.current_streak++;

            if (result.score >= 100) {
                this.stats.perfect_notes++;
            }

            if (this.stats.current_streak > this.stats.best_streak) {
                this.stats.best_streak = this.stats.current_streak;
            }
        } else {
            this.stats.current_streak = 0;
        }

        this.stats.accuracy = Math.round(
            (this.stats.correct_notes / this.stats.total_notes) * 100
        );
        this.stats.average_score = Math.round(
            this.totalScore / this.stats.total_notes
        );
    }

    private resetStats(): void {
        this.stats = {
            total_notes: 0,
            correct_notes: 0,
            perfect_notes: 0,
            current_streak: 0,
            best_streak: 0,
            accuracy: 0,
            average_score: 0,
        };
        this.totalScore = 0;
    }
}
