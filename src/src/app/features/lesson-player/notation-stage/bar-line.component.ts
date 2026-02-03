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
import { BarLineRendererService } from './bar-line-renderer.service';
import { StaffMathService } from './staff-math.service';

/**
 * Bar Line Component
 *
 * Standalone component for visualizing bar lines in Storybook.
 * Shows different types of bar lines on a staff context.
 *
 * Bar line types:
 * - single: Standard measure separator
 * - double: Used at section endings or key/time changes
 * - final: Thick + thin line at the end of a piece
 *
 * Used for:
 * - Storybook documentation
 * - Visual testing of bar line rendering
 */
@Component({
    selector: 'app-bar-line',
    standalone: true,
    imports: [CommonModule],
    template: `
        <canvas
            #canvas
            [width]="width"
            [height]="height"
            class="bar-line-canvas"
        ></canvas>
    `,
    styles: [`
        .bar-line-canvas {
            background: #0f0f23;
            display: block;
        }
    `]
})
export class BarLineComponent implements AfterViewInit, OnChanges {
    @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

    /** Type of bar line to render */
    @Input() type: 'single' | 'double' | 'final' = 'single';

    /** Show on grand staff (both treble and bass) */
    @Input() grandStaff = true;

    /** Which staff to show if not grand staff */
    @Input() clef: 'treble' | 'bass' = 'treble';

    /** Space between staff lines */
    @Input() lineSpacing = 12;

    /** Color for bar line */
    @Input() color = 'rgba(255, 255, 255, 0.8)';

    /** Show staff lines for context */
    @Input() showStaff = true;

    /** Canvas width */
    @Input() width = 60;

    /** Canvas height */
    @Input() height = 200;

    private ctx!: CanvasRenderingContext2D;
    private barLineRenderer = inject(BarLineRendererService);
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

        // Draw bar line
        const barX = this.width / 2;

        if (this.grandStaff) {
            this.barLineRenderer.drawGrandStaffBarLine(
                this.ctx,
                barX,
                this.height,
                this.type,
                this.color
            );
        } else {
            const layout = this.staffMath.calculateLayout(this.height);
            const staffTop = this.clef === 'treble' ? layout.trebleTop : layout.bassTop;
            const staffHeight = layout.lineSpacing * 4;

            this.barLineRenderer.drawBarLine(
                this.ctx,
                barX,
                staffTop,
                staffHeight,
                this.type,
                this.color
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
}
