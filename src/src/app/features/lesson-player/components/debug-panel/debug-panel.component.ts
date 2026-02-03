import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { LessonDTO, LessonMode, getLessonModeLabel } from '../../../../core/models/lesson.model';
import { midiToNoteName } from '../../../../core/models/note.model';
import { MidiService } from '../../../../core/services/midi.service';
import { EvaluationService } from '../../../../core/services/evaluation.service';
import { PlaybackService } from '../../../../core/services/playback.service';
import { PianoSoundService } from '../../../../core/services/piano-sound.service';

@Component({
    selector: 'app-debug-panel',
    standalone: true,
    imports: [
        CommonModule,
        MatExpansionModule,
        MatIconModule,
    ],
    template: `
        <mat-expansion-panel class="debug-panel">
            <mat-expansion-panel-header>
                <mat-panel-title>
                    <mat-icon>bug_report</mat-icon>
                    Debug Information
                </mat-panel-title>
                <mat-panel-description>
                    Click to show evaluation details
                </mat-panel-description>
            </mat-expansion-panel-header>

            <div class="debug-content">
                <!-- Lesson Mode -->
                <div class="debug-section">
                    <h4>Lesson Mode</h4>
                    <div class="debug-grid">
                        <div class="debug-item">
                            <span class="label">Mode:</span>
                            <span class="value">{{ getModeLabel(currentMode) }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Timing Required:</span>
                            <span class="value" [style.color]="isTimingEnabled ? '#ff9800' : '#4caf50'">
                                {{ isTimingEnabled ? 'Yes' : 'No - Take your time' }}
                            </span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Active Hands:</span>
                            <span class="value">{{ activeHands === 'both' ? 'Both Hands' : (activeHands === 'left' ? 'Left Hand Only' : 'Right Hand Only') }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Player View:</span>
                            <span class="value">{{ playerView }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Timing Playing:</span>
                            <span class="value" [style.color]="isTimingPlaying ? '#ff9800' : '#666'">
                                {{ isTimingPlaying ? 'YES' : 'No' }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Position -->
                <div class="debug-section">
                    <h4>Position</h4>
                    <div class="debug-grid">
                        <div class="debug-item">
                            <span class="label">Measure Index:</span>
                            <span class="value">{{ currentMeasureIndex }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Note Index:</span>
                            <span class="value">{{ currentNoteIndex }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Global Note Index:</span>
                            <span class="value">{{ globalNoteIndex }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Playhead Position:</span>
                            <span class="value">{{ playheadPosition }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Playhead Beat:</span>
                            <span class="value">{{ playheadBeatPosition }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Total Measures:</span>
                            <span class="value">{{ lesson?.measures?.length ?? 0 }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Notes in Current Measure:</span>
                            <span class="value">{{ lesson?.measures?.[currentMeasureIndex]?.notes?.length ?? 0 }}</span>
                        </div>
                    </div>
                </div>

                <!-- Lesson Info -->
                <div class="debug-section">
                    <h4>Lesson Info</h4>
                    <div class="debug-grid">
                        <div class="debug-item">
                            <span class="label">Title:</span>
                            <span class="value">{{ lesson?.title ?? 'N/A' }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Tempo:</span>
                            <span class="value">{{ lesson?.tempo ?? 0 }} BPM</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Time Signature:</span>
                            <span class="value">{{ lesson?.time_signature ?? 'N/A' }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Key Signature:</span>
                            <span class="value">{{ lesson?.key_signature ?? 'N/A' }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Total Duration:</span>
                            <span class="value">{{ lesson?.total_seconds ?? 0 }}s</span>
                        </div>
                    </div>
                </div>

                <!-- MIDI Notes -->
                <div class="debug-section">
                    <h4>MIDI Notes</h4>
                    <div class="debug-grid">
                        <div class="debug-item">
                            <span class="label">Expected:</span>
                            <span class="value notes-display">
                                <span *ngIf="expectedNotes.length === 0" class="empty">None (Rest or End)</span>
                                <span *ngFor="let note of expectedNotes" class="note-badge expected">
                                    {{ note }} ({{ midiToNoteName(note) }})
                                </span>
                            </span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Playing:</span>
                            <span class="value notes-display">
                                <span *ngIf="activeNotes.length === 0" class="empty">None</span>
                                <span *ngFor="let note of activeNotes" class="note-badge playing">
                                    {{ note }} ({{ midiToNoteName(note) }})
                                </span>
                            </span>
                        </div>
                        <div class="debug-item">
                            <span class="label">MIDI Connected:</span>
                            <span class="value" [style.color]="midiService.connected() ? '#4caf50' : '#f44336'">
                                {{ midiService.connected() ? 'Connected' : 'Disconnected' }}
                            </span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Active Notes Count:</span>
                            <span class="value">{{ activeNotes.length }}</span>
                        </div>
                    </div>
                </div>

                <!-- Evaluation State -->
                <div class="debug-section">
                    <h4>Evaluation State</h4>
                    <div class="debug-grid">
                        <div class="debug-item">
                            <span class="label">Waiting for Release:</span>
                            <span class="value" [style.color]="waitingForRelease ? '#ff9800' : '#4caf50'">
                                {{ waitingForRelease ? "YES - Release keys to continue" : "Ready" }}
                            </span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Notes to Release:</span>
                            <span class="value">{{ notesToRelease }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Last Evaluated Key:</span>
                            <span class="value">{{ lastEvaluatedNotes || 'None' }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Last Result:</span>
                            <span class="value" [class.correct]="evaluationService.lastResult()?.pitch_correct"
                                  [class.incorrect]="evaluationService.lastResult() && !evaluationService.lastResult()?.pitch_correct">
                                {{ evaluationService.lastResult() ? (evaluationService.lastResult()?.pitch_correct ? 'Correct' : 'Wrong') : 'Waiting...' }}
                            </span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Note Played In Window:</span>
                            <span class="value" [style.color]="notePlayedInWindow ? '#4caf50' : '#666'">
                                {{ notePlayedInWindow ? 'Yes' : 'No' }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Session Stats -->
                <div class="debug-section">
                    <h4>Session Stats</h4>
                    <div class="debug-grid">
                        <div class="debug-item">
                            <span class="label">Total Evaluated:</span>
                            <span class="value">{{ evaluationService.stats()?.total_notes ?? 0 }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Correct Notes:</span>
                            <span class="value" style="color: #4caf50">{{ evaluationService.stats()?.correct_notes ?? 0 }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Wrong Notes:</span>
                            <span class="value" style="color: #f44336">{{ (evaluationService.stats()?.total_notes ?? 0) - (evaluationService.stats()?.correct_notes ?? 0) }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Current Streak:</span>
                            <span class="value">{{ evaluationService.stats()?.current_streak ?? 0 }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Best Streak:</span>
                            <span class="value">{{ evaluationService.stats()?.best_streak ?? 0 }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Accuracy:</span>
                            <span class="value">{{ evaluationService.stats()?.accuracy?.toFixed(1) ?? 0 }}%</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Average Score:</span>
                            <span class="value" style="color: #9c27b0">{{ evaluationService.stats()?.average_score?.toFixed(1) ?? 0 }}</span>
                        </div>
                    </div>
                </div>

                <!-- Timing Info -->
                <div class="debug-section">
                    <h4>Timing Info</h4>
                    <div class="debug-grid">
                        <div class="debug-item">
                            <span class="label">Timing Window:</span>
                            <span class="value">{{ timingWindowMs }}ms</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Playback Position:</span>
                            <span class="value">{{ playbackService.currentTimeFormatted }} / {{ playbackService.totalDurationFormatted }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Playback Progress:</span>
                            <span class="value">{{ playbackService.progressPercent().toFixed(1) }}%</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Playback State:</span>
                            <span class="value">{{ playbackService.isPlaying() ? 'Playing' : playbackService.isPaused() ? 'Paused' : 'Stopped' }}</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Current Tempo:</span>
                            <span class="value">{{ playbackService.tempo() }} BPM</span>
                        </div>
                    </div>
                </div>

                <!-- Audio State -->
                <div class="debug-section">
                    <h4>Audio State</h4>
                    <div class="debug-grid">
                        <div class="debug-item">
                            <span class="label">Piano Volume:</span>
                            <span class="value">{{ (pianoService.volume() * 100).toFixed(0) }}%</span>
                        </div>
                        <div class="debug-item">
                            <span class="label">Piano Enabled:</span>
                            <span class="value" [style.color]="pianoService.enabled() ? '#4caf50' : '#f44336'">
                                {{ pianoService.enabled() ? 'Yes' : 'No' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </mat-expansion-panel>
    `,
    styles: [`
        .debug-panel {
            margin-bottom: 2rem;
            background: #f5f5f5;
            border: 1px solid #ddd;

            mat-icon {
                margin-right: 0.5rem;
            }
        }

        .debug-content {
            padding: 1rem 0;
        }

        .debug-section {
            margin-bottom: 1.5rem;

            h4 {
                margin: 0 0 0.75rem 0;
                font-size: 1rem;
                color: #333;
            }

            &:last-child {
                margin-bottom: 0;
            }
        }

        .debug-grid {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .debug-item {
            display: flex;
            align-items: flex-start;
            gap: 1rem;

            .label {
                font-weight: 600;
                color: #666;
                min-width: 150px;
            }

            .value {
                font-family: 'Courier New', monospace;
                color: #333;
                flex: 1;

                &.correct {
                    color: #4caf50;
                    font-weight: 600;
                }

                &.incorrect {
                    color: #f44336;
                    font-weight: 600;
                }
            }
        }

        .notes-display {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .note-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 500;

            &.expected {
                background: #e3f2fd;
                color: #1565c0;
                border: 2px solid #1976d2;
            }

            &.playing {
                background: #fff3e0;
                color: #e65100;
                border: 2px solid #ff9800;
            }
        }

        .empty {
            color: #999;
            font-style: italic;
        }
    `]
})
export class DebugPanelComponent {
    // Injected services
    midiService = inject(MidiService);
    evaluationService = inject(EvaluationService);
    playbackService = inject(PlaybackService);
    pianoService = inject(PianoSoundService);

    // Inputs from parent
    @Input() lesson: LessonDTO | null = null;
    @Input() currentMode: LessonMode = 'study_right_hand_no_timing';
    @Input() currentMeasureIndex = 0;
    @Input() currentNoteIndex = 0;
    @Input() globalNoteIndex = 0;
    @Input() playheadPosition = 0;
    @Input() playheadBeatPosition = 0;
    @Input() expectedNotes: number[] = [];
    @Input() activeNotes: number[] = [];
    @Input() waitingForRelease = false;
    @Input() notesToRelease = '';
    @Input() lastEvaluatedNotes = '';
    @Input() isTimingPlaying = false;
    @Input() notePlayedInWindow = false;
    @Input() isTimingEnabled = false;
    @Input() activeHands: 'left' | 'right' | 'both' = 'both';
    @Input() playerView: 'classic' | 'scrolling' = 'classic';
    @Input() timingWindowMs = 400;

    // Helper functions
    getModeLabel = getLessonModeLabel;
    midiToNoteName = midiToNoteName;
}
