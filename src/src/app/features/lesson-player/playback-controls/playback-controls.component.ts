import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Playback Controls Component (Zone A)
 * Displays play/pause, progress, tempo control, mode toggle, and auto-play.
 */
@Component({
    selector: 'app-playback-controls',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatSliderModule,
        MatButtonToggleModule,
        MatTooltipModule,
    ],
    template: `
        <div class="control-bar">
            <button mat-icon-button (click)="onRestart()" class="restart-btn" aria-label="Restart">
                <mat-icon>replay</mat-icon>
            </button>

            <button mat-icon-button (click)="onPlayToggle()" class="play-btn" aria-label="Play/Pause">
                <mat-icon>{{ isPlaying ? 'pause' : 'play_arrow' }}</mat-icon>
            </button>

            <!-- Auto-play button for listening/demo mode -->
            <button mat-icon-button
                    (click)="onAutoPlayToggle()"
                    class="auto-play-btn"
                    [class.active]="isAutoPlaying"
                    aria-label="Auto Play">
                <mat-icon>{{ isAutoPlaying ? 'stop' : 'headphones' }}</mat-icon>
            </button>

            <!-- Computer sound toggle button -->
            <button mat-icon-button
                    (click)="onComputerSoundToggle()"
                    class="sound-btn"
                    [class.active]="computerSoundEnabled"
                    aria-label="Computer Sound"
                    matTooltip="Toggle computer playback">
                <mat-icon>{{ computerSoundEnabled ? 'volume_up' : 'volume_off' }}</mat-icon>
            </button>

            <!-- Piano sound toggle button -->
            <button mat-icon-button
                    (click)="onPianoSoundToggle()"
                    class="sound-btn"
                    [class.active]="pianoSoundEnabled"
                    aria-label="Piano Sound"
                    matTooltip="Toggle piano sound">
                <mat-icon>{{ pianoSoundEnabled ? 'piano' : 'piano_off' }}</mat-icon>
            </button>

            <!-- Sound effects toggle button -->
            <button mat-icon-button
                    (click)="onSoundEffectsToggle()"
                    class="sound-btn"
                    [class.active]="soundEffectsEnabled"
                    aria-label="Sound Effects"
                    matTooltip="Toggle sound effects">
                <mat-icon>{{ soundEffectsEnabled ? 'music_note' : 'music_off' }}</mat-icon>
            </button>

            <div class="hand-separator"></div>

            <!-- Left hand toggle button -->
            <button mat-icon-button
                    (click)="onLeftHandToggle()"
                    class="hand-btn"
                    [class.active]="leftHandEnabled"
                    [class.disabled]="!leftHandEnabled"
                    aria-label="Left Hand"
                    matTooltip="Toggle left hand (bass)">
                <span class="hand-label">L</span>
            </button>

            <!-- Right hand toggle button -->
            <button mat-icon-button
                    (click)="onRightHandToggle()"
                    class="hand-btn"
                    [class.active]="rightHandEnabled"
                    [class.disabled]="!rightHandEnabled"
                    aria-label="Right Hand"
                    matTooltip="Toggle right hand (treble)">
                <span class="hand-label">R</span>
            </button>

            <div class="measure-separator"></div>

            <!-- Measure Navigation -->
            <div class="measure-nav">
                <button mat-icon-button
                        (click)="onPrevMeasure()"
                        [disabled]="currentMeasure <= 1"
                        class="measure-btn"
                        aria-label="Previous Measure"
                        matTooltip="Previous measure">
                    <mat-icon>skip_previous</mat-icon>
                </button>
                <span class="measure-display" matTooltip="Current measure / Total measures">
                    {{ currentMeasure }} / {{ totalMeasures }}
                </span>
                <button mat-icon-button
                        (click)="onNextMeasure()"
                        [disabled]="currentMeasure >= totalMeasures"
                        class="measure-btn"
                        aria-label="Next Measure"
                        matTooltip="Next measure">
                    <mat-icon>skip_next</mat-icon>
                </button>
            </div>

            <div class="progress-section">
                <div class="progress-container">
                    <div class="progress-track">
                        <div class="progress-fill" [style.width.%]="progressPercent"></div>
                        <div class="progress-indicator" [style.left.%]="progressPercent">
                            <div class="indicator-dot"></div>
                        </div>
                    </div>
                    <div class="progress-labels">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                    </div>
                </div>
                <span class="progress-text">{{ progressPercent.toFixed(0) }}%</span>
            </div>

            <div class="tempo-section">
                <mat-icon>speed</mat-icon>
                <mat-slider [min]="25" [max]="150" [step]="25" discrete>
                    <input
                        matSliderThumb
                        [value]="tempoPercent"
                        (valueChange)="onTempoSliderChange($event)"
                        aria-label="Tempo">
                </mat-slider>
                <span class="tempo-text">{{ tempoPercent }}%</span>
            </div>

            <mat-button-toggle-group
                class="mode-toggle"
                [value]="playMode"
                (change)="onModeToggleChange($event.value)"
                aria-label="Play Mode">
                <mat-button-toggle value="flow">
                    <span class="toggle-content">
                        <mat-icon>play_circle</mat-icon>
                        <span class="toggle-text">Flow</span>
                    </span>
                </mat-button-toggle>
                <mat-button-toggle value="wait">
                    <span class="toggle-content">
                        <mat-icon>pause_circle</mat-icon>
                        <span class="toggle-text">Wait</span>
                    </span>
                </mat-button-toggle>
            </mat-button-toggle-group>

            <button mat-icon-button
                    (click)="onFullscreenToggle()"
                    class="fullscreen-btn"
                    [class.active]="isFullscreen"
                    aria-label="Fullscreen">
                <mat-icon>{{ isFullscreen ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
            </button>
        </div>
    `,
    styles: [`
        :host {
            display: block;
            width: 100%;
            height: 100%;
        }

        .control-bar {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0 0.75rem;
            height: 100%;
            background: linear-gradient(180deg, #16213e 0%, #1a1a2e 100%);
            border-bottom: 2px solid #8B5CF6;
            flex-wrap: nowrap;
            overflow-x: auto;
        }

        .restart-btn {
            color: white;
        }

        .play-btn {
            color: white;
        }

        .auto-play-btn {
            color: rgba(255, 255, 255, 0.7);
            transition: all 0.2s ease;

            &:hover {
                color: #22c55e;
            }

            &.active {
                color: #22c55e;
                animation: pulse 1.5s infinite;
            }
        }

        .sound-btn {
            color: rgba(255, 255, 255, 0.7);
            transition: all 0.2s ease;

            &:hover {
                color: #8B5CF6;
            }

            &.active {
                color: #8B5CF6;
            }
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }

        .progress-section {
            flex: 1;
            min-width: 150px;
            display: flex;
            align-items: center;
            gap: 0.75rem;

            .progress-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .progress-track {
                position: relative;
                height: 12px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                overflow: visible;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #22c55e 0%, #8B5CF6 100%);
                border-radius: 6px;
                transition: width 0.1s ease-out;
                box-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
            }

            .progress-indicator {
                position: absolute;
                top: 50%;
                transform: translate(-50%, -50%);
                z-index: 2;
                transition: left 0.1s ease-out;
            }

            .indicator-dot {
                width: 18px;
                height: 18px;
                background: white;
                border-radius: 50%;
                border: 3px solid #8B5CF6;
                box-shadow: 0 0 10px rgba(139, 92, 246, 0.8), 0 2px 4px rgba(0, 0, 0, 0.3);
            }

            .progress-labels {
                display: flex;
                justify-content: space-between;
                font-size: 0.65rem;
                color: rgba(255, 255, 255, 0.4);
                padding: 0 2px;
            }

            .progress-text {
                min-width: 50px;
                text-align: right;
                font-size: 1rem;
                font-weight: 600;
                color: white;
                background: rgba(59, 130, 246, 0.3);
                padding: 4px 8px;
                border-radius: 4px;
            }
        }

        .tempo-section {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: white;
            flex-shrink: 0;

            mat-slider {
                width: 100px;
            }

            .tempo-text {
                min-width: 45px;
                font-size: 0.9rem;
            }
        }

        .mode-toggle {
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            flex-shrink: 0;
            height: 32px;

            ::ng-deep .mat-button-toggle-label-content {
                padding: 0 8px !important;
                line-height: 32px !important;
            }

            ::ng-deep .mat-button-toggle {
                height: 32px;
            }

            ::ng-deep .mat-button-toggle-button {
                height: 32px;
            }
        }

        .toggle-content {
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;

            mat-icon {
                font-size: 16px;
                width: 16px;
                height: 16px;
            }
        }

        .toggle-text {
            font-size: 0.75rem;
            font-weight: 500;
        }

        .fullscreen-btn {
            color: rgba(255, 255, 255, 0.7);
            transition: all 0.2s ease;

            &:hover {
                color: #8B5CF6;
            }

            &.active {
                color: #8B5CF6;
            }
        }

        .hand-separator {
            width: 1px;
            height: 24px;
            background: rgba(255, 255, 255, 0.2);
            margin: 0 4px;
        }

        .hand-btn {
            color: rgba(255, 255, 255, 0.7);
            transition: all 0.2s ease;
            min-width: 36px;

            .hand-label {
                font-size: 14px;
                font-weight: 700;
                font-family: monospace;
            }

            &:hover {
                color: #22c55e;
            }

            &.active {
                color: #22c55e;
                background: rgba(34, 197, 94, 0.15);

                .hand-label {
                    text-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
                }
            }

            &.disabled {
                color: rgba(255, 255, 255, 0.3);
                background: rgba(255, 255, 255, 0.05);

                .hand-label {
                    text-decoration: line-through;
                }
            }
        }

        .measure-separator {
            width: 1px;
            height: 24px;
            background: rgba(255, 255, 255, 0.2);
            margin: 0 4px;
        }

        .measure-nav {
            display: flex;
            align-items: center;
            gap: 2px;
            flex-shrink: 0;
        }

        .measure-btn {
            color: rgba(255, 255, 255, 0.7);
            transition: all 0.2s ease;

            &:hover:not(:disabled) {
                color: #f59e0b;
            }

            &:disabled {
                color: rgba(255, 255, 255, 0.2);
            }
        }

        .measure-display {
            font-size: 0.9rem;
            font-weight: 600;
            color: white;
            background: rgba(245, 158, 11, 0.3);
            padding: 4px 10px;
            border-radius: 4px;
            min-width: 50px;
            text-align: center;
            white-space: nowrap;
        }
    `]
})
export class PlaybackControlsComponent {
    // Inputs
    @Input() isPlaying = false;
    @Input() isAutoPlaying = false;
    @Input() progressPercent = 0;
    @Input() tempoPercent = 100;
    @Input() playMode: 'flow' | 'wait' = 'wait';
    @Input() computerSoundEnabled = true;
    @Input() pianoSoundEnabled = true;
    @Input() soundEffectsEnabled = true;
    @Input() isFullscreen = false;
    @Input() leftHandEnabled = true;
    @Input() rightHandEnabled = true;
    @Input() currentMeasure = 1;
    @Input() totalMeasures = 1;

