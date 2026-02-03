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
import { LedgerLineRendererService } from './ledger-line-renderer.service';
import { StaffMathService } from './staff-math.service';
import { NoteheadRendererService } from './notehead-renderer.service';

/**
 * Ledger Lines Component
 *
 * Standalone component for visualizing ledger lines in Storybook.
 * Shows a note with its ledger lines on a staff context.
 *
 * Used for:
 * - Storybook documentation
 * - Visual testing of ledger line rendering
 * - Debugging note positioning
 */
@Component({
    selector: 'app-ledger-lines',
    standalone: true,
    imports: [CommonModule],
    template: `
        <canvas
            #canvas
            [width]="width"
            [height]="height"
            class="ledger-lines-canvas"
        ></canvas>
    `,
    styles: [`
        .ledger-lines-canvas {
            background: #0f0f23;
            display: block;
        }
    `]
})
export class LedgerLinesComponent implements AfterViewInit, OnChanges {
    @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

    /** MIDI note number to display */
    @Input() midiNote = 60; // Middle C

    /** Which staff to display on */
    @Input() clef: 'treble' | 'bass' = 'treble';

    /** Space between staff lines (affects scaling) */
    @Input() lineSpacing = 12;

    /** Color for ledger lines */
    @Input() lineColor = 'rgba(255, 255, 255, 0.7)';

    /** Color for the note */
    @Input() noteColor = '#4ade80';

    /** Show the note head along with ledger lines */
    @Input() showNote = true;

    /** Show staff lines for context */
    @Input() showStaff = true;

    /** Canvas width */
    @Input() width = 100;

    /** Canvas height */
    @Input() height = 200;

    private ctx!: CanvasRenderingContext2D;
    private ledgerRenderer = inject(LedgerLineRendererService);
    private staffMath = inject(StaffMathService);
    private noteheadRenderer = inject(NoteheadRendererService);

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

        const noteX = this.width / 2;
        const hand = this.clef === 'treble' ? 'right' : 'left';

        // Draw staff lines for context
        if (this.showStaff) {
            this.drawStaffLines();
        }

        // Draw ledger lines
        this.ledgerRenderer.drawLedgerLines(
            this.ctx,
            noteX,
            this.midiNote,
            hand,
            this.height,
            this.lineColor
        );

        // Draw note head
        if (this.showNote) {
            const y = this.staffMath.midiToY(this.midiNote, hand, this.height);
            this.noteheadRenderer.drawNotehead(
                this.ctx,
                noteX,
                y,
                this.noteColor,
                false,
                1 // quarter note duration
            );
        }
    }

    private drawStaffLines(): void {
        const layout = this.staffMath.calculateLayout(this.height);
        const staffHeight = layout.lineSpacing * 4;

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
     * Get info about ledger lines for display
     */
    getLedgerLineInfo(): { above: number; below: number; needsLines: boolean } {
        const hand = this.clef === 'treble' ? 'right' : 'left';
        const counts = this.ledgerRenderer.getLedgerLineCount(this.midiNote, hand);
        return {
            ...counts,
            needsLines: this.ledgerRenderer.needsLedgerLines(this.midiNote, hand)
        };
    }
}
