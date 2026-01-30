import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    OnChanges,
    SimpleChanges,
    ViewChild,
} from '@angular/core';

/**
 * Music Staff Component
 * Renders a single staff line (treble or bass) with notes using Canvas API
 * Single-line only - GrandStaffComponent handles multi-line pairing
 *
 * Y-Axis Inversion: Higher pitch = Lower Y value on screen
 */
@Component({
    selector: 'app-staff',
    standalone: true,
    imports: [CommonModule],
    template: `
        <canvas
            #staffCanvas
            [width]="width"
            [height]="height"
            class="staff-canvas"
        >
        </canvas>
    `,
    styles: [
        `
            .staff-canvas {
                background: transparent;
                display: block;
            }
        `,
    ],
})
export class StaffComponent implements AfterViewInit, OnChanges {
    @ViewChild('staffCanvas') canvas!: ElementRef<HTMLCanvasElement>;

    @Input() width = 900;
    @Input() height = 80;
    @Input() notes: StaffNote[] = [];
    @Input() activeNotes: number[] = [];
    @Input() clef: 'treble' | 'bass' = 'treble';
    @Input() currentNoteIndex = -1;
    @Input() playheadPosition = -1;
    @Input() playheadBeatPosition = -1; // Smooth playhead position in beats (-1 = hidden)
    @Input() highlightNoteIndex = -1; // Only highlight notes at this global index
    @Input() isPlaying = false;
    @Input() globalNoteOffset = 0;
    @Input() isLastLine = false;
    @Input() globalBeatOffset = 0; // Beat offset for this staff line (for multi-line)

    private ctx!: CanvasRenderingContext2D;

    // Layout constants
    private readonly LINE_SPACING = 12;
    private readonly TOP_MARGIN = 15;
    private readonly LEFT_MARGIN = 70;
    private readonly RIGHT_MARGIN = 30;
    private readonly NOTE_HEAD_RX = 7;
    private readonly NOTE_HEAD_RY = 5;
    private readonly STEM_HEIGHT = 35;
    private readonly BAR_LINE_SPACE = 15;

    ngAfterViewInit() {
        const canvas = this.canvas.nativeElement;
        this.ctx = canvas.getContext('2d')!;
        this.render();
    }

    ngOnChanges(_changes: SimpleChanges) {
        if (this.ctx) {
            this.render();
        }
    }

    private render() {
        if (!this.ctx) return;

        this.clearCanvas();
        this.drawStaffLines();
        this.drawClef();
        this.drawNotes();
        this.drawSmoothPlayhead();
    }

    private clearCanvas() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    private drawStaffLines() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;