    // Outputs
    @Output() playToggle = new EventEmitter<void>();
    @Output() autoPlayToggle = new EventEmitter<void>();
    @Output() computerSoundToggle = new EventEmitter<void>();
    @Output() pianoSoundToggle = new EventEmitter<void>();
    @Output() soundEffectsToggle = new EventEmitter<void>();
    @Output() restart = new EventEmitter<void>();
    @Output() tempoChange = new EventEmitter<number>();
    @Output() modeChange = new EventEmitter<'flow' | 'wait'>();
    @Output() fullscreenToggle = new EventEmitter<void>();
    @Output() leftHandToggle = new EventEmitter<void>();
    @Output() rightHandToggle = new EventEmitter<void>();
    @Output() jumpToMeasure = new EventEmitter<number>();

    /**
     * Handle restart button click
     */
    onRestart(): void {
        this.restart.emit();
    }

    /**
     * Handle play/pause button click
     */
    onPlayToggle(): void {
        this.playToggle.emit();
    }

    /**
     * Handle auto-play button click (listen/demo mode)
     */
    onAutoPlayToggle(): void {
        this.autoPlayToggle.emit();
    }

    /**
     * Handle computer sound toggle button click
     */
    onComputerSoundToggle(): void {
        this.computerSoundToggle.emit();
    }

