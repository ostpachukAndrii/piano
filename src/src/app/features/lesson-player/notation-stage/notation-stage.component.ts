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
    inject,
} from '@angular/core';
import { BeamGroup, KeySignature, NoteState, PracticeLoopRange, ScrollingNote, TimingFeedback, WrongNoteEvent } from '../models/scrolling-note.model';
import { ClefRendererService } from './clef-renderer.service';
import { NoteheadRendererService } from './notehead-renderer.service';
import { RestRendererService } from './rest-renderer.service';
import { AccidentalRendererService } from './accidental-renderer.service';
import { StaffRendererService } from './staff-renderer.service';
import { TimeSignatureRendererService } from './time-signature-renderer.service';
import { StaffMathService } from './staff-math.service';
import { BeamingService, BeamableNote, BeamGroupResult } from './beaming.service';
import { LedgerLineRendererService } from './ledger-line-renderer.service';
import { BarLineRendererService } from './bar-line-renderer.service';
import { KeySignatureRendererService } from './key-signature-renderer.service';

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
            background: #8B5CF6;
            box-shadow: 0 0 10px #8B5CF6, 0 0 20px #8B5CF6;
            z-index: 10;
            pointer-events: none;
        }
    `]
})
export class NotationStageComponent implements AfterViewInit, OnChanges {
    @ViewChild('stageCanvas') canvas!: ElementRef<HTMLCanvasElement>;

    private clefRenderer = inject(ClefRendererService);
    private noteheadRenderer = inject(NoteheadRendererService);
    private restRenderer = inject(RestRendererService);
    private accidentalRenderer = inject(AccidentalRendererService);
    private staffRenderer = inject(StaffRendererService);
    private timeSignatureRenderer = inject(TimeSignatureRendererService);
    private staffMath = inject(StaffMathService);
    private beamingService = inject(BeamingService);
    private ledgerLineRenderer = inject(LedgerLineRendererService);
    private barLineRenderer = inject(BarLineRendererService);
    private keySignatureRenderer = inject(KeySignatureRendererService);

    // Inputs
    @Input() scrollingNotes: ScrollingNote[] = [];
    @Input() currentBeat = 0;
    @Input() playheadX = 300;
    @Input() stageWidth = 1200;
    @Input() stageHeight = 400;
    @Input() beatsPerMeasure = 4; // For bar lines
    @Input() timeSignature: string | null = null; // e.g., "4/4", "3/4", "6/8"

    // Computed: playhead position as percentage (for CSS scaling)
    get playheadPercent(): number {
        return (this.playheadX / this.stageWidth) * 100;
    }
    @Input() totalBeats = 0; // Total beats in the piece
    @Input() wrongNoteEvents: WrongNoteEvent[] = []; // Wrong notes to display
    @Input() keySignature: KeySignature | null = null; // Key signature for accidentals
    @Input() loopRange: PracticeLoopRange | null = null; // Practice loop range for visual overlay
    @Input() currentActiveBeat: number | null = null; // Beat of the latest active note group
    @Input() autoPlayPatternKeys: Set<string> = new Set(); // Auto-played LH patterns (greyed out)

    // Canvas context
    private ctx: CanvasRenderingContext2D | null = null;

    // Track which notes are part of beam groups (to avoid double-rendering stems)
    private beamedNoteIds = new Set<string>();

    // Rendering constants
    // Increased from 80 to 120 for better spacing between beamed notes
    readonly PIXELS_PER_BEAT = 120;
    readonly NOTE_BAR_OFFSET = 20; // Offset notes from bar lines (in pixels)

    // State colors
    private readonly STATE_COLORS: Record<NoteState, string> = {
        'upcoming': '#ffffff',
        'active': '#8B5CF6',
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

        // Draw clefs at the start of each staff
        this.drawClefs(ctx, height);

        // Draw time signature after clef
        this.drawTimeSignature(ctx, height);

        // Draw key signature at the start of the staff
        this.drawKeySignature(ctx, height);

        // Draw bar lines
        this.drawBarLines(ctx, height);

        // Draw loop range overlay (before notes so it appears behind)
        this.drawLoopRangeOverlay(ctx, height);

        // Clear beamed notes tracking for this frame
        this.beamedNoteIds.clear();

        // Build beam groups for short notes
        const beamGroups = this.buildBeamGroups();

        // Draw beams first (behind notes)
        this.drawBeamGroups(ctx, beamGroups, height);

        // Draw notes
        this.drawNotes(ctx, height, beamGroups);

        // Draw tie curves (on top of notes)
        this.drawTies(ctx, height);

        // Draw wrong note indicators
        this.drawWrongNotes(ctx, height);

        // Draw playhead glow area
        this.drawPlayheadGlow(ctx, height);
    }

    /**
     * Draw the treble and bass staff lines
     */
    drawStaffLines(ctx: CanvasRenderingContext2D, height: number): void {
        const staffHeight = height * StaffMathService.STAFF_HEIGHT_RATIO;
        const lineSpacing = staffHeight / 5;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.5;

        // Treble staff (top)
        const trebleTop = height * StaffMathService.TREBLE_TOP_RATIO;
        for (let i = 0; i < 5; i++) {
            const y = trebleTop + i * lineSpacing;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.stageWidth, y);
            ctx.stroke();
        }

        // Bass staff (bottom)
        const bassTop = height * StaffMathService.BASS_TOP_RATIO;
        for (let i = 0; i < 5; i++) {
            const y = bassTop + i * lineSpacing;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.stageWidth, y);
            ctx.stroke();
        }
    }

    /**
     * Draw treble and bass clefs at the start of each staff
     *
     * Uses ClefRendererService for consistent rendering with ClefComponent.
     *
     * Staff lines (numbered from top):
     * - Line 0 (top):    trebleTop + 0*L  ->  F5 (treble) / A3 (bass)
     * - Line 1:          trebleTop + 1*L  ->  D5 (treble) / F3 (bass) ← BASS ANCHOR
     * - Line 2 (middle): trebleTop + 2*L  ->  B4 (treble) / D3 (bass)
     * - Line 3:          trebleTop + 3*L  ->  G4 (treble) / B2 (bass) ← TREBLE ANCHOR
     * - Line 4 (bottom): trebleTop + 4*L  ->  E4 (treble) / G2 (bass)
     *
     * @see ClefComponent for standalone clef rendering
     * @see ClefRendererService for shared rendering logic
     */
    drawClefs(ctx: CanvasRenderingContext2D, height: number): void {
        const staffHeight = height * StaffMathService.STAFF_HEIGHT_RATIO;
        const L = staffHeight / 5; // Line spacing

        // Calculate staff line positions (from top to bottom)
        const trebleTop = height * StaffMathService.TREBLE_TOP_RATIO;
        const bassTop = height * StaffMathService.BASS_TOP_RATIO;

        // TREBLE CLEF - G4 line (Line 3)
        const trebleG4Line = trebleTop + (3 * L);
        const trebleX = 30;
        this.clefRenderer.drawTrebleClef(ctx, trebleX, trebleG4Line, L);

        // BASS CLEF - F3 line (Line 1)
        const bassF3Line = bassTop + (1 * L);
        const bassX = 30;
        this.clefRenderer.drawBassClef(ctx, bassX, bassF3Line, L);
    }

    /**
     * Draw time signature after clef on both staves
     */
    drawTimeSignature(ctx: CanvasRenderingContext2D, height: number): void {
        if (!this.timeSignature) return;

        // Parse time signature (e.g., "4/4" -> numerator: 4, denominator: 4)
        const parts = this.timeSignature.split('/');
        if (parts.length !== 2) return;

        const numerator = parseInt(parts[0], 10);
        const denominator = parseInt(parts[1], 10);

        if (isNaN(numerator) || isNaN(denominator)) return;

        const staffHeight = height * StaffMathService.STAFF_HEIGHT_RATIO;
        const L = staffHeight / 5; // Line spacing

        const trebleTop = height * StaffMathService.TREBLE_TOP_RATIO;
        const bassTop = height * StaffMathService.BASS_TOP_RATIO;

        // Position: after clef (needs extra space for larger 4.5x bass clef)
        const timeSignatureX = 110;

        // Draw on treble staff
        this.timeSignatureRenderer.drawTimeSignature(
            ctx,
            timeSignatureX,
            trebleTop,
            L,
            numerator,
            denominator,
            '#ffffff'
        );

        // Draw on bass staff
        this.timeSignatureRenderer.drawTimeSignature(
            ctx,
            timeSignatureX,
            bassTop,
            L,
            numerator,
            denominator,
            '#ffffff'
        );
    }

    /**
     * Draw bar lines at measure boundaries
     * Delegates to BarLineRendererService for consistent rendering
     */
    drawBarLines(ctx: CanvasRenderingContext2D, height: number): void {
        this.barLineRenderer.drawScrollingBarLines(
            ctx,
            height,
            this.currentBeat,
            this.beatsPerMeasure,
            this.stageWidth,
            this.playheadX,
            this.PIXELS_PER_BEAT,
            'rgba(255, 255, 255, 0.4)'
        );
    }

    /**
     * Check if a beat position is on a bar line
     * Delegates to BarLineRendererService
     */
    isOnBarLine(beat: number): boolean {
        return this.barLineRenderer.isOnBarLine(beat, this.beatsPerMeasure);
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

            // For beamed notes, use the pre-calculated X position from the beam group.
            // For other notes: only the CURRENT active group renders at the playhead.
            // Older active notes (from overlapping hit windows) use their natural position
            // so the cursor shows only one note group at a time.
            const isCurrentActive = note.state === 'active' &&
                this.currentActiveBeat !== null &&
                Math.abs(note.startBeat - this.currentActiveBeat) < 0.01;
            let x: number;
            if (isBeamed && beamXPositions.has(noteId)) {
                x = beamXPositions.get(noteId)!;
            } else {
                x = isCurrentActive
                    ? this.playheadX  // Current active group: at playhead line
                    : this.getNoteX(note.startBeat); // Others: at their natural position
            }

            // Skip notes far off screen
            if (x < -50 || x > this.stageWidth + 50) continue;

            // Determine color based on state
            const color = this.STATE_COLORS[note.state];

            // Check if this is an auto-played left-hand note (greyed out)
            const isAutoPlay = note.hand === 'left' && !note.isRest &&
                this.autoPlayPatternKeys.size > 0 &&
                this.autoPlayPatternKeys.has([...note.midi].sort((a, b) => a - b).join(','));
            if (isAutoPlay) {
                ctx.globalAlpha = 0.2;
            }

            // Handle rests separately from notes
            if (note.isRest) {
                this.drawRest(ctx, x, note.hand, note.durationBeats, height, color);
                continue;
            }

            // Calculate Y positions for noteheads
            const ys = note.midi.map(midi => this.midiToY(midi, note.hand, height));
            const avgY = ys.reduce((a, b) => a + b, 0) / ys.length;
            // Stem direction based on hand (traditional notation):
            // - Right hand: stems UP (toward top of staff)
            // - Left hand: stems DOWN (toward bottom of staff)
            const stemUp = note.hand === 'right';

            // Draw ledger lines first (behind everything)
            for (const midi of note.midi) {
                this.drawLedgerLines(ctx, x, midi, note.hand, height);
            }

            // Draw stem BEFORE noteheads (so noteheads appear on top)
            // Skip if note is beamed (stems are drawn with the beam group)
            if (note.durationBeats < 4 && !isBeamed) {
                // For chords, the stem must connect ALL noteheads with a single line.
                // Start from the notehead FARTHEST from the beam/flag end so the stem
                // passes through every notehead in the chord stack.
                const stemY = stemUp ? Math.max(...ys) : Math.min(...ys);
                // Extra stem length to cover the chord span (0 for single notes)
                const chordSpan = note.midi.length > 1 ? Math.max(...ys) - Math.min(...ys) : 0;
                this.noteheadRenderer.drawStem(ctx, x, stemY, color, stemUp, note.durationBeats, 35 + chordSpan);
            }

            // Draw accidentals and noteheads on top
            for (const midi of note.midi) {
                const y = this.midiToY(midi, note.hand, height);
                // Draw accidental (sharp/flat) for black keys
                this.drawAccidental(ctx, x, y, midi, color);
                this.drawNoteHead(ctx, x, y, color, note.state, note.durationBeats);
            }

            // Draw duration tail (for scrolling visualization)
            // Use beatToX for end position (no bar line offset for duration end)
            const endX = this.beatToX(note.startBeat + note.durationBeats);
            if (endX > x && note.state !== 'missed') {
                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
                ctx.globalAlpha = isAutoPlay ? 0.1 : 0.3;
                for (const midi of note.midi) {
                    const y = this.midiToY(midi, note.hand, height);
                    ctx.beginPath();
                    ctx.moveTo(x + 10, y);
                    ctx.lineTo(Math.min(endX, this.stageWidth), y);
                    ctx.stroke();
                }
                ctx.globalAlpha = isAutoPlay ? 0.2 : 1;
            }

            // Draw timing feedback indicators
            if (note.timingFeedback && note.timingFeedback !== 'perfect') {
                this.drawTimingFeedback(ctx, x, avgY, note);
            }

            // Draw early release indicator on the duration tail
            if (note.releasedEarly && note.state === 'hit') {
                this.drawEarlyReleaseIndicator(ctx, note, height);
            }

            // Draw staccato dot
            if (note.staccato) {
                this.drawStaccatoDot(ctx, x, note, height, color);
            }

            // Draw augmentation dot
            if (note.dot) {
                this.drawAugmentationDot(ctx, x, note, height, color);
            }

            // Reset alpha after drawing auto-play notes
            if (isAutoPlay) {
                ctx.globalAlpha = 1;
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
     * Delegates to LedgerLineRendererService for consistent rendering
     */
    drawLedgerLines(
        ctx: CanvasRenderingContext2D,
        x: number,
        midi: number,
        hand: 'left' | 'right',
        height: number
    ): void {
        this.ledgerLineRenderer.drawLedgerLines(ctx, x, midi, hand, height);
    }

    /**
     * Draw a single notehead using NoteheadRendererService
     */
    drawNoteHead(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        color: string,
        state: NoteState,
        duration: number
    ): void {
        this.noteheadRenderer.drawNotehead(
            ctx,
            x,
            y,
            color,
            state === 'active',
            duration,
            state === 'hit'
        );
    }

    /**
     * Draw a rest symbol based on duration using RestRendererService
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
        const staffHeight = height * StaffMathService.STAFF_HEIGHT_RATIO;
        const lineSpacing = staffHeight / 5;

        // Calculate staff positions
        const trebleTop = height * StaffMathService.TREBLE_TOP_RATIO;
        const bassTop = height * StaffMathService.BASS_TOP_RATIO;

        // Line positions (from top to bottom: 0, 1, 2, 3, 4)
        const staffTop = (hand === 'right') ? trebleTop : bassTop;

        this.restRenderer.drawRest(ctx, x, staffTop, lineSpacing, duration, color);
    }

    /**
     * Draw accidental (sharp/flat) symbol for notes using AccidentalRendererService
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
        this.accidentalRenderer.drawAccidental(ctx, x, y, midi, color, this.keySignature);
    }

    /**
     * Draw glow effect around the playhead
     */
    drawPlayheadGlow(ctx: CanvasRenderingContext2D, height: number): void {
        const gradient = ctx.createLinearGradient(
            this.playheadX - 30, 0,
            this.playheadX + 30, 0
        );
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0)');
        gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.1)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(this.playheadX - 30, 0, 60, height);
    }

    /**
     * Draw a subtle overlay highlighting the loop range
     * Called before drawing notes so it appears behind them
     */
    drawLoopRangeOverlay(ctx: CanvasRenderingContext2D, height: number): void {
        if (!this.loopRange) return;

        const startBeat = (this.loopRange.startMeasure - 1) * this.beatsPerMeasure;
        const endBeat = this.loopRange.endMeasure * this.beatsPerMeasure;

        const startX = this.beatToX(startBeat);
        const endX = this.beatToX(endBeat);

        // Only draw if visible on screen
        if (endX < 0 || startX > this.stageWidth) return;

        const visibleStartX = Math.max(0, startX);
        const visibleEndX = Math.min(this.stageWidth, endX);

        ctx.save();

        // Draw subtle cyan tint over the loop region
        ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
        ctx.fillRect(visibleStartX, 0, visibleEndX - visibleStartX, height);

        // Draw loop boundary markers
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        // Start boundary
        if (startX >= 0 && startX <= this.stageWidth) {
            ctx.beginPath();
            ctx.moveTo(startX, 0);
            ctx.lineTo(startX, height);
            ctx.stroke();
        }

        // End boundary
        if (endX >= 0 && endX <= this.stageWidth) {
            ctx.beginPath();
            ctx.moveTo(endX, 0);
            ctx.lineTo(endX, height);
            ctx.stroke();
        }

        ctx.restore();
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
     * Delegates to shared StaffMathService for consistent positioning across views
     */
    midiToDiatonicStep(midi: number): number {
        return this.staffMath.midiToDiatonicStep(midi, this.keySignature);
    }

    /**
     * Convert MIDI note number to Y coordinate
     * Handles both treble and bass clef positioning
     * Uses diatonic steps for proper staff placement
     * Delegates to shared StaffMathService for consistent positioning across views
     *
     * IMPORTANT: Hand assignment takes priority over MIDI range
     * - right hand = treble staff (top)
     * - left hand = bass staff (bottom)
     */
    midiToY(midi: number, hand: 'left' | 'right', height: number): number {
        return this.staffMath.midiToY(midi, hand, height, this.keySignature);
    }

    /**
     * Get color for a note state
     */
    getStateColor(state: NoteState): string {
        return this.STATE_COLORS[state];
    }

    /**
     * Check if a duration should be rendered as hollow notehead
     * Delegates to shared StaffMathService for consistency
     */
    isHollowNote(duration: number): boolean {
        return this.staffMath.isHollowNote(duration);
    }

    /**
     * Draw wrong note indicators on the stage
     * Shows small red X marks on the staff at the correct position
     * Stays visible until lesson restart
     */
    drawWrongNotes(ctx: CanvasRenderingContext2D, height: number): void {
        if (!this.wrongNoteEvents || this.wrongNoteEvents.length === 0) return;

        const staffHeight = height * StaffMathService.STAFF_HEIGHT_RATIO;
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
     * Delegates to LedgerLineRendererService
     */
    private drawLedgerLinesForWrongNote(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        hand: 'left' | 'right',
        height: number,
        _lineSpacing: number,
        alpha: number
    ): void {
        this.ledgerLineRenderer.drawLedgerLinesForPosition(
            ctx,
            x,
            y,
            hand,
            height,
            'rgb(239, 68, 68)',
            alpha * 0.7
        );
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
     * Build beam groups from notes using shared BeamingService
     * Ensures consistent beaming logic between scrolling and classic views
     *
     * Beaming rules (from BeamingService):
     * - Right hand: stems always UP (toward top of staff)
     * - Left hand: stems always DOWN (toward bottom of staff)
     * - Notes are grouped by measure and hand
     * - Maximum 4 notes per beam group (traditional beaming)
     */
    private buildBeamGroups(): BeamGroup[] {
        const groups: BeamGroup[] = [];
        const height = this.stageHeight;

        // Convert ScrollingNote[] to BeamableNote[] for shared service
        const beamableNotes: BeamableNote[] = this.scrollingNotes.map((note, index) => ({
            midi: note.midi,
            startPosition: note.startBeat,
            durationBeats: note.durationBeats,
            hand: note.hand,
            isRest: note.isRest,
            originalNote: { note, index } // Track original note and index
        }));

        // Use shared BeamingService to build beam groups
        const beamGroupResults = this.beamingService.buildBeamGroups(beamableNotes, this.beatsPerMeasure);

        // Convert BeamGroupResult[] to BeamGroup[] with X/Y positions
        for (const result of beamGroupResults) {
            const notes: ScrollingNote[] = [];
            const xPositions: number[] = [];
            const yPositions: number[] = [];

            for (const beamNote of result.notes) {
                const original = beamNote.originalNote as { note: ScrollingNote; index: number };
                if (!original) continue;

                const note = original.note;
                notes.push(note);

                // Calculate X position — only the current active group at the playhead
                const isCurrentActive = note.state === 'active' &&
                    this.currentActiveBeat !== null &&
                    Math.abs(note.startBeat - this.currentActiveBeat) < 0.01;
                const x = isCurrentActive
                    ? this.playheadX
                    : this.getNoteX(note.startBeat);
                xPositions.push(x);

                // Calculate Y position for beam attachment.
                // For chords, use the notehead FARTHEST from the beam so the stem
                // passes through all noteheads in the chord stack.
                const ys = note.midi.map(m => this.midiToY(m, note.hand, height));
                const stemUp = note.hand === 'right';
                const beamY = note.midi.length > 1
                    ? (stemUp ? Math.max(...ys) : Math.min(...ys))  // Farthest from beam
                    : ys[0];
                yPositions.push(beamY);

                // Mark note as beamed
                this.beamedNoteIds.add(this.getNoteId(note));
            }

            if (notes.length >= 2) {
                groups.push({
                    notes,
                    stemUp: result.stemUp,
                    xPositions,
                    yPositions,
                    beamCount: result.beamCount
                });
            }
        }

        return groups;
    }

    /**
     * Draw beam groups (beams and connected stems)
     * Uses shared BeamingService for consistent rendering with classic view
     */
    private drawBeamGroups(
        ctx: CanvasRenderingContext2D,
        beamGroups: BeamGroup[],
        height: number
    ): void {
        const noteheadRadiusX = 10; // Horizontal radius
        const noteheadRadiusY = 7;  // Vertical radius (notehead is an ellipse)

        for (const group of beamGroups) {
            if (group.notes.length < 2) continue;

            // Skip if all notes are off screen
            const allOffScreen = group.xPositions.every(
                x => x < -50 || x > this.stageWidth + 50
            );
            if (allOffScreen) continue;

            // Get color from first note (could vary, but typically same state in a beam)
            const color = this.STATE_COLORS[group.notes[0].state];

            // Convert BeamGroup to BeamGroupResult format for shared service
            const beamGroupResult: BeamGroupResult = {
                notes: group.notes.map(n => ({
                    midi: n.midi,
                    startPosition: n.startBeat,
                    durationBeats: n.durationBeats,
                    hand: n.hand,
                    isRest: n.isRest,
                    originalNote: n
                })),
                stemUp: group.stemUp,
                beamCount: group.beamCount,
                noteIndices: group.notes.map((_, i) => i) // Not used for drawing
            };

            // Use shared BeamingService for consistent beam rendering
            this.beamingService.drawBeamGroup(
                ctx,
                beamGroupResult,
                group.xPositions,
                group.yPositions,
                color,
                noteheadRadiusX,
                noteheadRadiusY
            );
        }
    }

    /**
     * Draw key signature at the start of each staff
     * Delegates to KeySignatureRendererService for consistent rendering
     */
    private drawKeySignature(ctx: CanvasRenderingContext2D, height: number): void {
        if (!this.keySignature) return;

        // Position key signature after the clef (clef at X=30, ends ~X=55)
        // Time signature is at X=110, so key signature must fit in between
        const keySignatureX = 58;

        this.keySignatureRenderer.drawKeySignature(
            ctx,
            keySignatureX,
            this.keySignature,
            height,
            'rgba(255, 255, 255, 0.9)',
            18
        );
    }

    /**
     * Draw tie curves connecting tied notes.
     * A tie connects a note with tieStart=true to the next note with tieStop=true
     * that shares the same MIDI pitch and hand.
     */
    private drawTies(ctx: CanvasRenderingContext2D, height: number): void {
        const noteheadRadiusX = 10;

        for (let i = 0; i < this.scrollingNotes.length; i++) {
            const startNote = this.scrollingNotes[i];
            if (!startNote.tieStart || startNote.isRest) continue;

            // Find the matching tie-stop note
            for (let j = i + 1; j < this.scrollingNotes.length; j++) {
                const endNote = this.scrollingNotes[j];
                if (!endNote.tieStop || endNote.isRest) continue;
                if (endNote.hand !== startNote.hand) continue;

                // Check for shared MIDI pitches
                const sharedMidi = startNote.midi.filter(m => endNote.midi.includes(m));
                if (sharedMidi.length === 0) continue;

                // Get X positions
                const x1 = this.getNoteX(startNote.startBeat);
                const x2 = this.getNoteX(endNote.startBeat);

                // Skip if both off screen
                if ((x1 > this.stageWidth + 50 && x2 > this.stageWidth + 50) ||
                    (x1 < -50 && x2 < -50)) {
                    break;
                }

                // For chords: determine curve direction per note
                // - Top note of chord: curve UP (-1)
                // - Bottom note of chord: curve DOWN (+1)
                // For single notes: curve opposite the stem
                const isChord = startNote.midi.length > 1;
                const sortedMidi = [...startNote.midi].sort((a, b) => a - b);
                const maxMidi = sortedMidi[sortedMidi.length - 1];
                const minMidi = sortedMidi[0];

                // Draw a tie curve for each shared pitch
                for (const midi of sharedMidi) {
                    const y = this.midiToY(midi, startNote.hand, height);

                    let curveDir: number;
                    if (isChord) {
                        // Chord: top note curves up, bottom note curves down
                        if (midi === maxMidi) {
                            curveDir = -1; // Up (negative Y)
                        } else if (midi === minMidi) {
                            curveDir = 1;  // Down (positive Y)
                        } else {
                            // Middle note: curve opposite stem
                            curveDir = startNote.hand === 'right' ? 1 : -1;
                        }
                    } else {
                        // Single note: curve opposite the stem
                        // Right hand (stem up) → curve below (+1)
                        // Left hand (stem down) → curve above (-1)
                        curveDir = startNote.hand === 'right' ? 1 : -1;
                    }

                    const tieStartX = x1 + noteheadRadiusX;
                    const tieEndX = x2 - noteheadRadiusX;
                    const midX = (tieStartX + tieEndX) / 2;
                    const controlY = y + (curveDir * 20);

                    const color = this.STATE_COLORS[startNote.state] || '#ffffff';

                    ctx.save();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.globalAlpha = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(tieStartX, y + curveDir * 2);
                    ctx.quadraticCurveTo(midX, controlY, tieEndX, y + curveDir * 2);
                    ctx.stroke();
                    ctx.restore();
                }

                break; // Only connect to the first matching tie-stop
            }
        }
    }

    /**
     * Draw augmentation dot to the right of the notehead.
     *
     * Engraving rules:
     * - The Space Rule: if the notehead sits in a space, the dot stays in that space.
     * - The Line Rule: if the notehead sits ON a staff line, the dot is nudged into
     *   the space immediately ABOVE the line (higher pitch direction = lower Y).
     * - Horizontal gap: the dot is placed to the right of the notehead (past any flag).
     * - Chord stacking: dots for adjacent chord notes are distributed into separate spaces.
     */
    private drawAugmentationDot(
        ctx: CanvasRenderingContext2D,
        x: number,
        note: ScrollingNote,
        height: number,
        color: string
    ): void {
        const noteheadRadiusX = 10;
        const layout = this.staffMath.calculateLayout(height);
        const staffTop = note.hand === 'right'
            ? height * StaffMathService.TREBLE_TOP_RATIO
            : height * StaffMathService.BASS_TOP_RATIO;

        // Horizontal position: to the right of the notehead
        // For flagged notes (8th, 16th), push further right to avoid flag overlap
        let dotX = x + noteheadRadiusX + 8;
        if (note.durationBeats <= 0.5) {
            dotX += 6; // Extra gap for flagged notes
        }

        for (const midi of note.midi) {
            const y = this.midiToY(midi, note.hand, height);

            // Apply the Line Rule: check if notehead is on a staff line
            let dotY = y;
            for (let line = 0; line < 5; line++) {
                const lineY = staffTop + line * layout.lineSpacing;
                if (Math.abs(y - lineY) < 3) {
                    // Notehead is on a line — nudge dot into the space ABOVE (lower Y)
                    dotY = lineY - layout.lineSpacing / 2;
                    break;
                }
            }

            ctx.save();
            ctx.globalAlpha = 1;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 3, 0, Math.PI * 2); // 3px radius
            ctx.fill();
            ctx.restore();
        }
    }

    /**
     * Draw staccato dot near the notehead.
     * Position: opposite side of the stem.
     * Stem up (right hand) → dot below notehead.
     * Stem down (left hand) → dot above notehead.
     */
    private drawStaccatoDot(
        ctx: CanvasRenderingContext2D,
        x: number,
        note: ScrollingNote,
        height: number,
        color: string
    ): void {
        const stemUp = note.hand === 'right';
        const layout = this.staffMath.calculateLayout(height);

        for (const midi of note.midi) {
            const y = this.midiToY(midi, note.hand, height);

            // Dot offset: 16px from notehead center, opposite side of stem
            const dotOffset = stemUp ? 16 : -16;
            let dotY = y + dotOffset;

            // Staff line avoidance: nudge if dot is too close to a staff line
            const staffTop = note.hand === 'right'
                ? height * StaffMathService.TREBLE_TOP_RATIO
                : height * StaffMathService.BASS_TOP_RATIO;

            for (let line = 0; line < 5; line++) {
                const lineY = staffTop + line * layout.lineSpacing;
                if (Math.abs(dotY - lineY) < 4) {
                    dotY += stemUp ? 5 : -5;
                    break;
                }
            }

            ctx.save();
            ctx.globalAlpha = 1; // Ensure full opacity for staccato dots
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, dotY, 4, 0, Math.PI * 2); // 4px radius dot
            ctx.fill();
            ctx.restore();
        }
    }
}
