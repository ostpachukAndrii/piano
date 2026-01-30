/**
 * TypeScript models matching Rust backend DTOs
 * See: src-tauri/src/commands/lesson.rs (LessonDTO, MeasureDTO, LessonMetadata)
 */

import { NoteDTO } from './note.model';

/**
 * Lesson Mode - determines evaluation behavior
 *
 * Study modes (no timing):
 * - study_left_hand_no_timing: Learn bass clef note positions
 * - study_right_hand_no_timing: Learn treble clef note positions
 * - study_two_hands_no_timing: Learn hand coordination
 *
 * Play modes (with timing):
 * - play_left_hand_timing: Play bass line with rhythm
 * - play_right_hand_timing: Play melody with rhythm
 * - play_two_hands_timing: Full performance with both hands
 */
export type LessonMode =
    | 'study_left_hand_no_timing'
    | 'study_right_hand_no_timing'
    | 'study_two_hands_no_timing'
    | 'play_left_hand_timing'
    | 'play_right_hand_timing'
    | 'play_two_hands_timing';

/**
 * Check if a lesson mode requires timing
 */
export function isTimingMode(mode: LessonMode): boolean {
    return mode.includes('timing');
}

/**
 * Check if a lesson mode is for study (no timing pressure)
 */
export function isStudyMode(mode: LessonMode): boolean {
    return mode.includes('study');
}

/**
 * Get which hand(s) are used in a mode
 */
export function getModeHands(mode: LessonMode): 'left' | 'right' | 'both' {
    if (mode.includes('two_hands')) return 'both';
    if (mode.includes('left_hand')) return 'left';
    return 'right';
}

/**
 * Get human-readable label for lesson mode
 */
export function getLessonModeLabel(mode: LessonMode): string {
    const labels: Record<LessonMode, string> = {
        'study_left_hand_no_timing': '📖 Study Left Hand',
        'study_right_hand_no_timing': '📖 Study Right Hand',
        'study_two_hands_no_timing': '📖 Study Both Hands',
        'play_left_hand_timing': '🎵 Play Left Hand',
        'play_right_hand_timing': '🎵 Play Right Hand',
        'play_two_hands_timing': '🎹 Full Performance',
    };
    return labels[mode] || mode;
}

/**
 * Get difficulty level (1-6) for a lesson mode
 */
export function getLessonModeDifficulty(mode: LessonMode): number {
    const difficulty: Record<LessonMode, number> = {
        'study_left_hand_no_timing': 1,
        'study_right_hand_no_timing': 2,
        'play_right_hand_timing': 3,
        'play_left_hand_timing': 4,
        'study_two_hands_no_timing': 5,
        'play_two_hands_timing': 6,
    };
    return difficulty[mode] || 1;
}

/**
 * Complete lesson returned by load_lesson command
 * Matches: LessonDTO in Rust
 */
export interface LessonDTO {
    title: string;
    description?: string;
    mode?: LessonMode;  // Lesson type - defaults to study_right_hand_no_timing
    tempo: number;
    time_signature: string;
    key_signature: string;
    total_beats: number;
    total_seconds: number;
    measures: MeasureDTO[];
}

/**
 * A measure containing notes
 * Matches: MeasureDTO in Rust
 */
export interface MeasureDTO {
    number: number;
    notes: NoteDTO[];
}

/**
 * Lesson metadata for listing (lightweight)
 * Matches: LessonMetadata in Rust
 */
export interface LessonMetadataDTO {
    id: string;
    title: string;
    description?: string;
    mode?: LessonMode;
    duration_seconds: number;
}

/**
 * Lesson loading state for UI
 */
export interface LessonState {
    currentLesson: LessonDTO | null;
    availableLessons: LessonMetadataDTO[];
    loading: boolean;
    error: string | null;
}

/**
 * Format duration in seconds to mm:ss
 */
export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get difficulty color based on duration (simple heuristic)
 */
export function getDifficultyColor(durationSeconds: number): string {
    if (durationSeconds < 30) return '#4caf50'; // green - easy
    if (durationSeconds < 60) return '#ff9800'; // orange - medium
    return '#f44336'; // red - hard
}
