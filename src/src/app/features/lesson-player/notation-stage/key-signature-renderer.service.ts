import { Injectable, inject } from '@angular/core';
import { StaffMathService, KeySignature } from './staff-math.service';

/**
 * Key Signature Renderer Service
 *
 * Handles drawing of key signatures (sharps/flats) at the beginning of staff lines.
 *
 * Key signature order:
 * - Sharps: F, C, G, D, A, E, B (Circle of Fifths)
 * - Flats:  B, E, A, D, G, C, F (Circle of Fourths)
 */
@Injectable({
    providedIn: 'root'
})
export class KeySignatureRendererService {
    private staffMath = inject(StaffMathService);

    // Sharp symbol positions on treble staff (relative to middle line B4)
    // Units: stepSpacing (= lineSpacing / 2), so 2 units = 1 line
    // Positive = UP (toward top), Negative = DOWN (toward bottom)
    // Order: F#, C#, G#, D#, A#, E#, B#
    private readonly TREBLE_SHARP_POSITIONS = [
        4,    // F# on top line (F5) - 2 lines above middle
        1,    // C# on 3rd space (C5) - half line above middle
        -2,   // G# on 2nd line (G4) - 1 line below middle
        2,    // D# on 4th line (D5) - 1 line above middle
        -1,   // A# on 2nd space (A4) - half line below middle
        3,    // E# on 4th space (E5) - 1.5 lines above middle
        0     // B# on middle line (B4) - on middle line
    ];

    // Flat symbol positions on treble staff (relative to middle line B4)
    // Units: stepSpacing (= lineSpacing / 2), so 2 units = 1 line
    // Positive = UP (toward top), Negative = DOWN (toward bottom)
    // Order: Bb, Eb, Ab, Db, Gb, Cb, Fb
    private readonly TREBLE_FLAT_POSITIONS = [
        0,    // Bb on middle line (B4) - on middle line
        3,    // Eb on 4th space (E5) - 1.5 lines above middle
        -1,   // Ab on 2nd space (A4) - half line below middle
        2,    // Db on 4th line (D5) - 1 line above middle
        -2,   // Gb on 2nd line (G4) - 1 line below middle
        1,    // Cb on 3rd space (C5) - half line above middle
        -3    // Fb on 1st space (F4) - 1.5 lines below middle
    ];

    // Bass staff is offset by +2 positions (one line down) from treble
    private readonly BASS_OFFSET = 2;

    // Spacing between accidentals
    private readonly ACCIDENTAL_SPACING = 12;

    /**
     * Draw key signature at the start of a staff
     *
     * @param ctx Canvas 2D context
     * @param startX X position to start drawing
     * @param keySignature Key signature data
     * @param height Total canvas height
     * @param color Text color
     * @param fontSize Font size for symbols
     * @returns Width consumed by key signature (for positioning subsequent elements)
     */
    drawKeySignature(
        ctx: CanvasRenderingContext2D,
        startX: number,
        keySignature: KeySignature,
        height: number,
        color: string = 'rgba(255, 255, 255, 0.9)',
        fontSize: number = 18
    ): number {
        const accidentals = keySignature.accidentals;
        if (accidentals === 0) return 0;

        const layout = this.staffMath.calculateLayout(height);
        const stepSpacing = layout.stepSpacing;

        // Setup text rendering
        ctx.save();
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;

        const isSharp = accidentals > 0;
        const count = Math.abs(accidentals);
        const symbol = isSharp ? '♯' : '♭';
        const positions = isSharp ? this.TREBLE_SHARP_POSITIONS : this.TREBLE_FLAT_POSITIONS;

        // Flat adjustment: the belly is at the bottom of the glyph, so shift UP slightly
        // to make the belly touch the line/space (negative Y = up in canvas coords)
        const flatAdjustment = isSharp ? 0 : -fontSize * 0.1;

        // Calculate middle line Y positions
        const trebleMiddle = layout.trebleTop + layout.lineSpacing * 2;
        const bassMiddle = layout.bassTop + layout.lineSpacing * 2;

        // Draw on treble staff
        for (let i = 0; i < count && i < positions.length; i++) {
            const x = startX + i * this.ACCIDENTAL_SPACING;
            const yOffset = positions[i] * stepSpacing;
            const y = trebleMiddle - yOffset + flatAdjustment;
            ctx.fillText(symbol, x, y);
        }

        // Draw on bass staff (with offset)
        for (let i = 0; i < count && i < positions.length; i++) {
            const x = startX + i * this.ACCIDENTAL_SPACING;
            const yOffset = (positions[i] + this.BASS_OFFSET) * stepSpacing;
            const y = bassMiddle - yOffset + flatAdjustment;
            ctx.fillText(symbol, x, y);
        }

        ctx.restore();

        // Return width consumed
        return Math.min(count, positions.length) * this.ACCIDENTAL_SPACING;
    }

