import { Injectable, inject } from '@angular/core';
import { StaffMathService } from './staff-math.service';

/**
 * Bar Line Renderer Service
 *
 * Handles drawing of bar lines (measure separators) on musical staff.
 *
 * Bar line types:
 * - single: Standard measure separator
 * - double: Used at section endings or key/time changes
 * - final: Thick + thin line at the end of a piece
 */
@Injectable({
    providedIn: 'root'
})
export class BarLineRendererService {
    private staffMath = inject(StaffMathService);

    /**
     * Draw a single bar line across a staff
     *
     * @param ctx Canvas 2D context
     * @param x X coordinate of bar line
     * @param staffTopY Y coordinate of top staff line
     * @param staffHeight Height of the staff (4 line spacings)
     * @param type Type of bar line
     * @param color Line color
     * @param lineWidth Stroke width
     */
    drawBarLine(
        ctx: CanvasRenderingContext2D,
        x: number,
        staffTopY: number,
        staffHeight: number,
        type: 'single' | 'double' | 'final' = 'single',
        color: string = 'rgba(255, 255, 255, 0.5)',
        lineWidth: number = 1
    ): void {
        const staffBottomY = staffTopY + staffHeight;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        switch (type) {
            case 'single':
                ctx.lineWidth = lineWidth;
                this.drawVerticalLine(ctx, x, staffTopY, staffBottomY);
                break;

            case 'double':
                ctx.lineWidth = lineWidth;
                this.drawVerticalLine(ctx, x - 4, staffTopY, staffBottomY);
                this.drawVerticalLine(ctx, x, staffTopY, staffBottomY);
                break;

            case 'final':
                // Thin line followed by thick line
                ctx.lineWidth = lineWidth;
                this.drawVerticalLine(ctx, x - 6, staffTopY, staffBottomY);
                // Thick bar (filled rectangle)
                ctx.fillRect(x - 2, staffTopY, 4, staffHeight);
                break;
        }

        ctx.restore();
    }

    /**
     * Draw bar lines for grand staff (treble + bass)
     *
     * @param ctx Canvas 2D context
     * @param x X coordinate
     * @param height Total canvas height
     * @param type Bar line type
     * @param color Line color
     */
    drawGrandStaffBarLine(
        ctx: CanvasRenderingContext2D,
        x: number,
        height: number,
        type: 'single' | 'double' | 'final' = 'single',
        color: string = 'rgba(255, 255, 255, 0.5)'
    ): void {
        const layout = this.staffMath.calculateLayout(height);
        const staffHeight = layout.lineSpacing * 4;

        // Treble staff bar line
        this.drawBarLine(ctx, x, layout.trebleTop, staffHeight, type, color);

        // Bass staff bar line
        this.drawBarLine(ctx, x, layout.bassTop, staffHeight, type, color);
    }

    /**
     * Draw bar lines at measure boundaries for a scrolling view
     *
     * @param ctx Canvas 2D context
     * @param height Canvas height
     * @param currentBeat Current playhead beat position
     * @param beatsPerMeasure Beats per measure (time signature numerator)
     * @param stageWidth Width of visible stage
     * @param playheadX X position of playhead
     * @param pixelsPerBeat Pixels per beat for scrolling
     * @param color Line color
     */
    drawScrollingBarLines(
        ctx: CanvasRenderingContext2D,
        height: number,
        currentBeat: number,
        beatsPerMeasure: number,
        stageWidth: number,
        playheadX: number,
        pixelsPerBeat: number,
        color: string = 'rgba(255, 255, 255, 0.5)'
    ): void {
        if (beatsPerMeasure <= 0) return;

        const layout = this.staffMath.calculateLayout(height);
        const staffHeight = layout.lineSpacing * 4;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;

        // Calculate visible beat range
        const visibleBeats = stageWidth / pixelsPerBeat;
        const startBeat = currentBeat - (playheadX / pixelsPerBeat);
        const endBeat = startBeat + visibleBeats;

        // Find first measure boundary in visible range
        const firstMeasure = Math.floor(startBeat / beatsPerMeasure);
        const lastMeasure = Math.ceil(endBeat / beatsPerMeasure);

        // Draw bar lines for each measure
        for (let measure = firstMeasure; measure <= lastMeasure; measure++) {
            const beat = measure * beatsPerMeasure;
            const x = playheadX + (beat - currentBeat) * pixelsPerBeat;

            // Skip if off screen
            if (x < -10 || x > stageWidth + 10) continue;

            // Draw treble staff bar line
            const trebleBottom = layout.trebleTop + staffHeight;
            this.drawVerticalLine(ctx, x, layout.trebleTop, trebleBottom);

            // Draw bass staff bar line
            const bassBottom = layout.bassTop + staffHeight;
            this.drawVerticalLine(ctx, x, layout.bassTop, bassBottom);
        }

        ctx.restore();
    }

    /**
     * Check if a beat position is on a bar line
     */
    isOnBarLine(beat: number, beatsPerMeasure: number): boolean {
        if (beatsPerMeasure <= 0) return false;
        const tolerance = 0.001;
        return Math.abs(beat % beatsPerMeasure) < tolerance;
    }

    /**
     * Get the measure number for a given beat
     */
    getMeasureNumber(beat: number, beatsPerMeasure: number): number {
        if (beatsPerMeasure <= 0) return 0;
        return Math.floor(beat / beatsPerMeasure);
    }

    /**
     * Get the beat position of the next bar line
     */
    getNextBarLineBeat(currentBeat: number, beatsPerMeasure: number): number {
        if (beatsPerMeasure <= 0) return currentBeat;
        const currentMeasure = Math.floor(currentBeat / beatsPerMeasure);
        return (currentMeasure + 1) * beatsPerMeasure;
    }

    /**
     * Helper to draw a vertical line
     */
    private drawVerticalLine(
        ctx: CanvasRenderingContext2D,
        x: number,
        y1: number,
        y2: number
    ): void {
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.stroke();
    }
}
