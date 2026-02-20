/**
 * Note state for rendering in the scrolling player
 */
export type NoteState = 'upcoming' | 'active' | 'hit' | 'missed';

/**
 * Timing feedback for note performance
 * - perfect: Hit within the timing window
 * - early: Pressed before the note should have started
 * - late: Started playing after the note should have started
 * - early_release: Released the key before the note duration ended
 * - replayed: Released and pressed again during the same note
 */
export type TimingFeedback = 'perfect' | 'early' | 'late' | 'early_release' | 'replayed' | null;

/**
 * Represents a note or chord in the scrolling player
 */
export interface ScrollingNote {
    /** MIDI note numbers (single note = 1 element, chord = multiple) */
    midi: number[];
    /** Start position in beats from beginning of lesson */
    startBeat: number;
    /** Duration in beats */
    durationBeats: number;
    /** Current rendering/evaluation state */
    state: NoteState;
    /** Which hand plays this note */
    hand: 'left' | 'right';
    /** Whether this is a rest (no sound) */
    isRest: boolean;
    /** Timing feedback (null = not evaluated yet) */
    timingFeedback?: TimingFeedback;
    /** Beat position when the note was actually hit (for late detection) */
    hitBeat?: number;
    /** Whether the note was released early (before duration ended) */
    releasedEarly?: boolean;
    /** Whether the note was replayed after release */
    wasReplayed?: boolean;
    /** How long the note was actually held (in milliseconds) */
    heldDurationMs?: number;
    /** Expected note duration (in milliseconds) */
    expectedDurationMs?: number;
    /** Timestamp when note was first pressed */
    pressedAtMs?: number;
}

/**
 * State for a single piano key
 */
export interface KeyState {
    isHint: boolean;
    isActive: boolean;
    isCorrect: boolean;
    isWrong: boolean;
}

/**
 * Visible key data for rendering the virtual keyboard
 */
export interface VisibleKey {
    midi: number;
    isBlack: boolean;
    label: string;
    x: number;
    width: number;
    isHint: boolean;
    isActive: boolean;
    isCorrect: boolean;
    isWrong: boolean;
    isTonic: boolean; // Highlight as the root/home note
}

/**
 * Keyboard range in MIDI note numbers
 */
export interface KeyboardRange {
    min: number;
    max: number;
}

/**
 * Event tracking a wrong note played during the lesson
 */
export interface WrongNoteEvent {
    /** MIDI note that was played incorrectly */
    midi: number;
    /** Beat position when the wrong note was played */
    beat: number;
    /** Timestamp when the wrong note was played (for fade-out) */
    timestamp: number;
}

/**
 * Represents a range of measures for focused practice
 * When set, playback will loop within this range
 */
export interface PracticeLoopRange {
    /** Start measure (1-indexed, inclusive) */
    startMeasure: number;
    /** End measure (1-indexed, inclusive) */
    endMeasure: number;
}

/**
 * A group of notes that should be beamed together
 * Only for notes with duration < 1 beat (8th, 16th, etc.)
 */
export interface BeamGroup {
    /** Notes in the beam group (ordered by start beat) */
    notes: ScrollingNote[];
    /** Common stem direction for the group (true = up, false = down) */
    stemUp: boolean;
    /** X positions for each note in the group */
    xPositions: number[];
    /** Y positions (average midi Y) for each note */
    yPositions: number[];
    /** Number of beam lines (1 = 8th, 2 = 16th, 3 = 32nd) */
    beamCount: number;
}

/**
 * A unique left-hand chord/note pattern extracted from a song.
 * Patterns are sorted by frequency (most common first) so users
 * learn the most-practiced chord first.
 */
export interface LeftHandPattern {
    /** Sorted MIDI note numbers defining this pattern (e.g., [56, 60]) */
    midi: number[];
    /** How many times this pattern appears in the song */
    count: number;
    /** Human-readable label (e.g., "Ab+C") */
    label: string;
}

/**
 * Key signature information parsed from lesson settings
 */
export interface KeySignature {
    /** Root note name (C, G, F, etc.) */
    root: string;
    /** Mode (major or minor) */
    mode: 'major' | 'minor';
    /** Number of sharps (positive) or flats (negative) */
    accidentals: number;
    /** Which notes are sharped (MIDI note % 12 values) */
    sharpNotes: number[];
    /** Which notes are flatted (MIDI note % 12 values) */
    flatNotes: number[];
}
