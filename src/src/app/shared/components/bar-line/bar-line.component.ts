import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

/**
 * Bar line types
 * - single: Regular bar line between measures
 * - double: Two thin lines (section marker)
 * - end: Thin + thick line (end of piece)
 * - repeat-start: Thick + thin + dots (repeat start)
 * - repeat-end: Dots + thin + thick (repeat end)
 */
export type BarLineType = 'single' | 'double' | 'end' | 'repeat-start' | 'repeat-end';

/**
 * Bar Line Component
 *
 * Renders a musical bar line (measure separator) with proper visual representation.
 * Uses SVG for scalable, crisp rendering.
 *
 * Visual rules:
 * - Single: One vertical line
 * - Double: Two thin vertical lines
 * - End: Thin line + thick line
 * - Repeat start: Thick line + thin line + two dots
 * - Repeat end: Two dots + thin line + thick line
 */
@Component({
    selector: 'app-bar-line',
    standalone: true,
    imports: [CommonModule],
    template: `
        <svg
            [attr.width]="svgWidth"
            [attr.height]="svgHeight"
            [attr.viewBox]="viewBox"
            class="bar-line-svg"
            [class.single]="type === 'single'"
            [class.double]="type === 'double'"
            [class.end]="type === 'end'"
            [class.repeat-start]="type === 'repeat-start'"
            [class.repeat-end]="type === 'repeat-end'">

            <!-- Single bar line -->
            @if (type === 'single') {
                <line
                    [attr.x1]="lineX"
                    [attr.y1]="lineY1"
                    [attr.x2]="lineX"
                    [attr.y2]="lineY2"
                    [attr.stroke]="color"
                    [attr.stroke-width]="thinLineWidth"
                    class="bar-line thin-line"
                />
            }

            <!-- Double bar line -->
            @if (type === 'double') {
                <line
                    [attr.x1]="doubleLineX1"
                    [attr.y1]="lineY1"
                    [attr.x2]="doubleLineX1"
                    [attr.y2]="lineY2"
                    [attr.stroke]="color"
                    [attr.stroke-width]="thinLineWidth"
                    class="bar-line thin-line line-1"
                />
                <line
                    [attr.x1]="doubleLineX2"
                    [attr.y1]="lineY1"
                    [attr.x2]="doubleLineX2"
                    [attr.y2]="lineY2"
                    [attr.stroke]="color"
                    [attr.stroke-width]="thinLineWidth"
                    class="bar-line thin-line line-2"
                />
            }

            <!-- End bar line (thin + thick) -->
            @if (type === 'end') {
                <line
                    [attr.x1]="endThinLineX"
                    [attr.y1]="lineY1"
                    [attr.x2]="endThinLineX"
                    [attr.y2]="lineY2"
                    [attr.stroke]="color"
                    [attr.stroke-width]="thinLineWidth"
                    class="bar-line thin-line"
                />
                <line
                    [attr.x1]="endThickLineX"
                    [attr.y1]="lineY1"
                    [attr.x2]="endThickLineX"
                    [attr.y2]="lineY2"
                    [attr.stroke]="color"
                    [attr.stroke-width]="thickLineWidth"
                    class="bar-line thick-line"
                />
            }

            <!-- Repeat start (thick + thin + dots) -->
            @if (type === 'repeat-start') {
                <line
                    [attr.x1]="repeatStartThickX"
                    [attr.y1]="lineY1"
                    [attr.x2]="repeatStartThickX"
                    [attr.y2]="lineY2"
                    [attr.stroke]="color"
                    [attr.stroke-width]="thickLineWidth"
                    class="bar-line thick-line"
                />
                <line
                    [attr.x1]="repeatStartThinX"
                    [attr.y1]="lineY1"
                    [attr.x2]="repeatStartThinX"
                    [attr.y2]="lineY2"
                    [attr.stroke]="color"
                    [attr.stroke-width]="thinLineWidth"
                    class="bar-line thin-line"
                />
                <circle
                    [attr.cx]="repeatStartDotX"
                    [attr.cy]="repeatDotY1"
                    [attr.r]="dotRadius"
                    [attr.fill]="color"
                    class="repeat-dot dot-1"
                />
                <circle
                    [attr.cx]="repeatStartDotX"
                    [attr.cy]="repeatDotY2"
                    [attr.r]="dotRadius"
                    [attr.fill]="color"
                    class="repeat-dot dot-2"
                />
            }

            <!-- Repeat end (dots + thin + thick) -->
            @if (type === 'repeat-end') {
                <circle
                    [attr.cx]="repeatEndDotX"
                    [attr.cy]="repeatDotY1"
                    [attr.r]="dotRadius"
                    [attr.fill]="color"
                    class="repeat-dot dot-1"
                />
                <circle
                    [attr.cx]="repeatEndDotX"
                    [attr.cy]="repeatDotY2"
                    [attr.r]="dotRadius"
                    [attr.fill]="color"
                    class="repeat-dot dot-2"
                />
                <line
                    [attr.x1]="repeatEndThinX"
                    [attr.y1]="lineY1"
                    [attr.x2]="repeatEndThinX"
                    [attr.y2]="lineY2"
                    [attr.stroke]="color"
                    [attr.stroke-width]="thinLineWidth"
                    class="bar-line thin-line"
                />
                <line
                    [attr.x1]="repeatEndThickX"
                    [attr.y1]="lineY1"
                    [attr.x2]="repeatEndThickX"
                    [attr.y2]="lineY2"
                    [attr.stroke]="color"
                    [attr.stroke-width]="thickLineWidth"
                    class="bar-line thick-line"
                />
            }
        </svg>
    `,
    styles: [`
        :host {
            display: inline-block;
            background: #0f0f23;
        }

        .bar-line-svg {
            overflow: visible;
        }
    `]
})
export class BarLineComponent {
    @Input() type: BarLineType = 'single';
    @Input() height = 60; // Height of the bar line (staff height)
    @Input() color = '#ffffff';
    @Input() size: 'small' | 'medium' | 'large' = 'medium';

