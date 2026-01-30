import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, Input, computed, effect, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { EvaluationResult, FeedbackHelper } from '../../../core/models';

/**
 * Feedback Badge Component
 * Displays animated feedback for note evaluation results
 */
@Component({
    selector: 'app-feedback-badge',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    template: `
        @if (visible()) {
            <div class="feedback-badge" 
                 [class]="badgeClass()"
                 [@fadeInOut]>
                <mat-icon>{{ icon() }}</mat-icon>
                <span class="message">{{ message() }}</span>
                @if (showScore()) {
                    <span class="score">+{{ score() }}</span>
                }
            </div>
        }
    `,
    styles: [`
        .feedback-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 24px;
            font-weight: 600;
            font-size: 1.1rem;
            animation: pop 0.3s ease-out;
        }

        @keyframes pop {
            0% { transform: scale(0.5); opacity: 0; }
            70% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
        }

        .feedback-perfect {
            background: linear-gradient(135deg, #4ade80, #22c55e);
            color: white;
            box-shadow: 0 4px 15px rgba(74, 222, 128, 0.4);
        }

        .feedback-good {
            background: linear-gradient(135deg, #60a5fa, #3b82f6);
            color: white;
            box-shadow: 0 4px 15px rgba(96, 165, 250, 0.4);
        }

        .feedback-close {
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            color: white;
            box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
        }

        .feedback-wrong {
            background: linear-gradient(135deg, #f87171, #ef4444);
            color: white;
            box-shadow: 0 4px 15px rgba(248, 113, 113, 0.4);
        }

        .score {
            background: rgba(255, 255, 255, 0.2);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.9rem;
        }

        mat-icon {
            font-size: 24px;
            width: 24px;
            height: 24px;
        }
    `],
    animations: [
        trigger('fadeInOut', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.5) translateY(20px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.8) translateY(-10px)' }))
            ])
        ])
    ]
})
export class FeedbackBadgeComponent {
    @Input() set result(value: EvaluationResult | null) {
        this._result.set(value);
    }

    @Input() duration = 2000; // How long to show badge

    private _result = signal<EvaluationResult | null>(null);
    private _visible = signal(false);
    private hideTimeout?: ReturnType<typeof setTimeout>;

    // Computed properties
    readonly visible = this._visible.asReadonly();

    readonly feedback = computed(() => this._result()?.feedback ?? null);
    readonly message = computed(() => this._result()?.message ?? '');
    readonly score = computed(() => this._result()?.score ?? 0);
    readonly showScore = computed(() => this.score() > 0);

    readonly icon = computed(() => {
        const fb = this.feedback();
        return fb ? FeedbackHelper.getIcon(fb) : '';
    });

    readonly badgeClass = computed(() => {
        const fb = this.feedback();
        if (!fb) return '';
        return `feedback-${fb.toLowerCase()}`;
    });

    constructor() {
        // Show badge when result changes
        effect(() => {
            const result = this._result();
            if (result) {
                this.showBadge();
            }
        }, { allowSignalWrites: true });
    }

    private showBadge(): void {
        // Clear any existing timeout
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }

        this._visible.set(true);

        // Auto-hide after duration
        this.hideTimeout = setTimeout(() => {
            this._visible.set(false);
        }, this.duration);
    }
}