    /**
     * Handle piano sound toggle button click
     */
    onPianoSoundToggle(): void {
        this.pianoSoundToggle.emit();
    }

    /**
     * Handle sound effects toggle button click
     */
    onSoundEffectsToggle(): void {
        this.soundEffectsToggle.emit();
    }

    /**
     * Handle tempo slider change
     */
    onTempoSliderChange(value: number): void {
        this.tempoChange.emit(value);
    }

    /**
     * Handle mode toggle change
     */
    onModeToggleChange(mode: 'flow' | 'wait'): void {
        this.modeChange.emit(mode);
    }

    /**
     * Handle fullscreen toggle button click
     */
    onFullscreenToggle(): void {
        this.fullscreenToggle.emit();
    }

    /**
     * Handle left hand toggle button click
     */
    onLeftHandToggle(): void {
        this.leftHandToggle.emit();
    }

    /**
     * Handle right hand toggle button click
     */
    onRightHandToggle(): void {
        this.rightHandToggle.emit();
    }

    /**
     * Handle previous measure button click
     */
    onPrevMeasure(): void {
        if (this.currentMeasure > 1) {
            this.jumpToMeasure.emit(this.currentMeasure - 1);
        }
    }

    /**
     * Handle next measure button click
     */
    onNextMeasure(): void {
        if (this.currentMeasure < this.totalMeasures) {
            this.jumpToMeasure.emit(this.currentMeasure + 1);
        }
    }
}
