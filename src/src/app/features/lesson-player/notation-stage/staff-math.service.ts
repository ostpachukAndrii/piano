import { Injectable } from '@angular/core';

/**
 * Key signature with sharps/flats information
 */
export interface KeySignature {
    root: string;
    mode: 'major' | 'minor';
    accidentals: number; // positive = sharps, negative = flats
    sharpNotes: number[]; // MIDI % 12 values that should be displayed as sharps
    flatNotes: number[]; // MIDI % 12 values that should be displayed as flats
}

/**
 * Staff layout configuration
 */
export interface StaffLayout {
    staffHeight: number;
    lineSpacing: number;
    stepSpacing: number; // Half of lineSpacing
    trebleTop: number;
    trebleBottomLine: number;
    bassTop: number;
    bassBottomLine: number;
}

/**
 * Shared service for staff coordinate calculations
 * Ensures consistent note positioning between classic and scrolling views
 *
 * IMPORTANT: This service uses the "hand" property to determine staff placement:
 * - right hand = treble staff (top)
 * - left hand = bass staff (bottom)
 */
@Injectable({
    providedIn: 'root'
})
export class StaffMathService {
    // Layout constants - shared between scrolling and classic views
    // Compact spacing so notes fit staff lines better
    static readonly STAFF_HEIGHT_RATIO = 0.22;  // Was 0.35 - more compact
    static readonly TREBLE_TOP_RATIO = 0.1;
    static readonly BASS_TOP_RATIO = 0.45;      // Was 0.55 - adjusted for smaller staff

    /**
     * Calculate staff layout dimensions based on total height
     */
    calculateLayout(height: number): StaffLayout {
        const staffHeight = height * StaffMathService.STAFF_HEIGHT_RATIO;
        const lineSpacing = staffHeight / 5;
        const stepSpacing = lineSpacing / 2;

        // Treble staff at top
        const trebleTop = height * StaffMathService.TREBLE_TOP_RATIO;
        const trebleBottomLine = trebleTop + lineSpacing * 4;

        // Bass staff below treble
        const bassTop = height * StaffMathService.BASS_TOP_RATIO;
        const bassBottomLine = bassTop + lineSpacing * 4;

        return {
            staffHeight,
            lineSpacing,
            stepSpacing,
            trebleTop,
            trebleBottomLine,
            bassTop,
            bassBottomLine
        };
    }

    /**
     * Convert MIDI note to diatonic step (C=0, D=1, E=2, F=3, G=4, A=5, B=6)
     * Returns total diatonic steps from C0
     *
     * For black keys: uses key signature to determine sharp vs flat positioning
     */
    midiToDiatonicStep(midi: number, keySignature?: KeySignature | null): number {
        const octave = Math.floor(midi / 12) - 1; // MIDI 60 = C4, so octave 4
        const noteInOctave = midi % 12;

        // Check if this is a black key
        const blackKeys = [1, 3, 6, 8, 10]; // C#/Db, D#/Eb, F#/Gb, G#/Ab, A#/Bb
        const isBlackKey = blackKeys.includes(noteInOctave);

        let diatonicInOctave: number;

        if (!isBlackKey) {
            // White keys: straightforward mapping
            const whiteToDiatonic = [0, -1, 1, -1, 2, 3, -1, 4, -1, 5, -1, 6];
            diatonicInOctave = whiteToDiatonic[noteInOctave];
        } else {
            // Black keys: depends on whether we treat as sharp or flat
            // If key signature has flats (or we're in a flat key), use flat positioning
            const useFlat = keySignature && (
                keySignature.flatNotes.includes(noteInOctave) ||
                keySignature.accidentals < 0
            );

            if (useFlat) {
                // Flat: position on the UPPER letter (Db on D, Eb on E, etc.)
                const blackToFlatDiatonic: Record<number, number> = {
                    1: 1,   // Db → D
                    3: 2,   // Eb → E
                    6: 4,   // Gb → G
                    8: 5,   // Ab → A
                    10: 6   // Bb → B
                };
                diatonicInOctave = blackToFlatDiatonic[noteInOctave];
            } else {
                // Sharp: position on the LOWER letter (C# on C, D# on D, etc.)
                const blackToSharpDiatonic: Record<number, number> = {
                    1: 0,   // C# → C
                    3: 1,   // D# → D
                    6: 3,   // F# → F
                    8: 4,   // G# → G
                    10: 5   // A# → A
                };
                diatonicInOctave = blackToSharpDiatonic[noteInOctave];
            }
        }

        return octave * 7 + diatonicInOctave;
    }

