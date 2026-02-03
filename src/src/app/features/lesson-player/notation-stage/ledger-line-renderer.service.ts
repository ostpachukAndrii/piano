import { Injectable, inject } from '@angular/core';
import { StaffMathService, StaffLayout } from './staff-math.service';

/**
 * Ledger Line Renderer Service
 *
 * Handles drawing of ledger lines for notes above or below the staff.
 * Ledger lines are short horizontal lines that extend the staff for notes outside it.
 *
 * Design: Stateless service with pure rendering methods.
 * Depends on StaffMathService for coordinate calculations.
 */
@Injectable({
    providedIn: 'root'
})
export class LedgerLineRendererService {
    private staffMath = inject(StaffMathService);

    // Standard ledger line width: ~1.8x notehead width for clear visibility
    // Notehead width is ~20px (radius 10), so 36px gives 8px overhang on each side
    private readonly LEDGER_LINE_WIDTH = 36;

    /**
     * Draw ledger lines for a note at given position
     *
     * @param ctx Canvas 2D context
     * @param x X coordinate of note center
     * @param midiNote MIDI note number
     * @param hand 'left' or 'right' to determine staff
     * @param height Total canvas height
     * @param color Line color (default: semi-transparent white)
     * @param lineWidth Stroke width (default: 1.5)
     */
    drawLedgerLines(
        ctx: CanvasRenderingContext2D,
        x: number,
        midiNote: number,
        hand: 'left' | 'right',
        height: number,
        color: string = 'rgba(255, 255, 255, 0.7)',
        lineWidth: number = 1.5
    ): void {
        const layout = this.staffMath.calculateLayout(height);
        const noteStep = this.staffMath.midiToDiatonicStep(midiNote);

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;

        if (hand === 'right') {
            this.drawTrebleLedgerLines(ctx, x, noteStep, layout);
        } else {
            this.drawBassLedgerLines(ctx, x, noteStep, layout);
        }

        ctx.restore();
    }

    /**
     * Draw ledger lines for treble staff
     */
    private drawTrebleLedgerLines(
        ctx: CanvasRenderingContext2D,
        x: number,
        noteStep: number,
        layout: StaffLayout
    ): void {
        // Reference points for treble staff
        const e4Step = this.staffMath.midiToDiatonicStep(64); // E4 = bottom line
        const f5Step = this.staffMath.midiToDiatonicStep(77); // F5 = top line
        const halfWidth = this.LEDGER_LINE_WIDTH / 2;

        // Ledger lines below staff (for notes at D4 and below)
        // Lines appear at C4, A3, F3, etc. (every 2 steps below E4)
        if (noteStep < e4Step) {
            for (let step = e4Step - 2; step >= noteStep; step -= 2) {
                const y = layout.trebleBottomLine + ((e4Step - step) * layout.stepSpacing);
                this.drawLine(ctx, x - halfWidth, y, x + halfWidth, y);
            }
        }

        // Ledger lines above staff (for notes at G5 and above)
        if (noteStep > f5Step) {
            for (let step = f5Step + 2; step <= noteStep; step += 2) {
                const y = layout.trebleTop - ((step - f5Step) * layout.stepSpacing);
                this.drawLine(ctx, x - halfWidth, y, x + halfWidth, y);
            }
        }
    }

    /**
     * Draw ledger lines for bass staff
     */
    private drawBassLedgerLines(
        ctx: CanvasRenderingContext2D,
        x: number,
        noteStep: number,
        layout: StaffLayout
    ): void {
        // Reference points for bass staff
        const g2Step = this.staffMath.midiToDiatonicStep(43); // G2 = bottom line
        const a3Step = this.staffMath.midiToDiatonicStep(57); // A3 = top line
        const halfWidth = this.LEDGER_LINE_WIDTH / 2;

        // Ledger lines below staff (for notes at F2 and below)
        if (noteStep < g2Step) {
            for (let step = g2Step - 2; step >= noteStep; step -= 2) {
                const y = layout.bassBottomLine + ((g2Step - step) * layout.stepSpacing);
                this.drawLine(ctx, x - halfWidth, y, x + halfWidth, y);
            }
        }

        // Ledger lines above staff (for notes at B3 and above, including middle C)
        if (noteStep > a3Step) {
            for (let step = a3Step + 2; step <= noteStep; step += 2) {
                const y = layout.bassTop - ((step - a3Step) * layout.stepSpacing);
                this.drawLine(ctx, x - halfWidth, y, x + halfWidth, y);
            }
        }
    }

