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
import { CommonModule } from '@angular/common';
import { BeamingService, BeamableNote, BeamGroupResult } from './beaming.service';
import { NoteheadRendererService } from './notehead-renderer.service';
import { StaffMathService } from './staff-math.service';

/**
 * Note data for beam visualization
 */
export interface BeamNoteInput {
    /** MIDI note number (determines Y position) */
    midi: number;
    /** Duration in beats */
    duration: number;
}

/**
 * Beam Group Component
 *
 * Standalone component for visualizing beamed notes in Storybook.
 * Shows a group of connected notes with beams.
 *
 * Used for:
 * - Storybook documentation
 * - Visual testing of beam rendering
 * - Debugging beam group calculations
 */
@Component({
    selector: 'app-beam-group',
    standalone: true,
    imports: [CommonModule],
    template: `
        <canvas
            #canvas
            [width]="width"
            [height]="height"
            class="beam-group-canvas"
        ></canvas>
    `,
    styles: [`
        .beam-group-canvas {
            background: #0f0f23;
            display: block;
        }
    `]
})
export class BeamGroupComponent implements AfterViewInit, OnChanges {
    @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

    /** Notes to beam (MIDI + duration) */
    @Input() notes: BeamNoteInput[] = [
        { midi: 67, duration: 0.5 },
        { midi: 69, duration: 0.5 }
    ];

    /** Stem direction */
    @Input() stemUp = true;

    /** Hand assignment (affects staff positioning) */
    @Input() hand: 'left' | 'right' = 'right';

    /** Which staff to display on */
    @Input() clef: 'treble' | 'bass' = 'treble';

    /** Color for notes and beams */
    @Input() color = '#ffffff';

    /** Space between notes (pixels) */
    @Input() noteSpacing = 60;

    /** Show staff lines for context */
    @Input() showStaff = true;

    /** Base stem length */
    @Input() stemLength = 50;

    /** Canvas width */
    @Input() width = 250;

    /** Canvas height */
    @Input() height = 200;

    private ctx!: CanvasRenderingContext2D;
    private beamingService = inject(BeamingService);
    private noteheadRenderer = inject(NoteheadRendererService);
    private staffMath = inject(StaffMathService);

    ngAfterViewInit(): void {
        const canvas = this.canvas.nativeElement;
        this.ctx = canvas.getContext('2d')!;
        this.render();
    }

    ngOnChanges(_changes: SimpleChanges): void {
        if (this.ctx) {
            this.render();
        }
    }

    private render(): void {
        if (!this.ctx || this.notes.length < 2) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw staff lines for context
        if (this.showStaff) {
            this.drawStaffLines();
        }

        // Convert input notes to BeamableNote format
        const beamableNotes: BeamableNote[] = this.notes.map((note, index) => ({
            midi: [note.midi],
            startPosition: index,
            durationBeats: note.duration,
            hand: this.hand,
            isRest: false
        }));

        // Create beam group
        const beamGroup: BeamGroupResult = {
            notes: beamableNotes,
            stemUp: this.stemUp,
            beamCount: this.getBeamCount(),
            noteIndices: beamableNotes.map((_, i) => i)
        };

        // Calculate X and Y positions
        const startX = 50;
        const xPositions: number[] = [];
        const yPositions: number[] = [];

        for (let i = 0; i < this.notes.length; i++) {
            xPositions.push(startX + i * this.noteSpacing);
            yPositions.push(this.staffMath.midiToY(this.notes[i].midi, this.hand, this.height));
        }

        // Draw noteheads
        for (let i = 0; i < this.notes.length; i++) {
            this.noteheadRenderer.drawNotehead(
                this.ctx,
                xPositions[i],
                yPositions[i],
                this.color,
                false,
                this.notes[i].duration
            );
        }

        // Draw beam group
        this.beamingService.drawBeamGroup(
            this.ctx,
            beamGroup,
            xPositions,
            yPositions,
            this.color,
            10, // notehead radius X
            7,  // notehead radius Y
            this.stemLength
        );
    }

    private drawStaffLines(): void {
        const layout = this.staffMath.calculateLayout(this.height);

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 1;

        const staffTop = this.clef === 'treble' ? layout.trebleTop : layout.bassTop;

        // Draw 5 staff lines
        for (let i = 0; i < 5; i++) {
            const y = staffTop + i * layout.lineSpacing;
            this.ctx.beginPath();
            this.ctx.moveTo(10, y);
            this.ctx.lineTo(this.width - 10, y);
            this.ctx.stroke();
        }
    }

    /**
     * Calculate beam count based on shortest note duration
     */
    private getBeamCount(): number {
        const minDuration = Math.min(...this.notes.map(n => n.duration));
        if (minDuration <= 0.125) return 3; // 32nd notes
        if (minDuration <= 0.25) return 2;  // 16th notes
        return 1; // 8th notes
    }
}
