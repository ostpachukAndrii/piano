import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    Component,
    ElementRef,
    inject,
    Input,
    OnChanges,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { TimeSignatureRendererService } from '../../../features/lesson-player/notation-stage/time-signature-renderer.service';
import { ClefRendererService } from '../../../features/lesson-player/notation-stage/clef-renderer.service';
import { RestRendererService } from '../../../features/lesson-player/notation-stage/rest-renderer.service';
import { NoteheadRendererService } from '../../../features/lesson-player/notation-stage/notehead-renderer.service';
import { StaffMathService } from '../../../features/lesson-player/notation-stage/staff-math.service';
import { BeamingService, BeamableNote, BeamGroupResult } from '../../../features/lesson-player/notation-stage/beaming.service';

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
            class="staff-canvas"
        >
        </canvas>
    `,
    styles: [
        `
            .staff-canvas {
                background: #0f0f23;
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
    @Input() timeSignature: string | null = null; // Time signature like "4/4"
    @Input() showFirstBar = false; // Show time signature on first measure only

    private ctx!: CanvasRenderingContext2D;
    private timeSignatureRenderer = inject(TimeSignatureRendererService);
    private clefRenderer = inject(ClefRendererService);
    private restRenderer = inject(RestRendererService);
    private noteheadRenderer = inject(NoteheadRendererService);
    private staffMath = inject(StaffMathService);
    private beamingService = inject(BeamingService);

    // Track which notes are beamed (to skip individual stem drawing)
    private beamedNoteIndices = new Set<number>();

    // Layout constants
    private readonly LINE_SPACING = 12;
    private readonly TOP_MARGIN = 15;
    private readonly LEFT_MARGIN = 110; // Increased to make room for clef and time signature
    private readonly RIGHT_MARGIN = 30;
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

        // Set canvas dimensions before drawing to prevent Angular's
        // DOM [width]/[height] binding update from clearing the canvas
        // after we've rendered (browser clears canvas on dimension change).
        const canvas = this.canvas.nativeElement;
        if (canvas.width !== this.width || canvas.height !== this.height) {
            canvas.width = this.width;
            canvas.height = this.height;
            this.ctx = canvas.getContext('2d')!;
        }

        this.clearCanvas();
        this.drawStaffLines();
        this.drawClef();
        this.drawTimeSignature();
        this.drawNotes();
        this.drawSmoothPlayhead();
    }

    private clearCanvas() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    private drawStaffLines() {
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;

        for (let i = 0; i < 5; i++) {
            const y = this.TOP_MARGIN + i * this.LINE_SPACING;
            this.ctx.beginPath();
            this.ctx.moveTo(20, y);
            this.ctx.lineTo(this.width - 20, y);
            this.ctx.stroke();
        }
    }

    /**
     * Get Y coordinate for a staff line
     * NOTE: lineIndex is FROM TOP (0 = top line, 4 = bottom line)
     * BUT we always think in terms of FROM BOTTOM in notation logic!
     * Line 0 (top) = Line 5 from bottom
     * Line 1 = Line 4 from bottom
     * Line 2 (middle) = Line 3 from bottom
     * Line 3 = Line 2 from bottom
     * Line 4 (bottom) = Line 1 from bottom
     */
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
        // Standardized clef position - matches notation-stage component
        const anchorX = 30;

        if (this.clef === 'treble') {
            // Treble clef: anchor at G4 line (2nd from bottom = line 3 from top)
            const anchorY = this.getLineY(3);
            this.clefRenderer.drawTrebleClef(
                this.ctx,
                anchorX,
                anchorY,
                this.LINE_SPACING,
                1.0,
                '#ffffff'
            );
        } else {
            // Bass clef: anchor at F3 line (4th from bottom = line 1 from top)
            const anchorY = this.getLineY(1);
            this.clefRenderer.drawBassClef(
                this.ctx,
                anchorX,
                anchorY,
                this.LINE_SPACING,
                1.0,
                '#ffffff'
            );
        }
    }

    private drawTimeSignature() {
        // Only draw on first staff line (when globalBeatOffset is 0)
        if (!this.timeSignature || this.globalBeatOffset !== 0) return;

        // Parse time signature
        const parts = this.timeSignature.split('/');
        if (parts.length !== 2) return;

        const numerator = parseInt(parts[0], 10);
        const denominator = parseInt(parts[1], 10);

        if (isNaN(numerator) || isNaN(denominator)) return;

        // Time signature position - adjusted for smaller staff line spacing
        const timeSignatureX = 70;

        this.timeSignatureRenderer.drawTimeSignature(
            this.ctx,
            timeSignatureX,
            this.TOP_MARGIN,
            this.LINE_SPACING,
            numerator,
            denominator,
            '#ffffff'
        );
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

        // Build beam groups for connected notes
        this.beamedNoteIndices.clear();
        const beamGroups = this.buildBeamGroups();

        // Draw beam groups first (behind notes)
        this.drawBeamGroups(beamGroups, positions);

        let measureIndex = 0;

        this.notes.forEach((note, localIndex) => {
            const globalIndex = this.globalNoteOffset + localIndex;
            const x = positions[localIndex];
            const isBeamed = this.beamedNoteIndices.has(localIndex);

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
                        // Pass isBeamed flag to skip individual stem for beamed notes
                        this.drawNote(x, y, note.duration, isActive, isBeamed);
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

    /**
     * Build beam groups from notes using shared BeamingService
     * Only includes visible (non-hidden) notes in beam groups
     */
    private buildBeamGroups(): BeamGroupResult[] {
        // Convert StaffNote[] to BeamableNote[], excluding hidden notes
        const beamableNotes: BeamableNote[] = [];
        const hand = this.clef === 'treble' ? 'right' : 'left';

        for (let i = 0; i < this.notes.length; i++) {
            const note = this.notes[i];
            const durationBeats = note.durationValue ?? this.durationToBeats(note.duration);

            // Skip hidden notes from beaming (they're placeholder notes on the other staff)
            if (note.hidden) {
                continue;
            }

            const midiValues = note.isRest ? [] :
                (Array.isArray(note.midi) ? note.midi : [note.midi]);

            // Use stored beatPosition for correct beaming (matches scroll view behavior)
            // Falls back to 0 if not set (shouldn't happen with GrandStaffComponent)
            const startPosition = note.beatPosition ?? 0;

            beamableNotes.push({
                midi: midiValues,
                startPosition,
                durationBeats,
                hand: hand as 'left' | 'right',
                isRest: note.isRest,
                originalNote: { note, originalIndex: i } // Track original index
            });
        }

        // Get beam groups from service
        // Parse time signature for correct beatsPerMeasure (e.g., "4/4" -> 4, "3/4" -> 3)
        let beatsPerMeasure = 4;
        if (this.timeSignature) {
            const parts = this.timeSignature.split('/');
            if (parts.length === 2) {
                const numerator = parseInt(parts[0], 10);
                if (!isNaN(numerator)) {
                    beatsPerMeasure = numerator;
                }
            }
        }
        const beamGroups = this.beamingService.buildBeamGroups(beamableNotes, beatsPerMeasure);

        // Track which notes are beamed - use original indices
        for (const group of beamGroups) {
            for (const beamNote of group.notes) {
                const original = beamNote.originalNote as { note: StaffNote; originalIndex: number };
                if (original && typeof original.originalIndex === 'number') {
                    this.beamedNoteIndices.add(original.originalIndex);
                }
            }
        }

        return beamGroups;
    }

    /**
     * Draw beam groups using shared BeamingService
     */
    private drawBeamGroups(beamGroups: BeamGroupResult[], positions: number[]): void {
        for (const group of beamGroups) {
            // Get X and Y positions for each note in the group
            // Use original indices stored in beamNote.originalNote
            const xPositions: number[] = [];
            const yPositions: number[] = [];

            for (const beamNote of group.notes) {
                const original = beamNote.originalNote as { note: StaffNote; originalIndex: number };
                if (!original || typeof original.originalIndex !== 'number') continue;

                const idx = original.originalIndex;
                const note = this.notes[idx];
                const x = positions[idx];
                xPositions.push(x);

                // Calculate average Y for this note (for chords)
                const midiValues = Array.isArray(note.midi) ? note.midi : [note.midi];
                const ys = midiValues.map(m => this.midiToY(m));
                const avgY = ys.reduce((a, b) => a + b, 0) / ys.length;
                yPositions.push(avgY);
            }

            // Only draw if we have at least 2 notes
            if (xPositions.length < 2) continue;

            // Draw the beam group
            this.beamingService.drawBeamGroup(
                this.ctx,
                group,
                xPositions,
                yPositions,
                '#ffffff', // color
                8,  // noteheadRadiusX (smaller for classic view)
                5,  // noteheadRadiusY
                this.STEM_HEIGHT // baseStemLength (35 for classic view)
            );
        }
    }

    private drawBarLine(x: number): void {
        this.ctx.strokeStyle = '#ffffff';
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
        this.ctx.strokeStyle = '#ffffff';
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

    private drawNote(x: number, y: number, duration: string, active: boolean, isBeamed: boolean = false) {
        // Convert duration string to beats
        const durationBeats = this.durationToBeats(duration);

        // Draw notehead using shared renderer service
        const color = active ? '#2196F3' : '#ffffff';
        this.noteheadRenderer.drawNotehead(this.ctx, x, y, color, active, durationBeats, false);

        // Draw stem (all notes except whole notes) using centralized service
        // Skip stem drawing for beamed notes (stems are drawn with the beam group)
        // Use hand-based stem direction for consistency with scrolling view:
        // - treble clef = right hand → stem UP
        // - bass clef = left hand → stem DOWN
        if (duration !== 'whole' && !isBeamed) {
            const hand = this.clef === 'treble' ? 'right' : 'left';
            const stemUp = this.staffMath.getStemDirection(hand);
            this.noteheadRenderer.drawStem(this.ctx, x, y, color, stemUp, durationBeats, this.STEM_HEIGHT);
        }
    }

    private drawLedgerLines(x: number, midi: number) {
        const y = this.midiToY(midi);
        const topLine = this.getLineY(0);
        const bottomLine = this.getLineY(4);

        this.ctx.strokeStyle = '#ffffff';
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
        // Convert duration string to beats value
        const durationBeats = this.durationToBeats(duration);

        // Use shared RestRendererService for consistent rendering
        this.restRenderer.drawRest(
            this.ctx,
            x,
            this.TOP_MARGIN,
            this.LINE_SPACING,
            durationBeats,
            '#ffffff'
        );
    }

    /**
     * Convert MIDI note number to Y coordinate on staff
     * ALWAYS CALCULATE FROM BOTTOM!
     *
     * Reference notes (anchors):
     * - Treble clef: G4 (MIDI 67) on line 2 from bottom
     * - Bass clef: F3 (MIDI 53) on line 4 from bottom
     */
    private midiToY(midi: number): number {
        // Use correct reference notes from ClefRendererService
        // Treble: G4 (67) on 2nd line from bottom (line index 1)
        // Bass: F3 (53) on 4th line from bottom (line index 3)
        const referenceNote = this.clef === 'treble' ? 67 : 53; // G4 / F3
        const referenceLineIndex = this.clef === 'treble' ? 1 : 3; // 2nd / 4th line from bottom

        const steps = this.semitonesToSteps(midi) - this.semitonesToSteps(referenceNote);
        const halfSpacing = this.LINE_SPACING / 2;
        const referenceY = this.getLineY(4 - referenceLineIndex); // Convert from bottom to top indexing

        return referenceY - steps * halfSpacing;
    }

    private semitonesToSteps(midi: number): number {
        // Use shared StaffMathService for consistent diatonic step calculation
        // This ensures classic and scrolling views position notes identically
        return this.staffMath.midiToDiatonicStep(midi);
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
    beatPosition?: number; // Actual beat position for correct beaming (set by GrandStaffComponent)
}
