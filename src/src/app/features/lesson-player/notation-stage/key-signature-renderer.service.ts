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

    // Sharp symbol positions on treble staff (relative to middle line)
    // Order: F, C, G, D, A, E, B
    private readonly TREBLE_SHARP_POSITIONS = [
        0,    // F (top line = middle line)
        1.5,  // C (space below top)
        -0.5, // G (above top line)
        1,    // D (4th line)
        2.5,  // A (2nd space)
        0.5,  // E (top space)
        2     // B (3rd line)
    ];

    // Flat symbol positions on treble staff (relative to middle line)
    // Order: B, E, A, D, G, C, F
    private readonly TREBLE_FLAT_POSITIONS = [
        2,    // B (3rd line)
        0.5,  // E (top space)
        2.5,  // A (2nd space)
        1,    // D (4th line)
        3,    // G (2nd line)
        1.5,  // C (3rd space)
        3.5   // F (bottom space)
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

        // Calculate middle line Y positions
        const trebleMiddle = layout.trebleTop + layout.lineSpacing * 2;
        const bassMiddle = layout.bassTop + layout.lineSpacing * 2;

        // Draw on treble staff
        for (let i = 0; i < count && i < positions.length; i++) {
            const x = startX + i * this.ACCIDENTAL_SPACING;
            const yOffset = positions[i] * stepSpacing;
            const y = trebleMiddle - yOffset;
            ctx.fillText(symbol, x, y);
        }

        // Draw on bass staff (with offset)
        for (let i = 0; i < count && i < positions.length; i++) {
            const x = startX + i * this.ACCIDENTAL_SPACING;
            const yOffset = (positions[i] + this.BASS_OFFSET) * stepSpacing;
            const y = bassMiddle - yOffset;
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

        // Apply bass offset if needed
        const positions = clef === 'bass'
            ? basePositions.map(p => p + this.BASS_OFFSET)
            : basePositions;

        const staffMiddle = staffTopY + lineSpacing * 2;

        for (let i = 0; i < count && i < positions.length; i++) {
            const x = startX + i * this.ACCIDENTAL_SPACING;
            const yOffset = positions[i] * stepSpacing;
            const y = staffMiddle - yOffset;
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
