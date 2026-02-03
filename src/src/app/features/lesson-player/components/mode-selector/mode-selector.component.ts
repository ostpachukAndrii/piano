import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LessonMode } from '../../../../core/models/lesson.model';

@Component({
    selector: 'app-mode-selector',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatSelectModule,
        MatButtonToggleModule,
        MatTooltipModule,
    ],
    template: `
        <div class="mode-selector-section">
            <div class="mode-selector">
                <mat-form-field appearance="outline">
                    <mat-label>Practice Mode</mat-label>
                    <mat-select [value]="currentMode" (selectionChange)="modeChange.emit($event.value)">
                        <mat-optgroup label="Study (No Timing)">
                            <mat-option value="study_right_hand_no_timing">Study Right Hand</mat-option>
                            <mat-option value="study_left_hand_no_timing">Study Left Hand</mat-option>
                            <mat-option value="study_two_hands_no_timing">Study Both Hands</mat-option>
                        </mat-optgroup>
                        <mat-optgroup label="Play (With Timing)">
                            <mat-option value="play_right_hand_timing">Play Right Hand</mat-option>
                            <mat-option value="play_left_hand_timing">Play Left Hand</mat-option>
                            <mat-option value="play_two_hands_timing">Full Performance</mat-option>
                        </mat-optgroup>
                    </mat-select>
                </mat-form-field>
            </div>

            <div class="mode-instructions" [class.study]="isStudyMode" [class.play]="isTimingEnabled">
                <mat-icon>{{ isStudyMode ? 'lightbulb' : 'timer' }}</mat-icon>
                <div class="mode-text">
                    <span *ngIf="isStudyMode">
                        <strong>Study Mode:</strong> Take your time. Play each note correctly to advance. No timing required.
                    </span>
                    <span *ngIf="isTimingEnabled && !isTimingPlaying">
                        <strong>Play Mode:</strong> Press Start to begin. Follow the rhythm at {{ tempo }} BPM.
                    </span>
                    <span *ngIf="isTimingEnabled && isTimingPlaying">
                        <strong>Playing...</strong> Follow the cursor! Play notes within the timing window.
                    </span>
                    <span class="hand-hint" *ngIf="activeHands !== 'both'">
                        Focus on {{ activeHands === 'left' ? 'left hand (bass clef)' : 'right hand (treble clef)' }} only.
                    </span>
                </div>
            </div>

            <!-- Timing Mode Controls -->
            <div class="timing-controls" *ngIf="isTimingEnabled && playerView === 'classic'">
                <button mat-raised-button
                        [color]="isTimingPlaying ? 'warn' : 'primary'"
                        (click)="toggleTiming.emit()"
                        class="timing-button">
                    <mat-icon>{{ isTimingPlaying ? 'stop' : 'play_arrow' }}</mat-icon>
                    {{ isTimingPlaying ? 'Stop' : 'Start' }}
                </button>
            </div>

            <!-- View Toggle -->
            <div class="view-toggle">
                <mat-button-toggle-group [value]="playerView" (change)="viewChange.emit($event.value)">
                    <mat-button-toggle value="classic" matTooltip="Classic staff notation">
                        <mat-icon>music_note</mat-icon>
                        Classic
                    </mat-button-toggle>
                    <mat-button-toggle value="scrolling" matTooltip="Scrolling view (Guitar Hero style)">
                        <mat-icon>slideshow</mat-icon>
                        Scrolling
                    </mat-button-toggle>
                </mat-button-toggle-group>
            </div>
        </div>
    `,
    styles: [`
        .mode-selector-section {
            display: flex;
            align-items: stretch;
            gap: 1rem;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;

            .mode-selector {
                mat-form-field {
                    width: 240px;
                }
            }

            .mode-instructions {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                flex: 1;
                min-width: 300px;

                mat-icon {
                    font-size: 24px;
                    width: 24px;
                    height: 24px;
                    flex-shrink: 0;
                }

                .mode-text {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                strong {
                    font-weight: 600;
                }

                .hand-hint {
                    color: inherit;
                    opacity: 0.9;
                    font-style: italic;
                    font-size: 0.9em;
                }

                &.study {
                    background: #e8f5e9;
                    color: #2e7d32;
                    border: 1px solid #c8e6c9;
                }

                &.play {
                    background: #e3f2fd;
                    color: #1565c0;
                    border: 1px solid #bbdefb;
                }
            }

            .timing-controls {
                display: flex;
                align-items: center;

                .timing-button {
                    min-width: 120px;
                    height: 48px;
                    font-size: 1rem;

                    mat-icon {
                        margin-right: 8px;
                    }
                }
            }

            .view-toggle {
                display: flex;
                align-items: center;
                margin-left: auto;

                mat-button-toggle-group {
                    mat-icon {
                        margin-right: 4px;
                    }
                }
            }
        }
    `]
})
export class ModeSelectorComponent {
    @Input() currentMode: LessonMode = 'study_right_hand_no_timing';
    @Input() playerView: 'classic' | 'scrolling' = 'classic';
    @Input() isTimingEnabled = false;
    @Input() isStudyMode = true;
    @Input() isTimingPlaying = false;
    @Input() activeHands: 'left' | 'right' | 'both' = 'both';
    @Input() tempo = 120;

    @Output() modeChange = new EventEmitter<LessonMode>();
    @Output() viewChange = new EventEmitter<'classic' | 'scrolling'>();
    @Output() toggleTiming = new EventEmitter<void>();
}
