import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    OnChanges,
    SimpleChanges,
    ViewChild,
    signal,
} from '@angular/core';
import { BeamGroup, KeySignature, NoteState, ScrollingNote, TimingFeedback, WrongNoteEvent } from '../models/scrolling-note.model';

/**
 * Notation Stage Component (Zone B)
 * Canvas-based rendering of the grand staff with scrolling notes.
 */
@Component({
    selector: 'app-notation-stage',
    standalone: true,
    imports: [CommonModule],
    template: `
        <canvas
            #stageCanvas
            [width]="stageWidth"
            [height]="stageHeight"
            class="stage-canvas">
        </canvas>
        <!-- Playhead line (percentage position to match scaled canvas) -->
        <div class="playhead" [style.left.%]="playheadPercent"></div>
    `,
    styles: [`
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }

        .stage-canvas {
            display: block;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }

        .playhead {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 3px;
            background: #3B82F6;
            box-shadow: 0 0 10px #3B82F6, 0 0 20px #3B82F6;
            z-index: 10;
            pointer-events: none;
        }
    `]
})
export class NotationStageComponent implements AfterViewInit, OnChanges {
    @ViewChild('stageCanvas') canvas!: ElementRef<HTMLCanvasElement>;

    // Inputs
    @Input() scrollingNotes: ScrollingNote[] = [];
    @Input() currentBeat = 0;
    @Input() playheadX = 300;
    @Input() stageWidth = 1200;
    @Input() stageHeight = 400;
    @Input() beatsPerMeasure = 4; // For bar lines

    // Computed: playhead position as percentage (for CSS scaling)
    get playheadPercent(): number {
        return (this.playheadX / this.stageWidth) * 100;
    }
    @Input() totalBeats = 0; // Total beats in the piece
    @Input() wrongNoteEvents: WrongNoteEvent[] = []; // Wrong notes to display
    @Input() keySignature: KeySignature | null = null; // Key signature for accidentals

    // Canvas context
    private ctx: CanvasRenderingContext2D | null = null;

    // Track which notes are part of beam groups (to avoid double-rendering stems)
    private beamedNoteIds = new Set<string>();

    // Rendering constants
    readonly PIXELS_PER_BEAT = 80;
    readonly NOTE_BAR_OFFSET = 15; // Offset notes from bar lines (in pixels)

    // State colors
    private readonly STATE_COLORS: Record<NoteState, string> = {
        'upcoming': '#ffffff',
        'active': '#3B82F6',
        'hit': '#22c55e',
        'missed': '#ef4444'
    };

    // Timing feedback colors
    private readonly FEEDBACK_COLORS: Record<string, string> = {
        'early': '#eab308',      // Yellow for early
        'late': '#f59e0b',       // Orange/amber for late
        'early_release': '#f97316', // Orange for early release
        'replayed': '#ec4899',   // Pink for replayed
        'perfect': '#22c55e'     // Green for perfect
    };

