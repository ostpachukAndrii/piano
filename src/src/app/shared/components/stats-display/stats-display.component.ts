import { CommonModule } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SessionStats } from '../../../core/models';

/**
 * Stats Display Component
 * Shows session statistics: streak, accuracy, total notes
 */
@Component({
    selector: 'app-stats-display',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatTooltipModule],
    template: `
        <div class="stats-container">
            <!-- Streak -->
            <div class="stat-item streak" 
                 [class.on-fire]="isStreakHot()"
                 matTooltip="Current streak / Best streak">
                <mat-icon>{{ streakIcon() }}</mat-icon>
                <span class="value">{{ currentStreak() }}</span>
                @if (bestStreak() > 0) {
                    <span class="best">/ {{ bestStreak() }}</span>
                }
            </div>

            <!-- Accuracy -->
            <div class="stat-item accuracy" matTooltip="Accuracy">
                <mat-icon>target</mat-icon>
                <span class="value">{{ accuracyPercent() }}%</span>
            </div>

            <!-- Total Notes -->
            <div class="stat-item total" matTooltip="Notes played">
                <mat-icon>music_note</mat-icon>
                <span class="value">{{ totalNotes() }}</span>
            </div>

            <!-- Perfect Notes -->
            @if (perfectNotes() > 0) {
                <div class="stat-item perfect" matTooltip="Perfect notes">
                    <mat-icon>star</mat-icon>
                    <span class="value">{{ perfectNotes() }}</span>
                </div>
            }
        </div>
    `,
    styles: [`
        .stats-container {
            display: flex;
            gap: 16px;
            align-items: center;
            padding: 8px 16px;
            background: rgba(0, 0, 0, 0.05);
            border-radius: 12px;
        }

        .stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-weight: 500;
        }

        .stat-item mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
        }

        .streak mat-icon {
            color: #f97316;
        }

        .streak.on-fire {
            animation: fire 0.5s ease-in-out infinite alternate;
        }

        .streak.on-fire mat-icon {
            color: #dc2626;
        }

        @keyframes fire {
            from { transform: scale(1); }
            to { transform: scale(1.1); }
        }

        .accuracy mat-icon {
            color: #3b82f6;
        }

        .total mat-icon {
            color: #8b5cf6;
        }

        .perfect mat-icon {
            color: #eab308;
        }

        .value {
            font-size: 1.1rem;
        }

        .best {
            font-size: 0.9rem;
            opacity: 0.7;
        }
    `]
})
export class StatsDisplayComponent {
    @Input() set stats(value: SessionStats | null) {
        this._stats.set(value);
    }

    private _stats = signal<SessionStats | null>(null);

    // Computed values
    readonly currentStreak = computed(() => this._stats()?.current_streak ?? 0);
    readonly bestStreak = computed(() => this._stats()?.best_streak ?? 0);
    readonly totalNotes = computed(() => this._stats()?.total_notes ?? 0);
    readonly perfectNotes = computed(() => this._stats()?.perfect_notes ?? 0);
    readonly correctNotes = computed(() => this._stats()?.correct_notes ?? 0);

    readonly accuracyPercent = computed(() => {
        const acc = this._stats()?.accuracy ?? 0;
        // Backend already returns percentage (0-100), no need to multiply
        return Math.round(acc);
    });

    readonly isStreakHot = computed(() => this.currentStreak() >= 5);

    readonly streakIcon = computed(() => {
        const streak = this.currentStreak();
        if (streak >= 10) return 'whatshot';
        if (streak >= 5) return 'local_fire_department';
        return 'flash_on';
    });
}