        for (let i = 0; i < 5; i++) {
            const y = this.TOP_MARGIN + i * this.LINE_SPACING;
            this.ctx.beginPath();
            this.ctx.moveTo(20, y);
            this.ctx.lineTo(this.width - 20, y);
            this.ctx.stroke();
        }
    }

    private getLineY(lineIndex: number): number {
        return this.TOP_MARGIN + lineIndex * this.LINE_SPACING;
    }

    private getStaffMiddleY(): number {
        return this.getLineY(2);
    }

    private getStaffBottomY(): number {
        return this.getLineY(4);
    }

    private drawClef() {
        this.ctx.font = '48px Bravura, serif';
        this.ctx.fillStyle = '#000';

        if (this.clef === 'treble') {
            this.ctx.fillText('𝄞', 25, this.getLineY(4) + 8);
        } else {
            this.ctx.fillText('𝄢', 25, this.getLineY(2) + 5);
        }
    }

    /**
     * Convert duration string to numeric beats value
     */
    private durationToBeats(duration: string): number {
        switch (duration) {
            case 'whole': return 4;
            case 'half': return 2;
            case 'quarter': return 1;
            case 'eighth': return 0.5;
            case 'sixteenth': return 0.25;
            default: return 1;
        }
    }

    /**
     * Calculate note positions with equal measure widths and proportional note spacing within measures
     * Returns array of x positions for each note
     */
    private calculateNotePositions(): number[] {
        if (this.notes.length === 0) return [];

        // First: identify measures and their note ranges
        interface MeasureInfo {
            startIdx: number;
            endIdx: number;
            totalDuration: number;
        }

        const measures: MeasureInfo[] = [];
        let measureStart = 0;

        for (let i = 0; i < this.notes.length; i++) {
            if (this.notes[i].measureEnd || i === this.notes.length - 1) {
                // Calculate total duration for this measure
                let totalDuration = 0;
                for (let j = measureStart; j <= i; j++) {
                    const note = this.notes[j];
                    const duration = note.durationValue ?? this.durationToBeats(note.duration);
                    totalDuration += duration;
                }

                measures.push({
                    startIdx: measureStart,
                    endIdx: i,
                    totalDuration
                });
                measureStart = i + 1;
            }
        }

        // Calculate available width and width per measure
        const availableWidth = this.width - this.LEFT_MARGIN - this.RIGHT_MARGIN;
        const barLineCount = measures.length - 1; // Bar lines between measures
        const totalBarLineSpace = barLineCount * this.BAR_LINE_SPACE;
        const widthForMeasures = availableWidth - totalBarLineSpace;
        const measureWidth = widthForMeasures / measures.length;

        // Calculate positions: equal measure widths, proportional spacing within each measure
        const positions: number[] = new Array(this.notes.length);
        let measureStartX = this.LEFT_MARGIN;

        for (const measure of measures) {
            const noteCount = measure.endIdx - measure.startIdx + 1;

            if (noteCount === 1) {
                // Single note in measure - center it
                positions[measure.startIdx] = measureStartX + measureWidth * 0.1;
            } else {
                // Multiple notes - distribute proportionally based on duration
                // Leave some padding at start and end of measure
                const padding = measureWidth * 0.05;
                const usableWidth = measureWidth - padding * 2;

                // Calculate cumulative duration positions
                let cumulativeDuration = 0;
                for (let i = measure.startIdx; i <= measure.endIdx; i++) {
                    const note = this.notes[i];
                    const duration = note.durationValue ?? this.durationToBeats(note.duration);

                    // Position based on when in the measure this note starts
                    const positionRatio = cumulativeDuration / measure.totalDuration;
                    positions[i] = measureStartX + padding + (usableWidth * positionRatio);

                    cumulativeDuration += duration;
                }
            }

            // Move to next measure
            measureStartX += measureWidth + this.BAR_LINE_SPACE;
        }

        return positions;
    }

    private drawNotes() {
        if (this.notes.length === 0) return;

        const positions = this.calculateNotePositions();

        // Calculate measure width for bar line positioning
        const measureCount = this.notes.filter(n => n.measureEnd).length + (this.notes[this.notes.length - 1]?.measureEnd ? 0 : 1);
        const availableWidth = this.width - this.LEFT_MARGIN - this.RIGHT_MARGIN;
        const barLineCount = Math.max(0, measureCount - 1);
        const totalBarLineSpace = barLineCount * this.BAR_LINE_SPACE;
        const measureWidth = (availableWidth - totalBarLineSpace) / measureCount;

        let measureIndex = 0;

        this.notes.forEach((note, localIndex) => {
            const globalIndex = this.globalNoteOffset + localIndex;
            const x = positions[localIndex];

            // Draw the note (unless hidden - hidden notes still reserve space)
            if (!note.hidden) {
                if (note.isRest) {
                    this.drawRest(x, note.duration);
                } else {
                    const midiValues = Array.isArray(note.midi) ? note.midi : [note.midi];
                    for (const midi of midiValues) {
                        const y = this.midiToY(midi);
                        // Only highlight if this is the current note position AND the midi is being played
                        const isActive = globalIndex === this.highlightNoteIndex && this.activeNotes.includes(midi);
                        this.drawLedgerLines(x, midi);
                        this.drawNote(x, y, note.duration, isActive);
                    }
                }

                // Draw current note cursor (only for visible notes)
                if (globalIndex === this.currentNoteIndex && !this.isPlaying) {
                    this.drawCurrentNoteCursor(x);
                }

                // Draw playhead (only for visible notes)
                if (globalIndex === this.playheadPosition) {
                    this.drawPlayhead(x);
                }
            }

            // Draw bar line after measure end (except for last note)
            if (note.measureEnd && localIndex < this.notes.length - 1) {
                // Bar line at fixed position based on equal measure widths
                const barLineX = this.LEFT_MARGIN + (measureIndex + 1) * measureWidth + measureIndex * this.BAR_LINE_SPACE + this.BAR_LINE_SPACE / 2;
                this.drawBarLine(barLineX);
                measureIndex++;
            }
        });

        // Draw end bar line for the last line
        if (this.isLastLine && this.notes.length > 0) {
            this.drawEndBarLine(this.width - this.RIGHT_MARGIN);
        }
    }

    private drawBarLine(x: number): void {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1.5;

        const topY = this.getLineY(0);
        const bottomY = this.getLineY(4);

        this.ctx.beginPath();
        this.ctx.moveTo(x, topY);
        this.ctx.lineTo(x, bottomY);
        this.ctx.stroke();
    }

    private drawEndBarLine(x: number): void {
        const topY = this.getLineY(0);
        const bottomY = this.getLineY(4);

        // Thin line
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(x - 6, topY);
        this.ctx.lineTo(x - 6, bottomY);
        this.ctx.stroke();

        // Thick line
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(x, topY);
        this.ctx.lineTo(x, bottomY);
        this.ctx.stroke();
    }

    private drawNote(x: number, y: number, duration: string, active: boolean) {
        const isHollow = duration === 'whole' || duration === 'half';

        this.ctx.save();

        if (active) {
            this.ctx.shadowColor = '#2196F3';
            this.ctx.shadowBlur = 15;
        }

        // Note head
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, this.NOTE_HEAD_RX, this.NOTE_HEAD_RY, (-20 * Math.PI) / 180, 0, 2 * Math.PI);

        if (active) {
            // Active notes: filled with blue
            this.ctx.fillStyle = '#2196F3';
            this.ctx.fill();
            this.ctx.strokeStyle = '#2196F3';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        } else if (isHollow) {
            // Hollow notes (whole, half): clear interior and draw thick outline
            // First clear the area to make it truly hollow
            this.ctx.fillStyle = '#fafafa'; // Match background
            this.ctx.fill();
            // Draw thick black outline
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2.5;
            this.ctx.stroke();
        } else {
            // Filled notes (quarter, eighth, sixteenth): solid black
            this.ctx.fillStyle = '#000';
            this.ctx.fill();
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
        }

        // Stem
        if (duration !== 'whole') {
            const stemUp = y > this.getStaffMiddleY();
            const stemX = x + (stemUp ? this.NOTE_HEAD_RX : -this.NOTE_HEAD_RX);
            const stemEndY = stemUp ? y - this.STEM_HEIGHT : y + this.STEM_HEIGHT;

            this.ctx.beginPath();
            this.ctx.moveTo(stemX, y);
            this.ctx.lineTo(stemX, stemEndY);
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();

            if (duration === 'eighth') {
                this.drawFlag(stemX, stemEndY, stemUp, 1);
            } else if (duration === 'sixteenth') {
                this.drawFlag(stemX, stemEndY, stemUp, 2);
            }
        }

        this.ctx.restore();
    }

    private drawFlag(x: number, y: number, stemUp: boolean, flagCount: number = 1) {
        const flagSpacing = 8; // Space between flags for 16th notes

        for (let i = 0; i < flagCount; i++) {
            const flagY = stemUp ? y + (i * flagSpacing) : y - (i * flagSpacing);

            this.ctx.beginPath();
            if (stemUp) {
                this.ctx.moveTo(x, flagY);
                this.ctx.quadraticCurveTo(x + 12, flagY + 10, x + 8, flagY + 20);
            } else {
                this.ctx.moveTo(x, flagY);
                this.ctx.quadraticCurveTo(x + 12, flagY - 10, x + 8, flagY - 20);
            }
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    private drawLedgerLines(x: number, midi: number) {
        const y = this.midiToY(midi);
        const topLine = this.getLineY(0);
        const bottomLine = this.getLineY(4);

        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;

        // Above staff
        if (y < topLine) {
            let ledgerY = topLine - this.LINE_SPACING;
            while (ledgerY >= y - this.LINE_SPACING / 2) {
                this.ctx.beginPath();
                this.ctx.moveTo(x - 12, ledgerY);
                this.ctx.lineTo(x + 12, ledgerY);
                this.ctx.stroke();
                ledgerY -= this.LINE_SPACING;
            }
        }

        // Below staff
        if (y > bottomLine) {
            let ledgerY = bottomLine + this.LINE_SPACING;
            while (ledgerY <= y + this.LINE_SPACING / 2) {
                this.ctx.beginPath();
                this.ctx.moveTo(x - 12, ledgerY);
                this.ctx.lineTo(x + 12, ledgerY);
                this.ctx.stroke();
                ledgerY += this.LINE_SPACING;
            }
        }
    }

    private drawRest(x: number, duration: string) {
        this.ctx.save();
        this.ctx.fillStyle = '#000';
        this.ctx.strokeStyle = '#000';

        switch (duration) {
            case 'whole':
                // Whole rest: filled rectangle hanging DOWN from line 1 (4th line from bottom)
                // It hangs below the line
                this.ctx.fillRect(x - 8, this.getLineY(1), 16, 8);
                break;

            case 'half':
                // Half rest: filled rectangle sitting ON TOP of line 2 (3rd line from bottom)
                // It sits above the line
                this.ctx.fillRect(x - 8, this.getLineY(2) - 8, 16, 8);
                break;

            case 'quarter':
                // Quarter rest: zigzag/squiggle shape drawn with paths
                this.drawQuarterRest(x, this.getStaffMiddleY());
                break;

            case 'eighth':
                // Eighth rest: slanted line with a single flag
                this.drawEighthRest(x, this.getStaffMiddleY());
                break;

            case 'sixteenth':
                // Sixteenth rest: slanted line with two flags
                this.drawSixteenthRest(x, this.getStaffMiddleY());
                break;

            default:
                // Default to quarter rest
                this.drawQuarterRest(x, this.getStaffMiddleY());
        }

        this.ctx.restore();
    }

    /**
     * Draw a quarter rest (zigzag squiggle shape)
     */
    private drawQuarterRest(x: number, centerY: number) {
        this.ctx.lineWidth = 2.5;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Quarter rest is a stylized zigzag
        // Starting from top, going down in a zigzag pattern
        const top = centerY - 15;
        const bottom = centerY + 15;

        this.ctx.beginPath();
        // Top hook
        this.ctx.moveTo(x + 4, top);
        this.ctx.lineTo(x - 2, top + 8);
        // First diagonal down-right
        this.ctx.lineTo(x + 5, top + 14);
        // Second diagonal down-left
        this.ctx.lineTo(x - 3, top + 22);
        // Third diagonal down-right to bottom
        this.ctx.lineTo(x + 3, bottom - 2);
        // Bottom curve/hook
        this.ctx.quadraticCurveTo(x + 6, bottom + 4, x + 2, bottom + 6);

        this.ctx.stroke();

        // Add small filled circle at bottom hook
        this.ctx.beginPath();
        this.ctx.arc(x + 1, bottom + 3, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Draw an eighth rest (slanted line with one flag)
     */
    private drawEighthRest(x: number, centerY: number) {
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';

        const top = centerY - 8;
        const bottom = centerY + 10;

        // Main slanted line
        this.ctx.beginPath();
        this.ctx.moveTo(x + 4, top);
        this.ctx.lineTo(x - 4, bottom);
        this.ctx.stroke();

        // Flag/dot at top
        this.ctx.beginPath();
        this.ctx.arc(x + 6, top - 2, 3.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Curved hook connecting dot to line
        this.ctx.beginPath();
        this.ctx.moveTo(x + 4, top - 1);
        this.ctx.quadraticCurveTo(x + 2, top + 4, x + 1, top + 6);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    /**
     * Draw a sixteenth rest (slanted line with two flags)
     */
    private drawSixteenthRest(x: number, centerY: number) {
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';

        const top = centerY - 12;
        const bottom = centerY + 12;

        // Main slanted line (longer for 16th)
        this.ctx.beginPath();
        this.ctx.moveTo(x + 4, top);
        this.ctx.lineTo(x - 6, bottom);
        this.ctx.stroke();

        // First flag/dot at top
        this.ctx.beginPath();
        this.ctx.arc(x + 6, top - 2, 3.5, 0, Math.PI * 2);
        this.ctx.fill();

        // First curved hook
        this.ctx.beginPath();
        this.ctx.moveTo(x + 4, top - 1);
        this.ctx.quadraticCurveTo(x + 2, top + 4, x + 1, top + 6);
        this.ctx.stroke();

        // Second flag/dot (lower)
        this.ctx.beginPath();
        this.ctx.arc(x + 3, top + 8, 3.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Second curved hook
        this.ctx.beginPath();
        this.ctx.moveTo(x + 1, top + 9);
        this.ctx.quadraticCurveTo(x - 1, top + 14, x - 2, top + 16);
        this.ctx.stroke();
    }

    private midiToY(midi: number): number {
        const referenceNote = this.clef === 'treble' ? 64 : 43;
        const steps = this.semitonesToSteps(midi) - this.semitonesToSteps(referenceNote);
        const halfSpacing = this.LINE_SPACING / 2;
        return this.getStaffBottomY() - steps * halfSpacing;
    }

    private semitonesToSteps(midi: number): number {
        const octave = Math.floor(midi / 12);
        const noteInOctave = midi % 12;
        const stepMap = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
        return octave * 7 + stepMap[noteInOctave];
    }

    private drawCurrentNoteCursor(x: number): void {
        this.ctx.save();

        const pulse = 0.8 + 0.2 * Math.sin(Date.now() / 300);
        this.ctx.strokeStyle = `rgba(255, 152, 0, ${pulse})`;
        this.ctx.lineWidth = 3;

        const cursorWidth = 30;
        const cursorHeight = 70;
        const cursorX = x - cursorWidth / 2;
        const cursorY = this.getLineY(0) - 10;

        this.ctx.beginPath();
        this.ctx.roundRect(cursorX, cursorY, cursorWidth, cursorHeight, 8);
        this.ctx.stroke();
        this.ctx.fillStyle = `rgba(255, 152, 0, ${pulse * 0.1})`;
        this.ctx.fill();

        this.ctx.restore();
    }

    private drawPlayhead(x: number): void {
        this.ctx.save();

        const topY = this.getLineY(0) - 15;
        const bottomY = this.getLineY(4) + 15;

        // Main line
        this.ctx.strokeStyle = '#E91E63';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x, topY);
        this.ctx.lineTo(x, bottomY);
        this.ctx.stroke();

        // Triangle
        this.ctx.fillStyle = '#E91E63';
        this.ctx.beginPath();
        this.ctx.moveTo(x - 8, topY - 10);
        this.ctx.lineTo(x + 8, topY - 10);
        this.ctx.lineTo(x, topY);
        this.ctx.closePath();
        this.ctx.fill();

        // Glow
        this.ctx.shadowColor = '#E91E63';
        this.ctx.shadowBlur = 10;
        this.ctx.strokeStyle = 'rgba(233, 30, 99, 0.5)';
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();
        this.ctx.moveTo(x, topY);
        this.ctx.lineTo(x, bottomY);
        this.ctx.stroke();

        this.ctx.restore();
    }

    /**
     * Draw smooth playhead based on beat position
     * This allows the playhead to move smoothly between notes
     */
    private drawSmoothPlayhead(): void {
        if (this.playheadBeatPosition < 0 || this.notes.length === 0) return;

        // Calculate total beats on this staff line
        let totalBeats = 0;
        const noteBeatPositions: { startBeat: number; endBeat: number; noteIndex: number }[] = [];

        for (let i = 0; i < this.notes.length; i++) {
            const note = this.notes[i];
            const duration = note.durationValue ?? this.durationToBeats(note.duration);
            noteBeatPositions.push({
                startBeat: totalBeats,
                endBeat: totalBeats + duration,
                noteIndex: i
            });
            totalBeats += duration;
        }

        // Adjust playhead position relative to this staff line's beat offset
        const localBeatPosition = this.playheadBeatPosition - this.globalBeatOffset;

        // Check if playhead is within this staff line's range
        if (localBeatPosition < 0 || localBeatPosition > totalBeats) return;

        // Calculate X position based on beat position
        const x = this.calculateXFromBeatPosition(localBeatPosition, noteBeatPositions);
        if (x < 0) return;

        // Draw the playhead at the calculated position
        this.drawPlayhead(x);
    }

    /**
     * Calculate X position from a beat position
     */
    private calculateXFromBeatPosition(
        beatPosition: number,
        noteBeatPositions: { startBeat: number; endBeat: number; noteIndex: number }[]
    ): number {
        if (noteBeatPositions.length === 0) return -1;

        const positions = this.calculateNotePositions();

        // Find which note this beat position falls within
        for (let i = 0; i < noteBeatPositions.length; i++) {
            const { startBeat, endBeat, noteIndex } = noteBeatPositions[i];

            if (beatPosition >= startBeat && beatPosition < endBeat) {
                // Interpolate within this note's duration
                const noteProgress = (beatPosition - startBeat) / (endBeat - startBeat);
                const currentX = positions[noteIndex];

                // Get next note's X position for interpolation
                let nextX: number;
                if (noteIndex + 1 < this.notes.length) {
                    nextX = positions[noteIndex + 1];
                } else {
                    // Last note - extrapolate to end of staff
                    nextX = this.width - this.RIGHT_MARGIN;
                }

                // Interpolate between current and next note position
                return currentX + (nextX - currentX) * noteProgress;
            }
        }

        // If past all notes, return position at end
        if (beatPosition >= noteBeatPositions[noteBeatPositions.length - 1].endBeat) {
            return this.width - this.RIGHT_MARGIN;
        }

        return positions[0]; // Default to first note
    }
}

/**
 * Staff note with measure boundary info
 */
export interface StaffNote {
    midi: number | number[];
    duration: string;
    durationValue?: number; // Numeric duration in beats (1 = quarter, 2 = half, 4 = whole)
    isRest?: boolean;
    measureEnd?: boolean;
    hidden?: boolean; // If true, note position is reserved but nothing is drawn
}