    /**
     * Convert MIDI note number to Y coordinate
     * Uses diatonic steps for proper staff placement
     *
     * IMPORTANT: Hand assignment takes priority over MIDI range
     * - right hand = treble staff (top)
     * - left hand = bass staff (bottom)
     *
     * @param midi MIDI note number
     * @param hand 'left' or 'right'
     * @param height Total canvas height
     * @param keySignature Optional key signature for accidental positioning
     */
    midiToY(
        midi: number,
        hand: 'left' | 'right',
        height: number,
        keySignature?: KeySignature | null
    ): number {
        const layout = this.calculateLayout(height);

        // Use hand to determine staff - this ensures proper separation of hands
        if (hand === 'right') {
            // Treble staff
            // Reference: E4 (MIDI 64) is on the bottom line (line 0)
            const referenceStep = this.midiToDiatonicStep(64, keySignature); // E4
            const noteStep = this.midiToDiatonicStep(midi, keySignature);
            const stepDiff = noteStep - referenceStep;
            return layout.trebleBottomLine - (stepDiff * layout.stepSpacing);
        } else {
            // Bass staff
            // Reference: G2 (MIDI 43) is on the bottom line (line 0)
            const referenceStep = this.midiToDiatonicStep(43, keySignature); // G2
            const noteStep = this.midiToDiatonicStep(midi, keySignature);
            const stepDiff = noteStep - referenceStep;
            return layout.bassBottomLine - (stepDiff * layout.stepSpacing);
        }
    }

    /**
     * Determine stem direction based on hand (traditional notation)
     * - Right hand: stems UP (toward top of staff)
     * - Left hand: stems DOWN (toward bottom of staff)
     */
    getStemDirection(hand: 'left' | 'right'): boolean {
        return hand === 'right'; // true = up, false = down
    }

    /**
     * Check if a note needs ledger lines above the treble staff
     */
    needsLedgerLinesAboveTreble(midi: number, hand: 'left' | 'right', height: number): boolean {
        if (hand !== 'right') return false;
        const layout = this.calculateLayout(height);
        const y = this.midiToY(midi, hand, height);
        return y < layout.trebleTop;
    }

    /**
     * Check if a note needs ledger lines below the treble staff
     */
    needsLedgerLinesBelowTreble(midi: number, hand: 'left' | 'right', height: number): boolean {
        if (hand !== 'right') return false;
        const layout = this.calculateLayout(height);
        const y = this.midiToY(midi, hand, height);
        return y > layout.trebleBottomLine;
    }

    /**
     * Check if a note needs ledger lines above the bass staff
     */
    needsLedgerLinesAboveBass(midi: number, hand: 'left' | 'right', height: number): boolean {
        if (hand !== 'left') return false;
        const layout = this.calculateLayout(height);
        const y = this.midiToY(midi, hand, height);
        return y < layout.bassTop;
    }

    /**
     * Check if a note needs ledger lines below the bass staff
     */
    needsLedgerLinesBelowBass(midi: number, hand: 'left' | 'right', height: number): boolean {
        if (hand !== 'left') return false;
        const layout = this.calculateLayout(height);
        const y = this.midiToY(midi, hand, height);
        return y > layout.bassBottomLine;
    }

    /**
     * Get the number of ledger lines needed for a note
     * Returns positive for above staff, negative for below staff
     */
    getLedgerLineCount(midi: number, hand: 'left' | 'right', height: number): number {
        const layout = this.calculateLayout(height);
        const y = this.midiToY(midi, hand, height);

        if (hand === 'right') {
            if (y < layout.trebleTop) {
                return Math.ceil((layout.trebleTop - y) / layout.lineSpacing);
            } else if (y > layout.trebleBottomLine) {
                return -Math.ceil((y - layout.trebleBottomLine) / layout.lineSpacing);
            }
        } else {
            if (y < layout.bassTop) {
                return Math.ceil((layout.bassTop - y) / layout.lineSpacing);
            } else if (y > layout.bassBottomLine) {
                return -Math.ceil((y - layout.bassBottomLine) / layout.lineSpacing);
            }
        }

        return 0;
    }

    /**
     * Convert duration beats to note type string
     */
    durationToType(duration: number): 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' {
        if (duration >= 4) return 'whole';
        if (duration >= 2) return 'half';
        if (duration >= 1) return 'quarter';
        if (duration >= 0.5) return 'eighth';
        return 'sixteenth';
    }

    /**
     * Check if a duration should be rendered as hollow notehead
     */
    isHollowNote(duration: number): boolean {
        return duration >= 2;
    }
}