    /**
     * Draw key signature on a single staff (treble or bass)
     */
    drawKeySignatureOnStaff(
        ctx: CanvasRenderingContext2D,
        startX: number,
        keySignature: KeySignature,
        clef: 'treble' | 'bass',
        staffTopY: number,
        lineSpacing: number,
        color: string = 'rgba(255, 255, 255, 0.9)',
        fontSize: number = 18
    ): number {
        const accidentals = keySignature.accidentals;
        if (accidentals === 0) return 0;

        const stepSpacing = lineSpacing / 2;

        ctx.save();
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;

        const isSharp = accidentals > 0;
        const count = Math.abs(accidentals);
        const symbol = isSharp ? '♯' : '♭';
        const basePositions = isSharp ? this.TREBLE_SHARP_POSITIONS : this.TREBLE_FLAT_POSITIONS;

        // Flat adjustment: the belly is at the bottom of the glyph, so shift UP slightly
        const flatAdjustment = isSharp ? 0 : -fontSize * 0.1;

        // Apply bass offset if needed
        const positions = clef === 'bass'
            ? basePositions.map(p => p + this.BASS_OFFSET)
            : basePositions;

        const staffMiddle = staffTopY + lineSpacing * 2;

        for (let i = 0; i < count && i < positions.length; i++) {
            const x = startX + i * this.ACCIDENTAL_SPACING;
            const yOffset = positions[i] * stepSpacing;
            const y = staffMiddle - yOffset + flatAdjustment;
            ctx.fillText(symbol, x, y);
        }

        ctx.restore();

        return Math.min(count, positions.length) * this.ACCIDENTAL_SPACING;
    }

    /**
     * Get the width that will be consumed by a key signature
     */
    getKeySignatureWidth(keySignature: KeySignature | null): number {
        if (!keySignature || keySignature.accidentals === 0) return 0;
        const count = Math.abs(keySignature.accidentals);
        return Math.min(count, 7) * this.ACCIDENTAL_SPACING;
    }

    /**
     * Get the number of accidentals in a key signature
     */
    getAccidentalCount(keySignature: KeySignature | null): number {
        if (!keySignature) return 0;
        return Math.abs(keySignature.accidentals);
    }

    /**
     * Check if key signature has sharps
     */
    hasShareps(keySignature: KeySignature | null): boolean {
        return keySignature !== null && keySignature.accidentals > 0;
    }

    /**
     * Check if key signature has flats
     */
    hasFlats(keySignature: KeySignature | null): boolean {
        return keySignature !== null && keySignature.accidentals < 0;
    }

    /**
     * Get key name from accidental count (for display purposes)
     */
    getKeyName(accidentals: number): string {
        const sharpKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
        const flatKeys = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];

        if (accidentals >= 0 && accidentals < sharpKeys.length) {
            return sharpKeys[accidentals] + ' Major';
        } else if (accidentals < 0 && -accidentals < flatKeys.length) {
            return flatKeys[-accidentals] + ' Major';
        }
        return 'Unknown';
    }
}
