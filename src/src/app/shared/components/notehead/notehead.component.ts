import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

/**
 * Note duration types in beats
 * - whole: 4 beats (hollow, no stem)
 * - half: 2 beats (hollow, with stem)
 * - quarter: 1 beat (filled, with stem)
 * - eighth: 0.5 beats (filled, with stem and 1 flag)
 * - sixteenth: 0.25 beats (filled, with stem and 2 flags)
 */
export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';

/**
 * Note state for visual feedback
 */
export type NoteState = 'upcoming' | 'active' | 'hit' | 'missed';

/**
 * Convert beat duration to NoteDuration type
 */
export function beatsToNoteDuration(beats: number): NoteDuration {
    if (beats >= 4) return 'whole';
    if (beats >= 2) return 'half';
    if (beats >= 1) return 'quarter';
    if (beats >= 0.5) return 'eighth';
    return 'sixteenth';
}

/**
 * Notehead Component
 *
 * Renders a musical note with proper visual representation based on duration and state.
 * Uses SVG for scalable, crisp rendering.
 *
 * Visual rules:
 * - Whole notes (4 beats): Hollow oval, no stem
 * - Half notes (2 beats): Hollow oval, with stem
 * - Quarter notes (1 beat): Filled oval, with stem
 * - Eighth notes (0.5 beats): Filled oval, with stem and 1 flag
 * - Sixteenth notes (0.25 beats): Filled oval, with stem and 2 flags
 *
 * State colors:
 * - upcoming: white
 * - active: blue with glow
 * - hit: green
 * - missed: red
 */
@Component({
    selector: 'app-notehead',
    standalone: true,
    imports: [CommonModule],
    template: `
        <svg
            [attr.width]="svgWidth"
            [attr.height]="svgHeight"
            [attr.viewBox]="viewBox"
            class="notehead-svg"
            [class.active]="state === 'active'"
            [class.hit]="state === 'hit'"
            [class.missed]="state === 'missed'">

            <!-- Glow filter for active state -->
            <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>

            <!-- Notehead (oval) -->
            <ellipse
                [attr.cx]="noteheadCx"
                [attr.cy]="noteheadCy"
                [attr.rx]="noteheadRx"
                [attr.ry]="noteheadRy"
                [attr.fill]="isHollow ? 'none' : stateColor"
                [attr.stroke]="stateColor"
                [attr.stroke-width]="isHollow ? 2 : 0"
                [attr.filter]="state === 'active' ? 'url(#glow)' : null"
                [attr.transform]="'rotate(-20 ' + noteheadCx + ' ' + noteheadCy + ')'"
                class="notehead-oval"
            />

            <!-- Stem (not for whole notes) -->
            @if (hasStem) {
                <line
                    [attr.x1]="stemX"
                    [attr.y1]="stemY1"
                    [attr.x2]="stemX"
                    [attr.y2]="stemY2"
                    [attr.stroke]="stateColor"
                    stroke-width="2"
                    class="notehead-stem"
                />
            }

            <!-- Flags for eighth and sixteenth notes -->
            @if (duration === 'eighth' || duration === 'sixteenth') {
                <path
                    [attr.d]="flagPath1"
                    [attr.fill]="stateColor"
                    class="notehead-flag"
                />
            }
            @if (duration === 'sixteenth') {
                <path
                    [attr.d]="flagPath2"
                    [attr.fill]="stateColor"
                    class="notehead-flag"
                />
            }

            <!-- Hit effect (expanding ring) -->
            @if (state === 'hit' && showHitEffect) {
                <ellipse
                    [attr.cx]="noteheadCx"
                    [attr.cy]="noteheadCy"
                    [attr.rx]="noteheadRx + 8"
                    [attr.ry]="noteheadRy + 6"
                    fill="none"
                    [attr.stroke]="stateColor"
                    stroke-width="2"
                    opacity="0.5"
                    class="hit-ring"
                />
            }

            <!-- Anchor point (red dot) for Storybook -->
            @if (showAnchor) {
                <circle
                    [attr.cx]="noteheadCx"
                    [attr.cy]="noteheadCy"
                    r="3"
                    fill="#ff0000"
                    class="anchor-point"
                />
                <circle
                    [attr.cx]="noteheadCx"
                    [attr.cy]="noteheadCy"
                    r="1"
                    fill="#ffffff"
                    class="anchor-center"
                />
            }
        </svg>
    `,
    styles: [`
        :host {
            display: inline-block;
            background: #0f0f23;
        }

        .notehead-svg {
            overflow: visible;
        }

        .notehead-svg.active .notehead-oval {
            filter: url(#glow);
        }

        .hit-ring {
            animation: hit-expand 0.3s ease-out forwards;
        }

        @keyframes hit-expand {
            from {
                opacity: 0.8;
                transform: scale(1);
            }
            to {
                opacity: 0;
                transform: scale(1.5);
            }
        }
    `]
})
export class NoteheadComponent {
    @Input() duration: NoteDuration = 'quarter';
    @Input() state: NoteState = 'upcoming';
    @Input() size: 'small' | 'medium' | 'large' = 'medium';
    @Input() stemDirection: 'up' | 'down' = 'up';
    @Input() showHitEffect = true;
    @Input() showAnchor = false;