    ngAfterViewInit(): void {
        const canvas = this.canvas.nativeElement;
        this.ctx = canvas.getContext('2d');
        this.render();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.ctx) {
            this.render();
        }
    }

    /**
     * Main render function - clears canvas and draws all elements
     */
    render(): void {
        if (!this.ctx) return;

        const ctx = this.ctx;
        const width = this.stageWidth;
        const height = this.stageHeight;

        // Clear canvas
        ctx.fillStyle = '#0f0f23';
        ctx.fillRect(0, 0, width, height);

        // Draw staff lines
        this.drawStaffLines(ctx, height);

        // Draw key signature at the start of the staff
        this.drawKeySignature(ctx, height);

        // Draw bar lines
        this.drawBarLines(ctx, height);

        // Clear beamed notes tracking for this frame
        this.beamedNoteIds.clear();

        // Build beam groups for short notes
        const beamGroups = this.buildBeamGroups();

        // Draw beams first (behind notes)
        this.drawBeamGroups(ctx, beamGroups, height);

        // Draw notes
        this.drawNotes(ctx, height, beamGroups);

        // Draw wrong note indicators
        this.drawWrongNotes(ctx, height);

        // Draw playhead glow area
        this.drawPlayheadGlow(ctx, height);
    }

    /**
     * Draw the treble and bass staff lines
     */
    drawStaffLines(ctx: CanvasRenderingContext2D, height: number): void {
        const staffHeight = height * 0.35;
        const lineSpacing = staffHeight / 5;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.5;

        // Treble staff (top)
        const trebleTop = height * 0.1;
        for (let i = 0; i < 5; i++) {
            const y = trebleTop + i * lineSpacing;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.stageWidth, y);
            ctx.stroke();
        }

        // Bass staff (bottom)
        const bassTop = height * 0.55;
        for (let i = 0; i < 5; i++) {
            const y = bassTop + i * lineSpacing;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.stageWidth, y);
            ctx.stroke();
        }
    }

    /**
     * Draw bar lines at measure boundaries
     */
    drawBarLines(ctx: CanvasRenderingContext2D, height: number): void {
        if (this.beatsPerMeasure <= 0) return;

        const staffHeight = height * 0.35;
        const trebleTop = height * 0.1;
        const trebleBottom = trebleTop + staffHeight;
        const bassTop = height * 0.55;
        const bassBottom = bassTop + staffHeight;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;

        // Calculate visible measure range
        const startBeat = this.currentBeat - (this.playheadX / this.PIXELS_PER_BEAT);
        const endBeat = this.currentBeat + ((this.stageWidth - this.playheadX) / this.PIXELS_PER_BEAT);

        const startMeasure = Math.floor(startBeat / this.beatsPerMeasure);
        const endMeasure = Math.ceil(endBeat / this.beatsPerMeasure);

        for (let m = startMeasure; m <= endMeasure; m++) {
            const measureBeat = m * this.beatsPerMeasure;
            const x = this.beatToX(measureBeat);

            if (x < -10 || x > this.stageWidth + 10) continue;

            // Draw bar line for treble staff
            ctx.beginPath();
            ctx.moveTo(x, trebleTop);
            ctx.lineTo(x, trebleBottom);
            ctx.stroke();

            // Draw bar line for bass staff
            ctx.beginPath();
            ctx.moveTo(x, bassTop);
            ctx.lineTo(x, bassBottom);
            ctx.stroke();
        }
    }

    /**
     * Check if a beat position is on a bar line
     */
    isOnBarLine(beat: number): boolean {
        if (this.beatsPerMeasure <= 0) return false;
        // Check if beat is exactly on a measure boundary (with small tolerance for float errors)
        const tolerance = 0.001;
        const remainder = beat % this.beatsPerMeasure;
        return remainder < tolerance || (this.beatsPerMeasure - remainder) < tolerance;
    }

    /**
     * Get X position for a note, with offset if it's on a bar line
     */
    getNoteX(beat: number): number {
        const baseX = this.beatToX(beat);
        // Add offset if note starts on a bar line to avoid visual overlap
        if (this.isOnBarLine(beat)) {
            return baseX + this.NOTE_BAR_OFFSET;
        }
        return baseX;
    }

    /**
     * Draw all notes with their current states
     */
    drawNotes(ctx: CanvasRenderingContext2D, height: number, beamGroups: BeamGroup[]): void {
        // Create a map of note IDs to their beam group X positions
        const beamXPositions = new Map<string, number>();
        for (const group of beamGroups) {
            for (let i = 0; i < group.notes.length; i++) {
                const noteId = this.getNoteId(group.notes[i]);
                beamXPositions.set(noteId, group.xPositions[i]);
            }
        }

        for (const note of this.scrollingNotes) {
            // Check if this note is part of a beam group
            const noteId = this.getNoteId(note);
            const isBeamed = this.beamedNoteIds.has(noteId);

            // For beamed notes, use the pre-calculated X position from the beam group
            // For other notes: active notes go at playhead, others use bar line offset
            let x: number;
            if (isBeamed && beamXPositions.has(noteId)) {
                x = beamXPositions.get(noteId)!;
            } else {
                x = note.state === 'active'
                    ? this.playheadX  // Active: exactly at playhead line
                    : this.getNoteX(note.startBeat); // Others: with bar line offset
            }

            // Skip notes far off screen
            if (x < -50 || x > this.stageWidth + 50) continue;

            // Determine color based on state
            const color = this.STATE_COLORS[note.state];

            // Handle rests separately from notes
            if (note.isRest) {
                this.drawRest(ctx, x, note.hand, note.durationBeats, height, color);
                continue;
            }

            // For chords, find the average Y to determine stem direction
            const ys = note.midi.map(midi => this.midiToY(midi, note.hand, height));
            const avgY = ys.reduce((a, b) => a + b, 0) / ys.length;
            const stemUp = note.hand === 'right' ? avgY > height * 0.3 : avgY > height * 0.7;

            // Draw each notehead in chord (with ledger lines if needed)
            for (const midi of note.midi) {
                const y = this.midiToY(midi, note.hand, height);
                // Draw ledger lines first (behind the note)
                this.drawLedgerLines(ctx, x, midi, note.hand, height);
                // Draw accidental (sharp/flat) for black keys
                this.drawAccidental(ctx, x, y, midi, color);
                this.drawNoteHead(ctx, x, y, color, note.state, note.durationBeats);
            }

            // Draw stem for notes that need one (not whole notes)
            // Skip if note is beamed (stems are drawn with the beam group)
            if (note.durationBeats < 4 && !isBeamed) {
                this.drawStem(ctx, x, ys, color, stemUp, note.durationBeats);
            }

            // Draw duration tail (for scrolling visualization)
            // Use beatToX for end position (no bar line offset for duration end)
            const endX = this.beatToX(note.startBeat + note.durationBeats);
            if (endX > x && note.state !== 'missed') {
                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
                ctx.globalAlpha = 0.3;
                for (const midi of note.midi) {
                    const y = this.midiToY(midi, note.hand, height);
                    ctx.beginPath();
                    ctx.moveTo(x + 10, y);
                    ctx.lineTo(Math.min(endX, this.stageWidth), y);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
            }

            // Draw timing feedback indicators
            if (note.timingFeedback && note.timingFeedback !== 'perfect') {
                this.drawTimingFeedback(ctx, x, avgY, note);
            }

            // Draw early release indicator on the duration tail
            if (note.releasedEarly && note.state === 'hit') {
                this.drawEarlyReleaseIndicator(ctx, note, height);
            }
        }
    }

    /**
     * Draw timing feedback indicator (late start, replayed)
     */
    drawTimingFeedback(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        note: ScrollingNote
    ): void {
        const feedback = note.timingFeedback;
        if (!feedback || feedback === 'perfect') return;

        const feedbackColor = this.FEEDBACK_COLORS[feedback] || '#f59e0b';

        // Draw feedback badge above the note
        ctx.save();

        // Badge background
        const badgeY = y - 25;
        ctx.fillStyle = feedbackColor;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.roundRect(x - 20, badgeY - 10, 40, 18, 4);
        ctx.fill();

        // Badge text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let text = '';
        if (feedback === 'early') text = 'EARLY';
        else if (feedback === 'late') text = 'LATE';
        else if (feedback === 'replayed') text = 'REPLAY';
        else if (feedback === 'early_release') text = 'SHORT';

        ctx.fillText(text, x, badgeY);

        ctx.restore();
    }

    /**
     * Draw early release indicator showing where the note was cut short
     */
    drawEarlyReleaseIndicator(
        ctx: CanvasRenderingContext2D,
        note: ScrollingNote,
        height: number
    ): void {
        if (!note.hitBeat) return;

        // Use beatToX for release point (no bar line offset)
        const hitX = this.beatToX(note.hitBeat);
        const expectedEndX = this.beatToX(note.startBeat + note.durationBeats);

        // Draw a dashed line showing the remaining duration that wasn't held
        ctx.save();
        ctx.strokeStyle = this.FEEDBACK_COLORS['early_release'];
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.globalAlpha = 0.6;

        for (const midi of note.midi) {
            const y = this.midiToY(midi, note.hand, height);
            ctx.beginPath();
            ctx.moveTo(hitX + 10, y);
            ctx.lineTo(Math.min(expectedEndX, this.stageWidth), y);
            ctx.stroke();
        }

        // Draw an X mark at the release point
        const ys = note.midi.map(midi => this.midiToY(midi, note.hand, height));
        const avgY = ys.reduce((a, b) => a + b, 0) / ys.length;

        ctx.setLineDash([]);
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(hitX - 6, avgY - 6);
        ctx.lineTo(hitX + 6, avgY + 6);
        ctx.moveTo(hitX + 6, avgY - 6);
        ctx.lineTo(hitX - 6, avgY + 6);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Draw ledger lines for notes above or below the staff
     * Ledger lines are short horizontal lines that extend the staff for notes outside it
     */
    drawLedgerLines(
        ctx: CanvasRenderingContext2D,
        x: number,
        midi: number,
        hand: 'left' | 'right',
        height: number
    ): void {
        const staffHeight = height * 0.35;
        const lineSpacing = staffHeight / 5;
        const stepSpacing = lineSpacing / 2;
        // Ledger line width should be ~1.6-1.8x notehead width for clear visibility
        // Notehead width is 20px (radius 10), so 36px gives 8px overhang on each side
        const ledgerLineWidth = 36;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.5;

        const noteStep = this.midiToDiatonicStep(midi);

        if (hand === 'right' || midi >= 60) {
            // Treble staff
            // Bottom line (E4, MIDI 64) at step 30, top line (F5, MIDI 77) at step 38
            const trebleTop = height * 0.1;
            const trebleBottomLine = trebleTop + lineSpacing * 4;
            const e4Step = this.midiToDiatonicStep(64); // E4 = bottom line
            const f5Step = this.midiToDiatonicStep(77); // F5 = top line

            // Ledger lines below staff (for notes at D4 and below)
            // Lines appear at C4, A3, F3, etc. (every 2 steps below E4)
            if (noteStep < e4Step) {
                // Draw ledger lines from the first line below (D4 position) down to the note
                for (let step = e4Step - 2; step >= noteStep; step -= 2) {
                    const y = trebleBottomLine + ((e4Step - step) * stepSpacing);
                    ctx.beginPath();
                    ctx.moveTo(x - ledgerLineWidth / 2, y);
                    ctx.lineTo(x + ledgerLineWidth / 2, y);
                    ctx.stroke();
                }
            }

            // Ledger lines above staff (for notes at G5 and above)
            if (noteStep > f5Step) {
                for (let step = f5Step + 2; step <= noteStep; step += 2) {
                    const y = trebleTop - ((step - f5Step) * stepSpacing);
                    ctx.beginPath();
                    ctx.moveTo(x - ledgerLineWidth / 2, y);
                    ctx.lineTo(x + ledgerLineWidth / 2, y);
                    ctx.stroke();
                }
            }
        } else {
            // Bass staff
            // Bottom line (G2, MIDI 43) at step 18, top line (A3, MIDI 57) at step 26
            const bassTop = height * 0.55;
            const bassBottomLine = bassTop + lineSpacing * 4;
            const g2Step = this.midiToDiatonicStep(43); // G2 = bottom line
            const a3Step = this.midiToDiatonicStep(57); // A3 = top line

            // Ledger lines below staff (for notes at F2 and below)
            if (noteStep < g2Step) {
                for (let step = g2Step - 2; step >= noteStep; step -= 2) {
                    const y = bassBottomLine + ((g2Step - step) * stepSpacing);
                    ctx.beginPath();
                    ctx.moveTo(x - ledgerLineWidth / 2, y);
                    ctx.lineTo(x + ledgerLineWidth / 2, y);
                    ctx.stroke();
                }
            }

            // Ledger lines above staff (for notes at B3 and above, including middle C)
            if (noteStep > a3Step) {
                for (let step = a3Step + 2; step <= noteStep; step += 2) {
                    const y = bassTop - ((step - a3Step) * stepSpacing);
                    ctx.beginPath();
                    ctx.moveTo(x - ledgerLineWidth / 2, y);
                    ctx.lineTo(x + ledgerLineWidth / 2, y);
                    ctx.stroke();
                }
            }
        }
    }

    /**
     * Draw a single notehead
     */
    drawNoteHead(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        color: string,
        state: NoteState,
        duration: number
    ): void {
        // Determine if notehead should be hollow or filled
        // Whole notes (4 beats) and half notes (2 beats) are hollow
        // Quarter notes (1 beat) and shorter are filled
        const isHollow = duration >= 2;

        // Glow for active notes
        if (state === 'active') {
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
        }

        // Draw notehead with slight rotation for musical appearance
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.3); // Slight tilt like real noteheads
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2);

        if (isHollow) {
            // Draw hollow notehead with stroke
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            // Draw filled notehead
            ctx.fillStyle = color;
            ctx.fill();
        }

        ctx.restore();
        ctx.shadowBlur = 0;

        // Hit explosion effect
        if (state === 'hit') {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    /**
     * Draw a rest symbol based on duration
     * Rests are positioned in the center of the staff (treble or bass)
     */
    drawRest(
        ctx: CanvasRenderingContext2D,
        x: number,
        hand: 'left' | 'right',
        duration: number,
        height: number,
        color: string
    ): void {
        const staffHeight = height * 0.35;
        const lineSpacing = staffHeight / 5;

        // Calculate staff positions
        const trebleTop = height * 0.1;
        const bassTop = height * 0.55;

        // Line positions (from top to bottom: 0, 1, 2, 3, 4)
        const staffTop = (hand === 'right') ? trebleTop : bassTop;
        const line3 = staffTop + lineSpacing * 2; // Middle line (3rd from top)
        const line4 = staffTop + lineSpacing * 3; // 4th line from top

        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';

        // Draw appropriate rest symbol based on duration
        if (duration >= 4) {
            // Whole rest (4+ beats) - hanging block below 4th line
            // "Hangs down from the 4th line (second from top)"
            const width = 16;
            const blockHeight = 8;
            const restY = line4; // Starts at line 4 and hangs down
            ctx.fillRect(x - width / 2, restY, width, blockHeight);
        } else if (duration >= 2) {
            // Half rest (2-3.99 beats) - sitting block on 3rd line (middle)
            // "Sits on top of the 3rd line (the middle line)"
            const width = 16;
            const blockHeight = 8;
            const restY = line3; // Sits on middle line (goes upward)
            ctx.fillRect(x - width / 2, restY - blockHeight, width, blockHeight);
        } else if (duration >= 1) {
            // Quarter rest (1-1.99 beats) - squiggle shape
            // Centered on the middle line
            const y = line3;
            ctx.beginPath();
            ctx.moveTo(x - 4, y - 15);
            ctx.quadraticCurveTo(x + 8, y - 12, x - 2, y - 5);
            ctx.quadraticCurveTo(x - 6, y, x + 4, y + 2);
            ctx.lineTo(x - 3, y + 8);
            ctx.quadraticCurveTo(x - 8, y + 12, x - 2, y + 15);
            ctx.stroke();

            // Add filled circle at top
            ctx.beginPath();
            ctx.arc(x - 1, y - 15, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (duration >= 0.5) {
            // Eighth rest (0.5-0.99 beats) - flag with filled circle
            // Centered on the middle line
            const y = line3;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();

            // Draw stem and flag
            ctx.beginPath();
            ctx.moveTo(x + 3, y);
            ctx.lineTo(x + 3, y - 12);
            ctx.stroke();

            // Draw flag curve
            ctx.beginPath();
            ctx.moveTo(x + 3, y - 12);
            ctx.quadraticCurveTo(x + 10, y - 8, x + 8, y - 3);
            ctx.stroke();
        } else if (duration >= 0.25) {
            // Sixteenth rest (0.25-0.49 beats) - double flag with filled circle
            // Centered on the middle line
            const y = line3;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();

            // Draw stem
            ctx.beginPath();
            ctx.moveTo(x + 3, y);
            ctx.lineTo(x + 3, y - 15);
            ctx.stroke();

            // Draw first flag
            ctx.beginPath();
            ctx.moveTo(x + 3, y - 15);
            ctx.quadraticCurveTo(x + 10, y - 11, x + 8, y - 6);
            ctx.stroke();

            // Draw second flag
            ctx.beginPath();
            ctx.moveTo(x + 3, y - 10);
            ctx.quadraticCurveTo(x + 10, y - 6, x + 8, y - 1);
            ctx.stroke();
        } else {
            // 32nd rest and shorter (< 0.25 beats) - triple flag
            // Centered on the middle line
            const y = line3;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();

            // Draw stem
            ctx.beginPath();
            ctx.moveTo(x + 3, y);
            ctx.lineTo(x + 3, y - 18);
            ctx.stroke();

            // Draw three flags
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(x + 3, y - 18 + i * 5);
                ctx.quadraticCurveTo(x + 10, y - 14 + i * 5, x + 8, y - 9 + i * 5);
                ctx.stroke();
            }
        }
    }

    /**
     * Draw accidental (sharp/flat) symbol for notes
     * Uses key signature to determine whether to show sharp or flat
     * Displays to the left of the notehead
     */
    drawAccidental(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        midi: number,
        color: string
    ): void {
        const noteInOctave = midi % 12;
        const blackKeys = [1, 3, 6, 8, 10]; // C#/Db, D#/Eb, F#/Gb, G#/Ab, A#/Bb

        if (!blackKeys.includes(noteInOctave)) return;

        ctx.save();

        // Position accidental to the left of the notehead
        const accidentalX = x - 20;
        const fontSize = 20;  // Larger size for better visibility

        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Determine whether to show sharp or flat based on key signature
        let symbol = '♯'; // Default to sharp (U+266F)

        if (this.keySignature) {
            // Check if this note is in the key signature
            if (this.keySignature.sharpNotes.includes(noteInOctave)) {
                symbol = '♯';
            } else if (this.keySignature.flatNotes.includes(noteInOctave)) {
                symbol = '♭';
            } else if (this.keySignature.accidentals < 0) {
                // In flat keys, prefer flats for accidentals
                symbol = '♭';  // U+266D
            }
        }

        // Draw shadow/outline for better visibility
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.strokeText(symbol, accidentalX, y);

        // Draw the symbol (always full opacity - don't dim courtesy accidentals)
        ctx.fillStyle = color;
        ctx.fillText(symbol, accidentalX, y);

        ctx.restore();
    }

    /**
     * Draw stem for a note or chord
     */
    drawStem(
        ctx: CanvasRenderingContext2D,
        x: number,
        ys: number[],
        color: string,
        stemUp: boolean,
        duration: number
    ): void {
        const stemLength = 35;
        const noteheadRadius = 10;

        // Find the extreme Y position for the stem attachment
        const attachY = stemUp ? Math.min(...ys) : Math.max(...ys);
        const stemX = stemUp ? x + noteheadRadius - 1 : x - noteheadRadius + 1;
        const stemEndY = stemUp ? attachY - stemLength : attachY + stemLength;

        // Draw stem
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(stemX, attachY);
        ctx.lineTo(stemX, stemEndY);
        ctx.stroke();

        // Draw flags for eighth and sixteenth notes
        if (duration <= 0.5) {
            this.drawFlag(ctx, stemX, stemEndY, color, stemUp);
        }
        if (duration <= 0.25) {
            // Second flag for sixteenth
            const flagOffset = stemUp ? 8 : -8;
            this.drawFlag(ctx, stemX, stemEndY + flagOffset, color, stemUp);
        }
    }

    /**
     * Draw a flag on a stem
     */
    drawFlag(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        color: string,
        stemUp: boolean
    ): void {
        ctx.fillStyle = color;
        ctx.beginPath();

        if (stemUp) {
            // Flag curves to the right
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + 15, y + 10, x + 10, y + 20);
            ctx.quadraticCurveTo(x + 8, y + 12, x, y + 8);
        } else {
            // Flag curves to the left
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x - 15, y - 10, x - 10, y - 20);
            ctx.quadraticCurveTo(x - 8, y - 12, x, y - 8);
        }

        ctx.closePath();
        ctx.fill();
    }

    /**
     * Draw glow effect around the playhead
     */
    drawPlayheadGlow(ctx: CanvasRenderingContext2D, height: number): void {
        const gradient = ctx.createLinearGradient(
            this.playheadX - 30, 0,
            this.playheadX + 30, 0
        );
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0)');
        gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.1)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(this.playheadX - 30, 0, 60, height);
    }

    /**
     * Convert beat position to X coordinate
     * Notes scroll from right to left, playhead is fixed
     */
    beatToX(beat: number): number {
        const beatOffset = beat - this.currentBeat;
        return this.playheadX + (beatOffset * this.PIXELS_PER_BEAT);
    }

    /**
     * Convert MIDI note to diatonic step (C=0, D=1, E=2, F=3, G=4, A=5, B=6)
     * Returns total diatonic steps from C0
     * For black keys: uses key signature to determine sharp vs flat positioning
     */
    midiToDiatonicStep(midi: number): number {
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
            const useFlat = this.keySignature && (
                this.keySignature.flatNotes.includes(noteInOctave) ||
                this.keySignature.accidentals < 0
            );

            if (useFlat) {
                // Flat: position on the UPPER letter (Db on D, Eb on E, etc.)
                // MIDI 61 (Db) → D position (1)
                // MIDI 63 (Eb) → E position (2)
                // MIDI 66 (Gb) → G position (4)
                // MIDI 68 (Ab) → A position (5)
                // MIDI 70 (Bb) → B position (6)
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
                // MIDI 61 (C#) → C position (0)
                // MIDI 63 (D#) → D position (1)
                // MIDI 66 (F#) → F position (3)
                // MIDI 68 (G#) → G position (4)
                // MIDI 70 (A#) → A position (5)
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
     * Handles both treble and bass clef positioning
     * Uses diatonic steps for proper staff placement
     */
    midiToY(midi: number, hand: 'left' | 'right', height: number): number {
        const staffHeight = height * 0.35;
        const lineSpacing = staffHeight / 5;
        // Each line/space is half a lineSpacing (one diatonic step)
        const stepSpacing = lineSpacing / 2;

        if (hand === 'right' || midi >= 60) {
            // Treble staff
            // Reference: E4 (MIDI 64) is on the bottom line (line 0)
            // G4 (MIDI 67) is on line 1 (second from bottom)
            // B4 (MIDI 71) is on line 2 (middle)
            // D5 (MIDI 74) is on line 3
            // F5 (MIDI 77) is on line 4 (top)
            const trebleTop = height * 0.1;
            const trebleBottomLine = trebleTop + lineSpacing * 4; // Line 0 (E4)
            const referenceStep = this.midiToDiatonicStep(64); // E4
            const noteStep = this.midiToDiatonicStep(midi);
            const stepDiff = noteStep - referenceStep;
            return trebleBottomLine - (stepDiff * stepSpacing);
        } else {
            // Bass staff
            // Reference: G2 (MIDI 43) is on the bottom line (line 0)
            // B2 (MIDI 47) is on line 1
            // D3 (MIDI 50) is on line 2 (middle)
            // F3 (MIDI 53) is on line 3
            // A3 (MIDI 57) is on line 4 (top)
            const bassTop = height * 0.55;
            const bassBottomLine = bassTop + lineSpacing * 4; // Line 0 (G2)
            const referenceStep = this.midiToDiatonicStep(43); // G2
            const noteStep = this.midiToDiatonicStep(midi);
            const stepDiff = noteStep - referenceStep;
            return bassBottomLine - (stepDiff * stepSpacing);
        }
    }

    /**
     * Get color for a note state
     */
    getStateColor(state: NoteState): string {
        return this.STATE_COLORS[state];
    }

    /**
     * Check if a duration should be rendered as hollow notehead
     */
    isHollowNote(duration: number): boolean {
        return duration >= 2;
    }

    /**
     * Draw wrong note indicators on the stage
     * Shows small red X marks on the staff at the correct position
     * Stays visible until lesson restart
     */
    drawWrongNotes(ctx: CanvasRenderingContext2D, height: number): void {
        if (!this.wrongNoteEvents || this.wrongNoteEvents.length === 0) return;

        const staffHeight = height * 0.35;
        const lineSpacing = staffHeight / 5;

        for (const event of this.wrongNoteEvents) {
            // Calculate X position based on beat position (stays where it was played)
            const x = this.beatToX(event.beat);

            // Skip if off screen
            if (x < -20 || x > this.stageWidth + 20) continue;

            // Determine which staff based on MIDI note
            const hand: 'left' | 'right' = event.midi >= 60 ? 'right' : 'left';
            const y = this.midiToY(event.midi, hand, height);

            ctx.save();

            // Draw small red X mark
            const size = lineSpacing * 0.4; // Small size
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)'; // Red
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';

            // Draw X
            ctx.beginPath();
            ctx.moveTo(x - size, y - size);
            ctx.lineTo(x + size, y + size);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x + size, y - size);
            ctx.lineTo(x - size, y + size);
            ctx.stroke();

            ctx.restore();
        }
    }

    /**
     * Draw ledger lines for wrong notes that are above or below the staff
     */
    private drawLedgerLinesForWrongNote(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        hand: 'left' | 'right',
        height: number,
        lineSpacing: number,
        alpha: number
    ): void {
        const staffHeight = height * 0.35;
        const ledgerWidth = lineSpacing * 1.5;

        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 0.7})`;
        ctx.lineWidth = 1.5;

        if (hand === 'right' || y < height * 0.5) {
            // Treble staff
            const trebleTop = height * 0.1;
            const trebleBottom = trebleTop + staffHeight;

            // Ledger lines above treble staff
            if (y < trebleTop) {
                for (let ly = trebleTop - lineSpacing; ly >= y - lineSpacing / 2; ly -= lineSpacing) {
                    ctx.beginPath();
                    ctx.moveTo(x - ledgerWidth, ly);
                    ctx.lineTo(x + ledgerWidth, ly);
                    ctx.stroke();
                }
            }
            // Ledger lines below treble staff (middle C area)
            if (y > trebleBottom) {
                for (let ly = trebleBottom + lineSpacing; ly <= y + lineSpacing / 2; ly += lineSpacing) {
                    ctx.beginPath();
                    ctx.moveTo(x - ledgerWidth, ly);
                    ctx.lineTo(x + ledgerWidth, ly);
                    ctx.stroke();
                }
            }
        } else {
            // Bass staff
            const bassTop = height * 0.55;
            const bassBottom = bassTop + staffHeight;

            // Ledger lines above bass staff (middle C area)
            if (y < bassTop) {
                for (let ly = bassTop - lineSpacing; ly >= y - lineSpacing / 2; ly -= lineSpacing) {
                    ctx.beginPath();
                    ctx.moveTo(x - ledgerWidth, ly);
                    ctx.lineTo(x + ledgerWidth, ly);
                    ctx.stroke();
                }
            }
            // Ledger lines below bass staff
            if (y > bassBottom) {
                for (let ly = bassBottom + lineSpacing; ly <= y + lineSpacing / 2; ly += lineSpacing) {
                    ctx.beginPath();
                    ctx.moveTo(x - ledgerWidth, ly);
                    ctx.lineTo(x + ledgerWidth, ly);
                    ctx.stroke();
                }
            }
        }
    }

    /**
     * Draw accidental (sharp/flat) for wrong notes
     */
    private drawWrongNoteAccidental(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        midi: number,
        noteWidth: number,
        alpha: number
    ): void {
        // Check if note is a black key (has sharp/flat)
        const noteInOctave = midi % 12;
        const blackKeys = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#

        if (!blackKeys.includes(noteInOctave)) return;

        const accidentalX = x - noteWidth * 2;
        const fontSize = noteWidth * 1.5;

        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Use sharp symbol
        ctx.fillText('♯', accidentalX, y);
    }

    /**
     * Generate a unique ID for a note (for tracking beamed notes)
     */
    private getNoteId(note: ScrollingNote): string {
        return `${note.startBeat}-${note.midi.join(',')}-${note.hand}`;
    }

    /**
     * Build beam groups from notes that can be beamed together
     * Groups notes within the same beat that have duration < 1 beat
     */
    private buildBeamGroups(): BeamGroup[] {
        const groups: BeamGroup[] = [];

        // Filter notes that can be beamed (duration < 1 beat, not rests)
        const beamableNotes = this.scrollingNotes.filter(
            n => n.durationBeats < 1 && !n.isRest && n.durationBeats > 0
        );

        if (beamableNotes.length === 0) return groups;

        // Group notes by beat boundary and hand
        // Notes within the same beat should be grouped together
        const beatGroups = new Map<string, ScrollingNote[]>();

        for (const note of beamableNotes) {
            // Calculate which beat this note starts in
            const beatIndex = Math.floor(note.startBeat);
            const key = `${beatIndex}-${note.hand}`;

            if (!beatGroups.has(key)) {
                beatGroups.set(key, []);
            }
            beatGroups.get(key)!.push(note);
        }

        // Process each beat group
        for (const [, notes] of beatGroups) {
            if (notes.length < 2) continue; // Need at least 2 notes to beam

            // Sort by start beat
            notes.sort((a, b) => a.startBeat - b.startBeat);

            // Check if notes are consecutive (no gaps larger than expected)
            let canBeam = true;
            for (let i = 1; i < notes.length; i++) {
                const prevEnd = notes[i - 1].startBeat + notes[i - 1].durationBeats;
                const gap = notes[i].startBeat - prevEnd;
                // Allow small tolerance for floating point
                if (gap > 0.01) {
                    canBeam = false;
                    break;
                }
            }

            if (!canBeam) continue;

            // Calculate positions and stem direction
            const height = this.stageHeight;
            const xPositions: number[] = [];
            const yPositions: number[] = [];
            let allYs: number[] = [];

            for (const note of notes) {
                const x = note.state === 'active'
                    ? this.playheadX
                    : this.getNoteX(note.startBeat);
                xPositions.push(x);

                // Average Y for this note (for chords)
                const ys = note.midi.map(m => this.midiToY(m, note.hand, height));
                const avgY = ys.reduce((a, b) => a + b, 0) / ys.length;
                yPositions.push(avgY);
                allYs = allYs.concat(ys);
            }

            // Determine common stem direction based on farthest note from middle
            const hand = notes[0].hand;
            const middleY = hand === 'right' ? height * 0.3 : height * 0.7;

            // Find the note farthest from middle line
            let maxDistance = 0;
            let stemUp = true;
            for (const y of allYs) {
                const distance = Math.abs(y - middleY);
                if (distance > maxDistance) {
                    maxDistance = distance;
                    // If farthest note is above middle, stems go down
                    stemUp = y > middleY;
                }
            }

            // Determine beam count based on shortest note duration
            const minDuration = Math.min(...notes.map(n => n.durationBeats));
            let beamCount = 1; // Default: 8th notes
            if (minDuration <= 0.25) beamCount = 2; // 16th notes
            if (minDuration <= 0.125) beamCount = 3; // 32nd notes

            // Mark notes as beamed
            for (const note of notes) {
                this.beamedNoteIds.add(this.getNoteId(note));
            }

            groups.push({
                notes,
                stemUp,
                xPositions,
                yPositions,
                beamCount
            });
        }

        return groups;
    }

    /**
     * Draw beam groups (beams and connected stems)
     */
    private drawBeamGroups(
        ctx: CanvasRenderingContext2D,
        beamGroups: BeamGroup[],
        height: number
    ): void {
        const beamThickness = 4;
        const beamSpacing = 6;
        const noteheadRadius = 10;

        for (const group of beamGroups) {
            if (group.notes.length < 2) continue;

            // Skip if all notes are off screen
            const allOffScreen = group.xPositions.every(
                x => x < -50 || x > this.stageWidth + 50
            );
            if (allOffScreen) continue;

            // Get color from first note (could vary, but typically same state in a beam)
            const color = this.STATE_COLORS[group.notes[0].state];

            // Calculate dynamic stem length based on note range
            // First, find the range of Y positions in this beam group
            let allYs: number[] = [];
            for (const note of group.notes) {
                const ys = note.midi.map(m => this.midiToY(m, note.hand, height));
                allYs = allYs.concat(ys);
            }
            const minY = Math.min(...allYs);
            const maxY = Math.max(...allYs);
            const yRange = maxY - minY;

            // Minimum stem length should be at least 2.5x the note size (50px)
            // Add extra length if notes span a wide range
            const minStemLength = 50;
            const stemLength = Math.max(minStemLength, 50 + yRange * 0.3);

            // Calculate stem endpoints
            const stemEndpoints: { x: number; y: number }[] = [];

            for (let i = 0; i < group.notes.length; i++) {
                const note = group.notes[i];
                const x = group.xPositions[i];

                // Get all Y positions for this note (chord support)
                const ys = note.midi.map(m => this.midiToY(m, note.hand, height));
                const attachY = group.stemUp ? Math.min(...ys) : Math.max(...ys);

                const stemX = group.stemUp ? x + noteheadRadius - 1 : x - noteheadRadius + 1;
                const stemEndY = group.stemUp ? attachY - stemLength : attachY + stemLength;

                stemEndpoints.push({ x: stemX, y: stemEndY });
            }

            // Calculate beam line (from first to last stem endpoint)
            // Apply slight slope based on pitch contour
            const firstEnd = stemEndpoints[0];
            const lastEnd = stemEndpoints[stemEndpoints.length - 1];

            // Calculate slope (limited to reasonable angle)
            const dx = lastEnd.x - firstEnd.x;
            const idealSlope = dx !== 0 ? (lastEnd.y - firstEnd.y) / dx : 0;
            const maxSlope = 0.15; // Max ~15% slope
            const slope = Math.max(-maxSlope, Math.min(maxSlope, idealSlope));

            // Recalculate beam Y positions with controlled slope
            const beamStartY = firstEnd.y;
            const beamYAtX = (x: number) => beamStartY + slope * (x - firstEnd.x);

            // Draw stems to beam
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;

            for (let i = 0; i < group.notes.length; i++) {
                const note = group.notes[i];
                const x = group.xPositions[i];
                const ys = note.midi.map(m => this.midiToY(m, note.hand, height));
                const attachY = group.stemUp ? Math.min(...ys) : Math.max(...ys);

                const stemX = group.stemUp ? x + noteheadRadius - 1 : x - noteheadRadius + 1;
                const beamY = beamYAtX(stemX);

                ctx.beginPath();
                ctx.moveTo(stemX, attachY);
                ctx.lineTo(stemX, beamY);
                ctx.stroke();
            }

            // Draw primary beam (connects all notes)
            ctx.fillStyle = color;
            const firstStemX = stemEndpoints[0].x;
            const lastStemX = stemEndpoints[stemEndpoints.length - 1].x;

            ctx.beginPath();
            if (group.stemUp) {
                // Beam above stems
                ctx.moveTo(firstStemX, beamYAtX(firstStemX));
                ctx.lineTo(lastStemX, beamYAtX(lastStemX));
                ctx.lineTo(lastStemX, beamYAtX(lastStemX) + beamThickness);
                ctx.lineTo(firstStemX, beamYAtX(firstStemX) + beamThickness);
            } else {
                // Beam below stems
                ctx.moveTo(firstStemX, beamYAtX(firstStemX));
                ctx.lineTo(lastStemX, beamYAtX(lastStemX));
                ctx.lineTo(lastStemX, beamYAtX(lastStemX) - beamThickness);
                ctx.lineTo(firstStemX, beamYAtX(firstStemX) - beamThickness);
            }
            ctx.closePath();
            ctx.fill();

            // Draw secondary beams for 16th notes and shorter
            if (group.beamCount >= 2) {
                const offset = group.stemUp ? beamSpacing : -beamSpacing;
                ctx.beginPath();
                ctx.moveTo(firstStemX, beamYAtX(firstStemX) + offset);
                ctx.lineTo(lastStemX, beamYAtX(lastStemX) + offset);
                ctx.lineTo(lastStemX, beamYAtX(lastStemX) + offset + (group.stemUp ? beamThickness : -beamThickness));
                ctx.lineTo(firstStemX, beamYAtX(firstStemX) + offset + (group.stemUp ? beamThickness : -beamThickness));
                ctx.closePath();
                ctx.fill();
            }

            // Draw tertiary beams for 32nd notes
            if (group.beamCount >= 3) {
                const offset = group.stemUp ? beamSpacing * 2 : -beamSpacing * 2;
                ctx.beginPath();
                ctx.moveTo(firstStemX, beamYAtX(firstStemX) + offset);
                ctx.lineTo(lastStemX, beamYAtX(lastStemX) + offset);
                ctx.lineTo(lastStemX, beamYAtX(lastStemX) + offset + (group.stemUp ? beamThickness : -beamThickness));
                ctx.lineTo(firstStemX, beamYAtX(firstStemX) + offset + (group.stemUp ? beamThickness : -beamThickness));
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    /**
     * Draw key signature at the start of each staff
     * Shows sharps or flats based on the key
     */
    private drawKeySignature(ctx: CanvasRenderingContext2D, height: number): void {
        if (!this.keySignature) return;

        const staffHeight = height * 0.35;
        const lineSpacing = staffHeight / 5;
        const stepSpacing = lineSpacing / 2;

        // Position key signature near the left edge (after where clef would be)
        const keySignatureX = 50;
        const fontSize = 18;

        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

        // Treble staff positions for sharps (F, C, G, D, A, E, B)
        // These are line positions relative to the staff
        const trebleSharpPositions = [
            0,    // F (top line)
            1.5,  // C (space below top)
            -0.5, // G (above top line)
            1,    // D (4th line)
            2.5,  // A (2nd space)
            0.5,  // E (top space)
            2     // B (3rd line)
        ];

        // Treble staff positions for flats (B, E, A, D, G, C, F)
        const trebleFlatPositions = [
            2,    // B (3rd line)
            0.5,  // E (top space)
            2.5,  // A (2nd space)
            1,    // D (4th line)
            3,    // G (2nd line)
            1.5,  // C (3rd space)
            3.5   // F (bottom space)
        ];

        // Bass staff adjusts by +2 positions (one line down)
        const bassOffset = 2;

        const trebleTop = height * 0.1;
        const trebleMiddle = trebleTop + lineSpacing * 2; // Middle line (B4)
        const bassTop = height * 0.55;
        const bassMiddle = bassTop + lineSpacing * 2; // Middle line (D3)

        const accidentals = this.keySignature.accidentals;
        const isSharp = accidentals > 0;
        const count = Math.abs(accidentals);
        const symbol = isSharp ? '♯' : '♭';
        const positions = isSharp ? trebleSharpPositions : trebleFlatPositions;

        // Draw on treble staff
        for (let i = 0; i < count && i < positions.length; i++) {
            const x = keySignatureX + i * 12;
            const yOffset = positions[i] * stepSpacing;
            const y = trebleMiddle - yOffset;
            ctx.fillText(symbol, x, y);
        }

        // Draw on bass staff
        for (let i = 0; i < count && i < positions.length; i++) {
            const x = keySignatureX + i * 12;
            const yOffset = (positions[i] + bassOffset) * stepSpacing;
            const y = bassMiddle - yOffset;
            ctx.fillText(symbol, x, y);
        }
    }
}
