/**
 * TypeScript models matching Rust backend DTOs
 * See: src-tauri/src/commands/lesson.rs (NoteDTO)
 * 
 * Uses discriminated union via property presence (untagged in Rust)
 */

/**
 * Single note - has `midi` as number
 */
export interface SingleNoteDTO {
    midi: number;
    duration: number;
    hand: string;
    accidental?: string;
    start_beat?: number;
}

/**
 * Chord - has `midi` as array of numbers
 */
export interface ChordNoteDTO {
    midi: number[];
    duration: number;
    hand: string;
    chord?: string;
    start_beat?: number;
}

/**
 * Rest - has duration and hand, no midi
 */
export interface RestNoteDTO {
    duration: number;
    hand: string;
    start_beat?: number;
}

/**
 * Note union type - matches Rust's #[serde(untagged)] NoteDTO enum
 */
export type NoteDTO = SingleNoteDTO | ChordNoteDTO | RestNoteDTO;

/**
 * Type guards for note discrimination
 */
export function isSingleNote(note: NoteDTO): note is SingleNoteDTO {
    const obj = note as unknown as Record<string, unknown>;
    return 'midi' in note && typeof obj['midi'] === 'number' && 'hand' in note;
}

export function isChordNote(note: NoteDTO): note is ChordNoteDTO {
    const obj = note as unknown as Record<string, unknown>;
    return 'midi' in note && Array.isArray(obj['midi']);
}

export function isRestNote(note: NoteDTO): note is RestNoteDTO {
    return !('midi' in note) && 'duration' in note;
}

/**
 * Convert MIDI number to note name (e.g., 60 -> "C4")
 */
export function midiToNoteName(midi: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const noteName = noteNames[midi % 12];
    return `${noteName}${octave}`;
}

/**
 * Get all MIDI numbers from a note (works for single notes and chords)
 */
export function getMidiNumbers(note: NoteDTO): number[] {
    if (isSingleNote(note)) {
        return [note.midi];
    }
    if (isChordNote(note)) {
        return note.midi;
    }
    // It's a rest
    return [];
}

/**
 * Get start_beat from any note type
 */
export function getStartBeat(note: NoteDTO): number | undefined {
    return (note as { start_beat?: number }).start_beat;
}
