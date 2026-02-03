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
import { KeySignatureRendererService } from './key-signature-renderer.service';
import { StaffMathService, KeySignature } from './staff-math.service';

/**
 * Key Signature Component
 *
 * Standalone component for visualizing key signatures in Storybook.
 * Shows sharps or flats at the beginning of a staff.
 *
 * Key signature order:
 * - Sharps: F, C, G, D, A, E, B (Circle of Fifths)
 * - Flats:  B, E, A, D, G, C, F (Circle of Fourths)
 *
 * Used for:
 * - Storybook documentation
 * - Visual testing of key signature rendering
 */
@Component({
    selector: 'app-key-signature',
    standalone: true,
    imports: [CommonModule],
    template: `
        <canvas
            #canvas
            [width]="width"
            [height]="height"
            class="key-signature-canvas"
        ></canvas>
    `,
    styles: [`
        .key-signature-canvas {
            background: #0f0f23;
            display: block;
        }
    `]
})
export class KeySignatureComponent implements AfterViewInit, OnChanges {
    @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

    /** Number of sharps (positive) or flats (negative), 0 = C major */
    @Input() accidentals = 0;

    /** Show on grand staff (both treble and bass) */
    @Input() grandStaff = true;

    /** Which staff to show if not grand staff */
    @Input() clef: 'treble' | 'bass' = 'treble';

    /** Space between staff lines */
    @Input() lineSpacing = 12;

    /** Color for accidentals */
    @Input() color = 'rgba(255, 255, 255, 0.9)';

    /** Font size for symbols */
    @Input() fontSize = 18;

    /** Show staff lines for context */
    @Input() showStaff = true;

    /** Canvas width */
    @Input() width = 150;

    /** Canvas height */
    @Input() height = 200;

    private ctx!: CanvasRenderingContext2D;
    private keySignatureRenderer = inject(KeySignatureRendererService);
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
        if (!this.ctx) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw staff lines for context
        if (this.showStaff) {
            this.drawStaffLines();
        }

        // Skip if no accidentals (C major)
        if (this.accidentals === 0) return;

        // Create key signature object
        const keySignature: KeySignature = {
            root: this.getKeyRoot(),
            mode: 'major',
            accidentals: this.accidentals,
            sharpNotes: this.accidentals > 0 ? this.getSharpNotes() : [],
            flatNotes: this.accidentals < 0 ? this.getFlatNotes() : []
        };

        // Draw key signature
        const startX = 20;

        if (this.grandStaff) {
            this.keySignatureRenderer.drawKeySignature(
                this.ctx,
                startX,
                keySignature,
                this.height,
                this.color,
                this.fontSize
            );
        } else {
            const layout = this.staffMath.calculateLayout(this.height);
            const staffTop = this.clef === 'treble' ? layout.trebleTop : layout.bassTop;

            this.keySignatureRenderer.drawKeySignatureOnStaff(
                this.ctx,
                startX,
                keySignature,
                this.clef,
                staffTop,
                layout.lineSpacing,
                this.color,
                this.fontSize
            );
        }
    }

    private drawStaffLines(): void {
        const layout = this.staffMath.calculateLayout(this.height);

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 1;

        if (this.grandStaff) {
            // Draw treble staff
            for (let i = 0; i < 5; i++) {
                const y = layout.trebleTop + i * layout.lineSpacing;
                this.drawLine(10, y, this.width - 10, y);
            }

            // Draw bass staff
            for (let i = 0; i < 5; i++) {
                const y = layout.bassTop + i * layout.lineSpacing;
                this.drawLine(10, y, this.width - 10, y);
            }
        } else {
            const staffTop = this.clef === 'treble' ? layout.trebleTop : layout.bassTop;

            for (let i = 0; i < 5; i++) {
                const y = staffTop + i * layout.lineSpacing;
                this.drawLine(10, y, this.width - 10, y);
            }
        }
    }

    private drawLine(x1: number, y1: number, x2: number, y2: number): void {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    /**
     * Get the root note name for display
     */
    private getKeyRoot(): string {
        const sharpKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
        const flatKeys = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];

        if (this.accidentals >= 0 && this.accidentals < sharpKeys.length) {
            return sharpKeys[this.accidentals];
        } else if (this.accidentals < 0 && -this.accidentals < flatKeys.length) {
            return flatKeys[-this.accidentals];
        }
        return 'C';
    }

    /**
     * Get MIDI % 12 values for sharp notes
     */
    private getSharpNotes(): number[] {
        // Sharp order: F#, C#, G#, D#, A#, E#, B#
        const sharpPitches = [6, 1, 8, 3, 10, 5, 0];
        return sharpPitches.slice(0, Math.min(this.accidentals, 7));
    }

    /**
     * Get MIDI % 12 values for flat notes
     */
    private getFlatNotes(): number[] {
        // Flat order: Bb, Eb, Ab, Db, Gb, Cb, Fb
        const flatPitches = [10, 3, 8, 1, 6, 11, 4];
        return flatPitches.slice(0, Math.min(-this.accidentals, 7));
    }

    /**
     * Get key name for display
     */
    getKeyName(): string {
        return this.keySignatureRenderer.getKeyName(this.accidentals);
    }
}