    // Line width constants
    readonly thinLineWidth = 1.5;
    readonly thickLineWidth = 4;
    readonly dotRadius = 3;
    readonly lineSpacing = 6; // Space between double lines
    readonly dotSpacing = 4; // Space between dots and lines

    // Size multiplier
    private get sizeMultiplier(): number {
        switch (this.size) {
            case 'small': return 0.7;
            case 'large': return 1.4;
            default: return 1;
        }
    }

    // SVG dimensions
    get svgWidth(): number {
        let base: number;
        switch (this.type) {
            case 'single':
                base = 10;
                break;
            case 'double':
                base = 16;
                break;
            case 'end':
                base = 18;
                break;
            case 'repeat-start':
            case 'repeat-end':
                base = 28;
                break;
            default:
                base = 10;
        }
        return Math.round(base * this.sizeMultiplier);
    }

    get svgHeight(): number {
        return Math.round(this.height * this.sizeMultiplier);
    }

    get viewBox(): string {
        let width: number;
        switch (this.type) {
            case 'single':
                width = 10;
                break;
            case 'double':
                width = 16;
                break;
            case 'end':
                width = 18;
                break;
            case 'repeat-start':
            case 'repeat-end':
                width = 28;
                break;
            default:
                width = 10;
        }
        return `0 0 ${width} ${this.height}`;
    }

    // Line Y coordinates (top and bottom of staff)
    get lineY1(): number {
        return 0;
    }

    get lineY2(): number {
        return this.height;
    }

    // Single line X position (centered)
    get lineX(): number {
        return 5;
    }

    // Double line X positions
    get doubleLineX1(): number {
        return 5;
    }

    get doubleLineX2(): number {
        return 5 + this.lineSpacing;
    }

    // End bar line X positions
    get endThinLineX(): number {
        return 6;
    }

    get endThickLineX(): number {
        return 14;
    }

    // Repeat start X positions
    get repeatStartThickX(): number {
        return 4;
    }

    get repeatStartThinX(): number {
        return 12;
    }

    get repeatStartDotX(): number {
        return 22;
    }

    // Repeat end X positions
    get repeatEndDotX(): number {
        return 6;
    }

    get repeatEndThinX(): number {
        return 16;
    }

    get repeatEndThickX(): number {
        return 24;
    }

    // Repeat dot Y positions (positioned at middle of staff)
    get repeatDotY1(): number {
        return this.height * 0.35;
    }

    get repeatDotY2(): number {
        return this.height * 0.65;
    }

    // Helper methods for tests
    getLineWidth(lineType: 'thin' | 'thick'): number {
        return lineType === 'thin' ? this.thinLineWidth : this.thickLineWidth;
    }

    getDotRadius(): number {
        return this.dotRadius;
    }
}
