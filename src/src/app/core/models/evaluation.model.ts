// Evaluation models - matches Rust backend types

/**
 * Feedback types matching FeedbackType enum in Rust
 */
export type FeedbackType = 'Perfect' | 'Good' | 'Close' | 'Wrong';

/**
 * Evaluation result from check_note command
 * Matches EvaluationResult struct in Rust
 */
export interface EvaluationResult {
    pitch_correct: boolean;
    timing_correct: boolean;
    duration_correct: boolean;
    feedback: FeedbackType;
    score: number;
    message: string;
    timing_offset_ms: number;
    duration_diff_percent: number;
}

/**
 * Session statistics from get_stats command
 * Matches SessionStats struct in Rust
 */
export interface SessionStats {
    total_notes: number;
    correct_notes: number;
    perfect_notes: number;
    current_streak: number;
    best_streak: number;
    accuracy: number;
    average_score: number;
}

/**
 * Helper functions for feedback types
 */
export const FeedbackHelper = {
    /**
     * Get CSS color class for feedback type
     */
    getColor(feedback: FeedbackType): string {
        switch (feedback) {
            case 'Perfect':
            case 'Good':
                return 'green';
            case 'Close':
                return 'yellow';
            case 'Wrong':
                return 'red';
        }
    },

    /**
     * Get Material icon for feedback type
     */
    getIcon(feedback: FeedbackType): string {
        switch (feedback) {
            case 'Perfect':
                return 'star';
            case 'Good':
                return 'check_circle';
            case 'Close':
                return 'help_outline';
            case 'Wrong':
                return 'cancel';
        }
    },

    /**
     * Check if feedback is positive (correct pitch)
     */
    isPositive(feedback: FeedbackType): boolean {
        return feedback === 'Perfect' || feedback === 'Good' || feedback === 'Close';
    }
};