    /**
     * Draw ledger lines based on Y position (for wrong note indicators)
     *
     * @param ctx Canvas 2D context
     * @param x X coordinate
     * @param y Y coordinate of the note
     * @param hand 'left' or 'right'
     * @param height Total canvas height
     * @param color Line color
     * @param alpha Transparency (0-1)
     */
    drawLedgerLinesForPosition(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        hand: 'left' | 'right',
        height: number,
        color: string = 'rgb(239, 68, 68)',
        alpha: number = 0.7
    ): void {
        const layout = this.staffMath.calculateLayout(height);
        const ledgerWidth = layout.lineSpacing * 1.5;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1.5;

        if (hand === 'right') {
            const trebleBottom = layout.trebleTop + layout.staffHeight;

            // Ledger lines above treble staff
            if (y < layout.trebleTop) {
                for (let ly = layout.trebleTop - layout.lineSpacing; ly >= y - layout.lineSpacing / 2; ly -= layout.lineSpacing) {
                    this.drawLine(ctx, x - ledgerWidth, ly, x + ledgerWidth, ly);
                }
            }

            // Ledger lines below treble staff (middle C area)
            if (y > trebleBottom) {
                for (let ly = trebleBottom + layout.lineSpacing; ly <= y + layout.lineSpacing / 2; ly += layout.lineSpacing) {
                    this.drawLine(ctx, x - ledgerWidth, ly, x + ledgerWidth, ly);
                }
            }
        } else {
            const bassBottom = layout.bassTop + layout.staffHeight;

            // Ledger lines above bass staff (middle C area)
            if (y < layout.bassTop) {
                for (let ly = layout.bassTop - layout.lineSpacing; ly >= y - layout.lineSpacing / 2; ly -= layout.lineSpacing) {
                    this.drawLine(ctx, x - ledgerWidth, ly, x + ledgerWidth, ly);
                }
            }

            // Ledger lines below bass staff
            if (y > bassBottom) {
                for (let ly = bassBottom + layout.lineSpacing; ly <= y + layout.lineSpacing / 2; ly += layout.lineSpacing) {
                    this.drawLine(ctx, x - ledgerWidth, ly, x + ledgerWidth, ly);
                }
            }
        }

        ctx.restore();
    }

    /**
     * Get the number of ledger lines needed for a MIDI note
     */
    getLedgerLineCount(midiNote: number, hand: 'left' | 'right'): { above: number; below: number } {
        const noteStep = this.staffMath.midiToDiatonicStep(midiNote);
        let above = 0;
        let below = 0;

        if (hand === 'right') {
            const e4Step = this.staffMath.midiToDiatonicStep(64);
            const f5Step = this.staffMath.midiToDiatonicStep(77);

            if (noteStep < e4Step) {
                below = Math.ceil((e4Step - noteStep) / 2);
            }
            if (noteStep > f5Step) {
                above = Math.ceil((noteStep - f5Step) / 2);
            }
        } else {
            const g2Step = this.staffMath.midiToDiatonicStep(43);
            const a3Step = this.staffMath.midiToDiatonicStep(57);

            if (noteStep < g2Step) {
                below = Math.ceil((g2Step - noteStep) / 2);
            }
            if (noteStep > a3Step) {
                above = Math.ceil((noteStep - a3Step) / 2);
            }
        }

        return { above, below };
    }

    /**
     * Check if a note needs any ledger lines
     */
    needsLedgerLines(midiNote: number, hand: 'left' | 'right'): boolean {
        const { above, below } = this.getLedgerLineCount(midiNote, hand);
        return above > 0 || below > 0;
    }

    /**
     * Helper to draw a single line
     */
    private drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}
