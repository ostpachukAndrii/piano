import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';

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
                    aria-label="Computer Sound">
                <mat-icon>{{ computerSoundEnabled ? 'volume_up' : 'volume_off' }}</mat-icon>
            </button>

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
                [value]="playMode"
                (change)="onModeToggleChange($event.value)"
                aria-label="Play Mode">
                <mat-button-toggle value="flow">
                    <mat-icon>play_circle</mat-icon>
                    Flow
                </mat-button-toggle>
                <mat-button-toggle value="wait">
                    <mat-icon>pause_circle</mat-icon>
                    Wait
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
        }

        .control-bar {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0 1rem;
            height: 100%;
            background: linear-gradient(180deg, #16213e 0%, #1a1a2e 100%);
            border-bottom: 2px solid #3B82F6;
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
                color: #3B82F6;
            }

            &.active {
                color: #3B82F6;
            }
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }

        .progress-section {
            flex: 1;
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
                background: linear-gradient(90deg, #22c55e 0%, #3B82F6 50%, #8B5CF6 100%);
                border-radius: 6px;
                transition: width 0.1s ease-out;
                box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
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
                border: 3px solid #3B82F6;
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.8), 0 2px 4px rgba(0, 0, 0, 0.3);
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

            mat-slider {
                width: 100px;
            }

            .tempo-text {
                min-width: 45px;
                font-size: 0.9rem;
            }
        }

        mat-button-toggle-group {
            border: 1px solid rgba(255, 255, 255, 0.3);
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
    @Input() isFullscreen = false;

    // Outputs
    @Output() playToggle = new EventEmitter<void>();
    @Output() autoPlayToggle = new EventEmitter<void>();
    @Output() computerSoundToggle = new EventEmitter<void>();
    @Output() restart = new EventEmitter<void>();
    @Output() tempoChange = new EventEmitter<number>();
    @Output() modeChange = new EventEmitter<'flow' | 'wait'>();
    @Output() fullscreenToggle = new EventEmitter<void>();

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
}