    // Base dimensions
    readonly noteheadRx = 10;
    readonly noteheadRy = 7;
    private readonly stemLength = 35;

    // State colors
    private readonly STATE_COLORS: Record<NoteState, string> = {
        'upcoming': '#ffffff',
        'active': '#3B82F6',
        'hit': '#22c55e',
        'missed': '#ef4444'
    };

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
        const base = this.duration === 'whole' ? 30 : 40;
        return Math.round(base * this.sizeMultiplier);
    }

    get svgHeight(): number {
        const base = this.hasStem ? 55 : 25;
        return Math.round(base * this.sizeMultiplier);
    }

    get viewBox(): string {
        const width = this.duration === 'whole' ? 30 : 40;
        const height = this.hasStem ? 55 : 25;
        return `0 0 ${width} ${height}`;
    }

    // Notehead position
    get noteheadCx(): number {
        return this.stemDirection === 'up' ? 12 : 18;
    }

    get noteheadCy(): number {
        if (!this.hasStem) return 12;
        return this.stemDirection === 'up' ? 45 : 10;
    }

    // Stem calculations
    get hasStem(): boolean {
        return this.duration !== 'whole';
    }

    get stemX(): number {
        return this.stemDirection === 'up'
            ? this.noteheadCx + this.noteheadRx - 1
            : this.noteheadCx - this.noteheadRx + 1;
    }

    get stemY1(): number {
        return this.noteheadCy;
    }

    get stemY2(): number {
        return this.stemDirection === 'up'
            ? this.noteheadCy - this.stemLength
            : this.noteheadCy + this.stemLength;
    }

    // Hollow vs filled
    get isHollow(): boolean {
        return this.duration === 'whole' || this.duration === 'half';
    }

    // State color
    get stateColor(): string {
        return this.STATE_COLORS[this.state];
    }

    // Flag paths for eighth and sixteenth notes
    get flagPath1(): string {
        const x = this.stemX;
        const y = this.stemY2;

        if (this.stemDirection === 'up') {
            return `M ${x} ${y} Q ${x + 12} ${y + 8} ${x + 8} ${y + 18}`;
        } else {
            return `M ${x} ${y} Q ${x - 12} ${y - 8} ${x - 8} ${y - 18}`;
        }
    }

    get flagPath2(): string {
        const x = this.stemX;
        const y = this.stemY2;

        if (this.stemDirection === 'up') {
            return `M ${x} ${y + 8} Q ${x + 12} ${y + 16} ${x + 8} ${y + 26}`;
        } else {
            return `M ${x} ${y - 8} Q ${x - 12} ${y - 16} ${x - 8} ${y - 26}`;
        }
    }

    // Methods for tests (expose computed values as callable methods too)
    isHollowNote(duration: number): boolean {
        return duration >= 2;
    }
}
