import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PlaybackService } from '../../../../core/services/playback.service';
import { PianoSoundService } from '../../../../core/services/piano-sound.service';

@Component({
    selector: 'app-playback-bar',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatSliderModule,
        MatTooltipModule,
    ],
    template: `
        <div class="playback-controls-bar">
            <div class="playback-time">
                {{ playbackService.currentTimeFormatted }} / {{ playbackService.totalDurationFormatted }}
            </div>

            <div class="playback-progress">
                <mat-slider
                    [min]="0"
                    [max]="100"
                    [step]="1"
                    [disabled]="playbackService.isStopped()"
                    class="progress-slider">
                    <input matSliderThumb
                           [value]="playbackService.progressPercent()"
                           (valueChange)="seek.emit($event)">
                </mat-slider>
            </div>

            <div class="playback-buttons">
                <button mat-icon-button
                        (click)="playbackService.stop()"
                        [disabled]="playbackService.isStopped()"
                        matTooltip="Stop">
                    <mat-icon>stop</mat-icon>
                </button>

                <button mat-fab
                        color="primary"
                        (click)="playToggle.emit()"
                        matTooltip="{{ playbackService.isPlaying() ? 'Pause' : 'Play' }}">
                    <mat-icon>{{ playbackService.isPlaying() ? 'pause' : 'play_arrow' }}</mat-icon>
                </button>

                <button mat-icon-button
                        (click)="volumeToggle.emit()"
                        matTooltip="Volume: {{ Math.round(pianoService.volume() * 100) }}%">
                    <mat-icon>{{ pianoService.volume() > 0 ? 'volume_up' : 'volume_off' }}</mat-icon>
                </button>
            </div>

            <div class="tempo-control">
                <mat-icon>speed</mat-icon>
                <mat-slider
                    [min]="40"
                    [max]="200"
                    [step]="5"
                    class="tempo-slider">
                    <input matSliderThumb
                           [value]="playbackService.tempo()"
                           (valueChange)="tempoChange.emit($event)">
                </mat-slider>
                <span class="tempo-value">{{ playbackService.tempo() }} BPM</span>
            </div>
        </div>
    `,
    styles: [`
        .playback-controls-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top, rgba(33, 33, 33, 0.98), rgba(33, 33, 33, 0.95));
            backdrop-filter: blur(10px);
            padding: 1rem 2rem;
            display: flex;
            align-items: center;
            gap: 1.5rem;
            z-index: 1000;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);

            .playback-time {
                font-family: 'Courier New', monospace;
                font-size: 0.9rem;
                color: #fff;
                min-width: 100px;
            }

            .playback-progress {
                flex: 1;

                .progress-slider {
                    width: 100%;

                    ::ng-deep .mdc-slider__track--active {
                        background: #E91E63;
                    }

                    ::ng-deep .mdc-slider__thumb-knob {
                        background: #E91E63;
                        border-color: #E91E63;
                    }
                }
            }

            .playback-buttons {
                display: flex;
                align-items: center;
                gap: 0.5rem;

                button {
                    color: #fff;

                    &[disabled] {
                        color: #666;
                    }
                }

                [mat-fab] {
                    background: linear-gradient(135deg, #E91E63, #9C27B0);
                }
            }

            .tempo-control {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: #fff;
                min-width: 180px;

                mat-icon {
                    font-size: 20px;
                    width: 20px;
                    height: 20px;
                }

                .tempo-slider {
                    width: 80px;

                    ::ng-deep .mdc-slider__track--active {
                        background: #4CAF50;
                    }

                    ::ng-deep .mdc-slider__thumb-knob {
                        background: #4CAF50;
                        border-color: #4CAF50;
                    }
                }

                .tempo-value {
                    font-size: 0.85rem;
                    min-width: 60px;
                }
            }
        }
    `]
})
export class PlaybackBarComponent {
    playbackService = inject(PlaybackService);
    pianoService = inject(PianoSoundService);

    @Output() seek = new EventEmitter<number>();
    @Output() tempoChange = new EventEmitter<number>();
    @Output() playToggle = new EventEmitter<void>();
    @Output() volumeToggle = new EventEmitter<void>();

    Math = Math;
}
