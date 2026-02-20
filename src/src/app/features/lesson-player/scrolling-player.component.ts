import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChanges,
    computed,
    effect,
    inject,
    signal,
} from '@angular/core';
import { LessonDTO } from '../../core/models/lesson.model';
import {
    ChordNoteDTO,
    NoteDTO,
    RestNoteDTO,
    SingleNoteDTO,
    getStartBeat,
    isChordNote,
    isRestNote,
    isSingleNote,
} from '../../core/models/note.model';
import { EvaluationService } from '../../core/services/evaluation.service';
import { MidiService } from '../../core/services/midi.service';
import { PianoSoundService } from '../../core/services/piano-sound.service';
import { SoundService } from '../../core/services/sound.service';
import { KeyboardRange, KeySignature, LeftHandPattern, PracticeLoopRange, ScrollingNote, WrongNoteEvent } from './models/scrolling-note.model';
import { ExtendedStats } from './lesson-completion-dialog.component';
import { NotationStageComponent } from './notation-stage/notation-stage.component';
import { PlaybackControlsComponent } from './playback-controls/playback-controls.component';
import { VirtualKeyboardComponent } from './virtual-keyboard/virtual-keyboard.component';

/**
 * Scrolling Player Component
 * Guitar Hero / Synthesia style scrolling notation
 *
 * Layout:
 * - Zone A (15%): Top control bar (progress, tempo, mode) - PlaybackControlsComponent
 * - Zone B (60%): Scrolling stage with grand staff and playhead - NotationStageComponent
 * - Zone C (25%): Virtual keyboard - VirtualKeyboardComponent
 */
@Component({
    selector: 'app-scrolling-player',
    standalone: true,
    imports: [
        CommonModule,
        PlaybackControlsComponent,
        NotationStageComponent,
        VirtualKeyboardComponent,
    ],
    template: `
        <!-- Zone A: Top Control Bar -->
        <div class="zone-a">
            <app-playback-controls
                [isPlaying]="isPlaying()"
                [isAutoPlaying]="isAutoPlaying()"
                [progressPercent]="progressPercent()"
                [tempoPercent]="tempoPercent()"
                [playMode]="playMode()"
                [computerSoundEnabled]="computerSoundEnabled()"
                [pianoSoundEnabled]="pianoSoundEnabled()"
                [soundEffectsEnabled]="soundEffectsEnabled()"
                [isFullscreen]="isFullscreen()"
                [leftHandEnabled]="leftHandEnabled()"
                [leftHandLevel]="leftHandLevel()"
                [maxLeftHandLevel]="maxLeftHandLevel()"
                [rightHandEnabled]="rightHandEnabled()"
                [currentMeasure]="currentMeasure()"
                [totalMeasures]="totalMeasures"
                [loopRange]="loopRange()"
                (playToggle)="onPause()"
                (autoPlayToggle)="onAutoPlayToggle()"
                (computerSoundToggle)="onComputerSoundToggle()"
                (pianoSoundToggle)="onPianoSoundToggle()"
                (soundEffectsToggle)="onSoundEffectsToggle()"
                (restart)="onRestart()"
                (tempoChange)="onTempoChange($event)"
                (modeChange)="onModeChange($event)"
                (fullscreenToggle)="onFullscreenToggle()"
                (leftHandToggle)="onLeftHandToggle()"
                (leftHandLevelUp)="onLeftHandLevelUp()"
                (leftHandLevelDown)="onLeftHandLevelDown()"
                (rightHandToggle)="onRightHandToggle()"
                (jumpToMeasure)="jumpToMeasure($event)"
                (setLoopStart)="setLoopStart($event)"
                (setLoopEnd)="setLoopEnd($event)"
                (incrementLoopStart)="incrementLoopStart()"
                (decrementLoopStart)="decrementLoopStart()"
                (incrementLoopEnd)="incrementLoopEnd()"
                (decrementLoopEnd)="decrementLoopEnd()"
                (clearLoop)="clearLoop()">
            </app-playback-controls>
        </div>

        <!-- Zone B: Scrolling Stage -->
        <div class="zone-b">
            <app-notation-stage
                [scrollingNotes]="scrollingNotesArray()"
                [currentBeat]="currentBeat()"
                [playheadX]="playheadX()"
                [stageWidth]="stageWidth"
                [stageHeight]="stageHeight"
                [beatsPerMeasure]="beatsPerMeasure"
                [totalBeats]="totalBeats"
                [wrongNoteEvents]="wrongNoteEvents()"
                [keySignature]="keySignature()"
                [timeSignature]="lesson?.time_signature ?? null"
                [loopRange]="loopRange()"
                [currentActiveBeat]="currentActiveBeat()"
                [autoPlayPatternKeys]="autoPlayLeftHandKeys()">
            </app-notation-stage>
        </div>

        <!-- Zone C: Virtual Keyboard -->
        <div class="zone-c">
            <app-virtual-keyboard
                [keyboardRange]="keyboardRange()"
                [hintNotes]="hintNotes()"
                [activeNotes]="activeNotesArray()"
                [correctNotes]="correctNotes()"
                [wrongNotes]="wrongNotes()"
                [tonicNotes]="tonicNotes()">
            </app-virtual-keyboard>
        </div>

        <!-- Debug Panel Overlay -->
        @if (showDebugPanel()) {
            <div class="debug-panel-overlay">
                <div class="debug-panel">
                    <div class="debug-header">
                        <h3>DEBUG: Notes Info</h3>
                        <button class="close-btn" (click)="showDebugPanel.set(false)">✕</button>
                    </div>
                    <div class="debug-stats">
                        <span>{{ debugTimestamp() }}</span>
                        <span>Total: {{ scrollingNotes.length }}</span>
                        <span>Beat: {{ currentBeat().toFixed(2) }}</span>
                        <span>Playing: {{ isPlaying() ? 'YES' : 'NO' }}</span>
                    </div>

                    <!-- Player Info Section -->
                    <div class="debug-player-info">
                        <div class="player-info-row">
                            <span class="info-label">🎵 Lesson:</span>
                            <span class="info-value">{{ lesson?.title ?? 'N/A' }}</span>
                        </div>
                        <div class="player-info-row">
                            <span class="info-label">⏱️ Tempo:</span>
                            <span class="info-value">{{ lesson?.tempo ?? 0 }} BPM × {{ tempoPercent() }}% = {{ ((lesson?.tempo ?? 120) * tempoPercent() / 100).toFixed(0) }} BPM</span>
                        </div>
                        <div class="player-info-row">
                            <span class="info-label">🎼 Time Sig:</span>
                            <span class="info-value">{{ lesson?.time_signature ?? 'N/A' }} ({{ beatsPerMeasure }} beats/measure)</span>
                        </div>
                        <div class="player-info-row">
                            <span class="info-label">🔑 Key:</span>
                            <span class="info-value">{{ lesson?.key_signature ?? 'N/A' }}</span>
                        </div>
                        <div class="player-info-row">
                            <span class="info-label">📍 Position:</span>
                            <span class="info-value">Beat {{ currentBeat().toFixed(2) }} / {{ totalBeats.toFixed(2) }} ({{ progressPercent().toFixed(1) }}%)</span>
                        </div>
                        <div class="player-info-row">
                            <span class="info-label">▶️ State:</span>
                            <span class="info-value" [style.color]="isPlaying() ? '#4CAF50' : '#FFA726'">
                                {{ isPlaying() ? '▶ Playing' : '⏸ Paused' }}
                                {{ isAutoPlaying() ? ' (Auto-Play)' : '' }}
                            </span>
                        </div>
                        <div class="player-info-row">
                            <span class="info-label">🎮 Mode:</span>
                            <span class="info-value">{{ playMode() === 'wait' ? '⏸ Wait Mode' : '▶ Flow Mode' }}</span>
                        </div>
                        <div class="player-info-row">
                            <span class="info-label">🖐️ Hands:</span>
                            <span class="info-value">
                                <span [style.color]="leftHandEnabled() ? '#4CAF50' : '#666'">L:{{ leftHandEnabled() ? 'ON' : 'OFF' }}</span> |
                                <span [style.color]="rightHandEnabled() ? '#4CAF50' : '#666'">R:{{ rightHandEnabled() ? 'ON' : 'OFF' }}</span>
                            </span>
                        </div>
                        <div class="player-info-row">
                            <span class="info-label">🔊 Sound:</span>
                            <span class="info-value">
                                <span [style.color]="computerSoundEnabled() ? '#4CAF50' : '#666'">Computer:{{ computerSoundEnabled() ? 'ON' : 'OFF' }}</span> |
                                <span [style.color]="pianoSoundEnabled() ? '#4CAF50' : '#666'">Piano:{{ pianoSoundEnabled() ? 'ON' : 'OFF' }}</span> |
                                <span [style.color]="soundEffectsEnabled() ? '#4CAF50' : '#666'">FX:{{ soundEffectsEnabled() ? 'ON' : 'OFF' }}</span>
                            </span>
                        </div>
                        <div class="player-info-row">
                            <span class="info-label">🖥️ Display:</span>
                            <span class="info-value">
                                {{ isFullscreen() ? '🖥️ Fullscreen' : '📱 Windowed' }} |
                                Stage: {{ stageWidth }}×{{ stageHeight }} |
                                Playhead: {{ playheadX() }}px
                            </span>
                        </div>
                        <div class="player-info-row">
                            <span class="info-label">🎹 Keyboard:</span>
                            <span class="info-value">
                                Range: {{ keyboardRange().min }}-{{ keyboardRange().max }} |
                                Hints: {{ hintNotes().length }} |
                                Active: {{ activeNotesArray().length }}
                            </span>
                        </div>
                        <div class="player-info-row">
                            <span class="info-label">⚙️ Timing:</span>
                            <span class="info-value">
                                Hit Window: {{ HIT_WINDOW_BEATS_PUBLIC }}beats |
                                Early: {{ EARLY_THRESHOLD_BEATS_PUBLIC }}b |
                                Late: {{ LATE_THRESHOLD_BEATS_PUBLIC }}b
                            </span>
                        </div>
                        <div class="player-info-row">
                            <span class="info-label">📝 Notes:</span>
                            <span class="info-value">
                                Total: {{ scrollingNotes.length }} |
                                Upcoming: {{ getUpcomingCount() }} |
                                Active: {{ getActiveCount() }} |
                                Hit: {{ getHitCount() }} |
                                Missed: {{ getMissedCount() }}
                            </span>
                        </div>
                    </div>

                    <!-- Statistics Section -->
                    <div class="debug-statistics">
                        <div class="stat-group">
                            <span class="stat-label">Accuracy:</span>
                            <span class="stat-value">{{ debugStats().hitCount }}/{{ debugStats().totalNotes }} ({{ debugStats().accuracy }}%)</span>
                        </div>
                        <div class="stat-group">
                            <span class="stat-label">Timing:</span>
                            <span class="stat-value perfect">Perfect: {{ debugStats().perfectTiming }}</span>
                            <span class="stat-value early">Early: {{ debugStats().earlyTiming }}</span>
                            <span class="stat-value late">Late: {{ debugStats().lateTiming }}</span>
                        </div>
                        <div class="stat-group">
                            <span class="stat-label">Hold:</span>
                            <span class="stat-value">Avg: {{ debugStats().avgHoldRatio }}%</span>
                            <span class="stat-value perfect">Good: {{ debugStats().perfectHolds }}</span>
                            <span class="stat-value early">Short: {{ debugStats().earlyReleases }}</span>
                            <span class="stat-value late">Long: {{ debugStats().longHolds }}</span>
                        </div>
                        <div class="stat-group">
                            <span class="stat-label">Errors:</span>
                            <span class="stat-value wrong">Wrong: {{ debugStats().wrongNotes }}</span>
                            <span class="stat-value missed">Missed: {{ debugStats().missedCount }}</span>
                        </div>
                    </div>

                    <div class="debug-table-container">
                        <table class="debug-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Beat</th>
                                    <th>Dur</th>
                                    <th>Type</th>
                                    <th>Hand</th>
                                    <th>MIDI</th>
                                    <th>Notes</th>
                                    <th>State</th>
                                    <th>Held (ms)</th>
                                    <th>Expected</th>
                                    <th>Ratio</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (row of debugData(); track row.idx) {
                                    <tr [class.rest]="row.isRest" [class.active-note]="row.state === 'active'" [class.hit-note]="row.state === 'hit'">
                                        <td>{{ row.idx }}</td>
                                        <td>{{ row.beat }}</td>
                                        <td>{{ row.dur }}</td>
                                        <td>{{ row.type }}</td>
                                        <td>{{ row.hand[0].toUpperCase() }}</td>
                                        <td>{{ row.midi || '-' }}</td>
                                        <td>{{ row.names || (row.isRest ? 'REST' : '-') }}</td>
                                        <td>{{ row.state }}</td>
                                        <td>{{ row.heldMs }}</td>
                                        <td>{{ row.expectedMs }}</td>
                                        <td>{{ row.holdRatio }}</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        }
    `,
    styles: [`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            background: #1a1a2e;
            color: white;
        }

        /* Zone A: Control Bar - 15% height */
        .zone-a {
            height: 15%;
            min-height: 60px;
        }

        /* Zone B: Stage - 60% height */
        .zone-b {
            height: 60%;
            position: relative;
            overflow: hidden;
            background: linear-gradient(180deg, #0f0f23 0%, #1a1a2e 100%);
        }

        /* Zone C: Virtual Keyboard - 25% height */
        .zone-c {
            height: 25%;
            min-height: 100px;
            background: linear-gradient(180deg, #1a1a2e 0%, #0f0f23 100%);
            border-top: 2px solid #8B5CF6;
            padding: 1rem;
            box-sizing: border-box;
        }

        /* Debug Panel Overlay */
        .debug-panel-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .debug-panel {
            background: #1e1e2e;
            border: 2px solid #8B5CF6;
            border-radius: 8px;
            width: 90%;
            max-width: 900px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
        }

        .debug-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: #2d2d3d;
            border-bottom: 1px solid #444;
            border-radius: 6px 6px 0 0;

            h3 {
                margin: 0;
                color: #fff;
                font-size: 16px;
            }

            .close-btn {
                background: #e74c3c;
                color: white;
                border: none;
                border-radius: 4px;
                width: 28px;
                height: 28px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;

                &:hover {
                    background: #c0392b;
                }
            }
        }

        .debug-stats {
            display: flex;
            gap: 24px;
            padding: 10px 16px;
            background: #252535;
            border-bottom: 1px solid #444;
            font-size: 13px;

            span {
                color: #8B5CF6;
                font-weight: 600;
            }
        }

        .debug-statistics {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            padding: 12px 16px;
            background: #1a1a2a;
            border-bottom: 1px solid #444;
            font-size: 12px;

            .stat-group {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 4px 12px;
                background: #252535;
                border-radius: 4px;
            }

            .stat-label {
                color: #888;
                font-weight: 500;
            }

            .stat-value {
                color: #fff;
                font-weight: 600;
                font-family: monospace;

                &.perfect {
                    color: #4CAF50;
                }

                &.early {
                    color: #FFA726;
                }

                &.late {
                    color: #42A5F5;
                }

                &.wrong {
                    color: #EF5350;
                }

                &.missed {
                    color: #9E9E9E;
                }
            }
        }

        .debug-table-container {
            overflow: auto;
            flex: 1;
            padding: 8px;
        }

        .debug-player-info {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 8px;
            padding: 12px 16px;
            background: #1f1f2f;
            border-bottom: 1px solid #444;
            font-size: 11px;
        }

        .player-info-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 8px;
            background: #252535;
            border-radius: 4px;
            overflow: hidden;

            .info-label {
                color: #888;
                font-weight: 500;
                white-space: nowrap;
                min-width: 75px;
            }

            .info-value {
                color: #fff;
                font-family: monospace;
                font-size: 10px;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }

        .debug-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            font-family: monospace;

            th, td {
                padding: 6px 10px;
                text-align: left;
                border-bottom: 1px solid #333;
            }

            th {
                background: #2d2d3d;
                color: #8B5CF6;
                font-weight: 600;
                position: sticky;
                top: 0;
            }

            td {
                color: #ccc;
            }

            tr:hover {
                background: #2a2a3a;
            }

            tr.rest td {
                color: #666;
                font-style: italic;
            }

            tr.active-note {
                background: rgba(33, 150, 243, 0.2);
                td { color: #2196F3; }
            }

            tr.hit-note {
                background: rgba(76, 175, 80, 0.15);
                td { color: #4CAF50; }
            }
        }
    `]
})
export class ScrollingPlayerComponent implements AfterViewInit, OnChanges, OnDestroy {
    private _frameCount = 0;

    @Input() lesson: LessonDTO | null = null;
    @Input() activeNotes: number[] = [];

    @Output() completed = new EventEmitter<ExtendedStats>();
    @Output() paused = new EventEmitter<void>();

    // Extended statistics tracking
    private extendedStats: ExtendedStats = {
        perfectNotes: 0,
        earlyNotes: 0,
        lateNotes: 0,
        missedNotes: 0,
        earlyReleases: 0,
        wrongNotes: 0
    };

    private midiService = inject(MidiService);
    private evaluationService = inject(EvaluationService);
    private pianoService = inject(PianoSoundService);
    private soundService = inject(SoundService);
    private elementRef = inject(ElementRef);

    private animationId: number | null = null;
    private lastFrameTime = 0;

    // Dimensions
    stageWidth = 1200;
    stageHeight = 400;
    playheadX = signal(300); // 25% of 1200

    // State signals
    isPlaying = signal(false);
    isAutoPlaying = signal(false); // Auto-play mode (listen/demo)
    playMode = signal<'flow' | 'wait'>('wait');
    tempoPercent = signal(100);
    progressPercent = signal(0);
    currentBeat = signal(0);
    computerSoundEnabled = signal(true); // Computer sound playback on correct notes
    pianoSoundEnabled = signal(true); // Piano note sounds
    soundEffectsEnabled = signal(true); // Game sound effects (wrong notes, achievements, etc.)
    isFullscreen = signal(false);
    showDebugPanel = signal(false); // Debug panel visibility
    leftHandEnabled = signal(true); // Left hand (bass) enabled
    rightHandEnabled = signal(true); // Right hand (treble) enabled

    // Progressive left-hand practice
    leftHandPatterns = signal<LeftHandPattern[]>([]);
    leftHandLevel = signal(0); // 0=all auto-played, max=all user-played
    maxLeftHandLevel = computed(() => this.leftHandPatterns().length);
    enabledLeftHandPatternKeys = computed(() => {
        const patterns = this.leftHandPatterns();
        const level = this.leftHandLevel();
        const keys = new Set<string>();
        for (let i = 0; i < level && i < patterns.length; i++) {
            keys.add(patterns[i].midi.join(','));
        }
        return keys;
    });
    // Pattern keys for auto-played (greyed-out) LH notes — passed to notation-stage
    autoPlayLeftHandKeys = computed(() => {
        const level = this.leftHandLevel();
        const max = this.maxLeftHandLevel();
        if (!this.leftHandEnabled() || level >= max) return new Set<string>();
        const all = this.leftHandPatterns();
        const keys = new Set<string>();
        for (let i = level; i < all.length; i++) {
            keys.add(all[i].midi.join(','));
        }
        return keys;
    });

    // Scrolling notes state - using signal for change detection
    private _scrollingNotes = signal<ScrollingNote[]>([]);
    scrollingNotesArray = computed(() => this._scrollingNotes());
    // Public getter for tests and direct access
    get scrollingNotes(): ScrollingNote[] {
        return this._scrollingNotes();
    }
    private _totalBeats = 0;
    get totalBeats(): number {
        return this._totalBeats;
    }

    // Beats per measure from time signature (e.g., "4/4" -> 4)
    get beatsPerMeasure(): number {
        if (!this.lesson?.time_signature) return 4;
        const parts = this.lesson.time_signature.split('/');
        return parseInt(parts[0], 10) || 4;
    }

    // Current measure number (1-indexed) based on current beat
    // Clamps to 1 during lead-in period (negative beats)
    currentMeasure = computed(() => {
        const beat = this.currentBeat();
        const bpm = this.beatsPerMeasure;
        const measure = Math.floor(beat / bpm) + 1;
        return Math.max(1, measure);
    });

    // Total number of measures in the lesson
    get totalMeasures(): number {
        return Math.ceil(this._totalBeats / this.beatsPerMeasure);
    }

    // Timing thresholds (in beats)
    // These define when a note can be hit and how timing is judged
    private readonly HIT_WINDOW_BEATS = 0.35; // How far from the note start you can still hit it
    private readonly EARLY_THRESHOLD_BEATS = 0.2; // Hit this many beats early → "early" feedback
    private readonly LATE_THRESHOLD_BEATS = 0.3; // Hit this many beats late → "late" feedback
    // Note: Late threshold is more generous since reaction time naturally causes slight delays
    // At 100 BPM: early window = ±120ms, late window = ±180ms, perfect = middle zone
    private readonly LEAD_IN_BARS = 2; // Empty bars at start for user to prepare (flow mode only)

    // Legato tolerance settings (DSP feature for natural piano playing)
    // Allows overlap between notes during legato playing without triggering false errors
    // When user plays legato (C->D), Note A release and Note B attack overlap for 50-150ms
    // This window allows that overlap without triggering "wrong note" errors
    private readonly LEGATO_GRACE_WINDOW_MS = 150;

    // Completion buffer: extra beats to scroll past the last note visually
    // This lets the playhead scroll past the final note before showing statistics
    // 2 beats = half a measure in 4/4 time, enough visual feedback without delay
    // At 80 pixels/beat, 2 beats = 160px scroll after last note
    private readonly COMPLETION_BUFFER_BEATS = 2;

    // Track the last correctly hit note for legato detection
    private lastHitNote: ScrollingNote | null = null;
    private lastHitNoteTimestamp = 0;

    // Track held notes for early release detection
    private heldNotesMap = new Map<ScrollingNote, Set<number>>(); // note -> set of held MIDI values
    private previousActiveNotes: number[] = [];

    // Track note timing for statistics
    private noteTimingMap = new Map<ScrollingNote, { startTime: number; expectedDurationMs: number }>(); // note -> timing info

    // Track when all notes became complete (for completion buffer timing)
    // This ensures we scroll for the full buffer duration after the last note
    private allNotesCompleteBeat: number | null = null;

    // Keyboard state - signals for child component
    keyboardRange = signal<KeyboardRange>({ min: 48, max: 72 });
    hintNotes = signal<number[]>([]);
    // The beat position of the latest active note group — used by the notation stage
    // to decide which notes to render at the playhead (vs. at their natural position)
    currentActiveBeat = signal<number | null>(null);
    correctNotes = signal<number[]>([]);
    wrongNotes = signal<number[]>([]);

    // Wrong note events for visual feedback on stage (persist until replay)
    wrongNoteEvents = signal<WrongNoteEvent[]>([]);

    // Practice loop range for focused measure practice
    loopRange = signal<PracticeLoopRange | null>(null);

    // Computed: is loop active
    isLoopActive = computed(() => this.loopRange() !== null);

    // Computed: loop start beat position
    private loopStartBeat = computed(() => {
        const range = this.loopRange();
        if (!range) return 0;
        return (range.startMeasure - 1) * this.beatsPerMeasure;
    });

    // Computed: loop end beat position
    private loopEndBeat = computed(() => {
        const range = this.loopRange();
        if (!range) return this._totalBeats;
        return range.endMeasure * this.beatsPerMeasure;
    });

    // Parsed key signature for notation display
    keySignature = computed<KeySignature | null>(() => {
        if (!this.lesson?.key_signature) return null;
        return this.parseKeySignature(this.lesson.key_signature);
    });

    // Tonic notes (note % 12 values) for keyboard highlighting
    tonicNotes = computed<number[]>(() => {
        const keySig = this.keySignature();
        if (!keySig) return [];
        // Map root note name to MIDI % 12 value
        const rootMap: Record<string, number> = {
            'C': 0, 'C#': 1, 'DB': 1, 'D♭': 1,
            'D': 2, 'D#': 3, 'EB': 3, 'E♭': 3,
            'E': 4, 'F': 5, 'F#': 6, 'GB': 6, 'G♭': 6,
            'G': 7, 'G#': 8, 'AB': 8, 'A♭': 8,
            'A': 9, 'A#': 10, 'BB': 10, 'B♭': 10,
            'B': 11
        };
        const rootValue = rootMap[keySig.root.toUpperCase()] ?? 0;
        return [rootValue];
    });

    // Computed: active notes as array for child
    activeNotesArray = computed(() => Array.from(this.midiService.activeNotes()));

    // Computed: debug timestamp with milliseconds
    debugTimestamp = signal('');

    // Computed: debug data for UI panel
    debugData = computed(() => {
        const notes = this._scrollingNotes();
        return notes.slice(0, 30).map((n, i) => ({
            idx: i,
            beat: n.startBeat.toFixed(2),
            dur: n.durationBeats,
            type: n.durationBeats >= 4 ? 'WHOLE' : n.durationBeats >= 2 ? 'HALF' : n.durationBeats >= 1 ? 'QUARTER' : 'EIGHTH+',
            hand: n.hand,
            midi: n.midi.join(','),
            names: n.midi.map(m => this.midiToNoteName(m)).join(','),
            isRest: n.isRest,
            state: n.state,
            heldMs: n.heldDurationMs?.toFixed(0) ?? '-',
            expectedMs: n.expectedDurationMs?.toFixed(0) ?? '-',
            holdRatio: n.expectedDurationMs && n.heldDurationMs
                ? ((n.heldDurationMs / n.expectedDurationMs) * 100).toFixed(0) + '%'
                : '-'
        }));
    });

    // Public getters for timing constants (for debug panel)
    get HIT_WINDOW_BEATS_PUBLIC(): number { return this.HIT_WINDOW_BEATS; }
    get EARLY_THRESHOLD_BEATS_PUBLIC(): number { return this.EARLY_THRESHOLD_BEATS; }
    get LATE_THRESHOLD_BEATS_PUBLIC(): number { return this.LATE_THRESHOLD_BEATS; }

    // Helper methods for note counts (for debug panel)
    getUpcomingCount(): number {
        return this.scrollingNotes.filter(n => n.state === 'upcoming').length;
    }

    getActiveCount(): number {
        return this.scrollingNotes.filter(n => n.state === 'active').length;
    }

    getHitCount(): number {
        return this.scrollingNotes.filter(n => n.state === 'hit').length;
    }

    getMissedCount(): number {
        return this.scrollingNotes.filter(n => n.state === 'missed').length;
    }

    // Computed: overall statistics
    debugStats = computed(() => {
        const notes = this._scrollingNotes();
        const hitNotes = notes.filter(n => n.state === 'hit' && !n.isRest);
        const missedNotes = notes.filter(n => n.state === 'missed');
        const totalPlayable = notes.filter(n => !n.isRest).length;

        // Timing stats
        const notesWithTiming = hitNotes.filter(n => n.heldDurationMs && n.expectedDurationMs);
        const avgHoldRatio = notesWithTiming.length > 0
            ? notesWithTiming.reduce((sum, n) => sum + (n.heldDurationMs! / n.expectedDurationMs!), 0) / notesWithTiming.length
            : 0;

        const perfectHolds = notesWithTiming.filter(n => {
            const ratio = n.heldDurationMs! / n.expectedDurationMs!;
            return ratio >= 0.8 && ratio <= 1.2; // Within 20% of expected
        }).length;

        const earlyReleases = notesWithTiming.filter(n => (n.heldDurationMs! / n.expectedDurationMs!) < 0.5).length;
        const longHolds = notesWithTiming.filter(n => (n.heldDurationMs! / n.expectedDurationMs!) > 1.5).length;

        // Timing feedback stats
        const perfectTiming = hitNotes.filter(n => n.timingFeedback === 'perfect').length;
        const earlyTiming = hitNotes.filter(n => n.timingFeedback === 'early').length;
        const lateTiming = hitNotes.filter(n => n.timingFeedback === 'late').length;

        return {
            totalNotes: totalPlayable,
            hitCount: hitNotes.length,
            missedCount: missedNotes.length,
            accuracy: totalPlayable > 0 ? ((hitNotes.length / totalPlayable) * 100).toFixed(1) : '0',
            avgHoldRatio: (avgHoldRatio * 100).toFixed(0),
            perfectHolds,
            earlyReleases,
            longHolds,
            perfectTiming,
            earlyTiming,
            lateTiming,
            wrongNotes: this.extendedStats.wrongNotes
        };
    });

    /**
     * Handle fullscreen change events (e.g., when user presses ESC)
     */
    private handleFullscreenChange = () => {
        this.isFullscreen.set(!!document.fullscreenElement);
    };

    constructor() {
        // React to MIDI input
        effect(() => {
            const active = Array.from(this.midiService.activeNotes());
            this.handleMidiInput(active);
        }, { allowSignalWrites: true });
    }

    ngAfterViewInit() {
        console.log('[ScrollingPlayer] ngAfterViewInit');

        if (this.lesson) {
            console.log('[ScrollingPlayer] Initializing notes...');
            this.initializeNotes();
            this.updateKeyboardRange();
            console.log('[ScrollingPlayer] Notes initialized:', this.scrollingNotes.length);
        }

        // Listen for fullscreen changes (e.g., when user presses ESC)
        document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log('[ScrollingPlayer] ngOnChanges', changes);
        if (changes['lesson'] && this.lesson) {
            this.initializeNotes();
            this.updateKeyboardRange();
        }
    }

    ngOnDestroy() {
        console.log('[ScrollingPlayer] ngOnDestroy');
        this.stop();

        // Clean up fullscreen event listener
        document.removeEventListener('fullscreenchange', this.handleFullscreenChange);

        // Exit fullscreen if currently in fullscreen mode
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => {
                console.error('[ScrollingPlayer] Error exiting fullscreen on destroy:', err);
            });
        }
    }

    private initializeNotes() {
        if (!this.lesson) return;

        const notes: ScrollingNote[] = [];
        let fallbackBeatPosition = 0; // Used only when start_beat is not provided
        let maxBeat = 0; // Track the maximum beat position for total duration

        // Calculate measure offset using time signature (e.g., 4/4 = 4 beats per measure)
        const beatsPerMeasure = this.beatsPerMeasure;

        console.log('[ScrollingPlayer] === INITIALIZING NOTES ===');
        console.log('[ScrollingPlayer] Total measures:', this.lesson.measures.length);

        for (let measureIndex = 0; measureIndex < this.lesson.measures.length; measureIndex++) {
            const measure = this.lesson.measures[measureIndex];
            // Measure offset = (measure number - 1) * beats per measure
            // Measure numbers are 1-based, so first measure has offset 0
            const measureOffset = (measure.number - 1) * beatsPerMeasure;

            console.log(`[ScrollingPlayer] Measure ${measure.number} (offset: ${measureOffset}), notes: ${measure.notes.length}`);

            for (const note of measure.notes) {
                const duration = this.getNoteDuration(note);
                console.log('[ScrollingPlayer] Raw note:', JSON.stringify(note));
                console.log(`[ScrollingPlayer]   -> duration: ${duration}, isRest: ${isRestNote(note)}, isSingle: ${isSingleNote(note)}, isChord: ${isChordNote(note)}`);

                // Use start_beat from backend if available, otherwise calculate sequentially
                // Backend provides beat positions RELATIVE to each measure (0-based per measure)
                // We add measureOffset to convert to absolute position across the piece
                const backendStartBeat = getStartBeat(note);
                let startBeat: number;

                if (backendStartBeat !== undefined) {
                    // MXL file: start_beat is relative to measure, add offset for absolute position
                    startBeat = measureOffset + backendStartBeat;
                } else {
                    // YAML lesson: no start_beat, use sequential calculation
                    startBeat = fallbackBeatPosition;
                    fallbackBeatPosition += duration;
                }

                if (isRestNote(note)) {
                    // Rests: silent notes with no MIDI values
                    // They take up time and space but require no user input
                    const restNote = note as RestNoteDTO;
                    notes.push({
                        midi: [],
                        startBeat,
                        durationBeats: duration,
                        state: 'upcoming',
                        hand: (restNote.hand as 'left' | 'right') || 'right',
                        isRest: true
                    });
                } else {
                    // Regular notes (single or chord)
                    const midiValues = isSingleNote(note)
                        ? [(note as SingleNoteDTO).midi]
                        : isChordNote(note)
                            ? (note as ChordNoteDTO).midi
                            : [];

                    const hand = isSingleNote(note)
                        ? (note as SingleNoteDTO).hand as 'left' | 'right'
                        : isChordNote(note)
                            ? (note as ChordNoteDTO).hand as 'left' | 'right'
                            : 'right';

                    notes.push({
                        midi: midiValues,
                        startBeat,
                        durationBeats: duration,
                        state: 'upcoming',
                        hand,
                        isRest: false
                    });
                }

                // Track maximum beat position for total duration
                maxBeat = Math.max(maxBeat, startBeat + duration);
            }
        }

        // Sort notes by startBeat to ensure proper ordering for display and playback
        // Notes at the same beat position will be adjacent for proper visual grouping
        notes.sort((a, b) => a.startBeat - b.startBeat);

        // Debug: Log ALL notes to see exactly what we have
        console.log('[ScrollingPlayer] === ALL NOTES SUMMARY ===');
        console.log('[ScrollingPlayer] Total notes:', notes.length);
        for (let i = 0; i < notes.length; i++) {
            const n = notes[i];
            const noteType = n.durationBeats >= 4 ? 'WHOLE' : n.durationBeats >= 2 ? 'HALF' : n.durationBeats >= 1 ? 'QUARTER' : 'EIGHTH+';
            console.log(`  [${i}] beat=${n.startBeat.toFixed(2)}, dur=${n.durationBeats} (${noteType}), hand=${n.hand}, midi=[${n.midi.join(',')}], isRest=${n.isRest}`);
        }
        console.log('[ScrollingPlayer] === END NOTES SUMMARY ===');

        this._scrollingNotes.set(notes);
        this._totalBeats = maxBeat;
        this.currentBeat.set(0);
        this.progressPercent.set(0);

        // Extract unique left-hand patterns for progressive practice
        this.extractLeftHandPatterns();
    }

    /**
     * Extract unique left-hand chord/note patterns, sorted by frequency.
     * Called once after notes are initialized.
     */
    private extractLeftHandPatterns(): void {
        const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
        const frequencyMap = new Map<string, { midi: number[]; count: number }>();

        for (const note of this.scrollingNotes) {
            if (note.hand !== 'left' || note.isRest) continue;
            const sorted = [...note.midi].sort((a, b) => a - b);
            const key = sorted.join(',');
            const existing = frequencyMap.get(key);
            if (existing) {
                existing.count++;
            } else {
                frequencyMap.set(key, { midi: sorted, count: 1 });
            }
        }

        const patterns: LeftHandPattern[] = Array.from(frequencyMap.values())
            .sort((a, b) => b.count - a.count)
            .map(p => ({
                midi: p.midi,
                count: p.count,
                label: p.midi.map(m => {
                    const name = NOTE_NAMES[m % 12];
                    const octave = Math.floor(m / 12) - 1;
                    return `${name}${octave}`;
                }).join('+')
            }));

        this.leftHandPatterns.set(patterns);

        // Default: max level (backward compatible — user plays everything)
        if (this.leftHandEnabled()) {
            this.leftHandLevel.set(patterns.length);
        }

        console.log('[ScrollingPlayer] Left-hand patterns:', patterns.length, patterns);
    }

    private updateKeyboardRange() {
        if (this.scrollingNotes.length === 0) return;

        let minMidi = 127;
        let maxMidi = 0;

        for (const note of this.scrollingNotes) {
            // Skip rests (they have no MIDI values)
            if (note.isRest) continue;

            for (const midi of note.midi) {
                minMidi = Math.min(minMidi, midi);
                maxMidi = Math.max(maxMidi, midi);
            }
        }

        // If no notes found (only rests), use default range
        if (minMidi > maxMidi) {
            this.keyboardRange.set({ min: 48, max: 72 }); // Default 2 octaves around middle C
            return;
        }

        // Add some padding and snap to octave boundaries
        minMidi = Math.max(21, Math.floor((minMidi - 5) / 12) * 12);
        maxMidi = Math.min(108, Math.ceil((maxMidi + 5) / 12) * 12);

        console.log('[ScrollingPlayer] Keyboard range updated:', { min: minMidi, max: maxMidi });
        this.keyboardRange.set({ min: minMidi, max: maxMidi });
    }

    private getNoteDuration(note: NoteDTO): number {
        if (isRestNote(note)) return note.duration;
        if (isSingleNote(note)) return (note as SingleNoteDTO).duration;
        if (isChordNote(note)) return (note as ChordNoteDTO).duration;
        return 1;
    }

    // === Playback Control ===

    start() {
        if (this.isPlaying()) {
            console.log('[ScrollingPlayer] start() called but already playing');
            return;
        }
        console.log('[ScrollingPlayer] Starting playback...');

        // Start with lead-in bars so user has time to prepare (flow mode only)
        // Wait mode doesn't need lead-in since it waits for user input
        if (this.currentBeat() === 0 && this.playMode() === 'flow') {
            const leadInBeats = this.LEAD_IN_BARS * this.beatsPerMeasure;
            this.currentBeat.set(-leadInBeats);
            console.log('[ScrollingPlayer] Starting with', this.LEAD_IN_BARS, 'lead-in bars (', -leadInBeats, 'beats)');
        }

        this.isPlaying.set(true);
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    stop() {
        console.log('[ScrollingPlayer] Stopping playback...');
        this.isPlaying.set(false);
        if (this.animationId !== null) {
            console.log('[ScrollingPlayer] Cancelling animation frame', this.animationId);
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        // Clear the active beat so the cursor doesn't show stale note positions
        // (e.g. after stopping from a loop range, the notation stage would otherwise
        // keep rendering notes at the old active beat on empty bars).
        this.currentActiveBeat.set(null);
    }

    toggle() {
        if (this.isPlaying()) {
            this.stop();
        } else {
            this.start();
        }
    }

    onPause() {
        console.log('[ScrollingPlayer] Pause button clicked');
        this.toggle();
        this.paused.emit();
    }

    /**
     * Show debug information panel on UI
     */
    private showDebugInfo() {
        // Toggle debug panel visibility
        this.showDebugPanel.set(!this.showDebugPanel());

        // Update timestamp with milliseconds
        const now = new Date();
        const timestamp = now.toLocaleTimeString('en-US', { hour12: false }) + '.' + now.getMilliseconds().toString().padStart(3, '0');
        this.debugTimestamp.set(timestamp);

        // Also log to console for additional debugging
        const notes = this.scrollingNotes;
        console.log('%c=== NOTES DEBUG INFO (PAUSE) ===', 'background: yellow; color: black; font-size: 16px; font-weight: bold;');
        console.log(`Total notes: ${notes.length}`);
        console.log(`Current beat: ${this.currentBeat().toFixed(2)}`);
        console.table(notes.slice(0, 30).map((n, i) => ({
            idx: i,
            beat: n.startBeat.toFixed(2),
            dur: n.durationBeats,
            type: n.durationBeats >= 4 ? 'WHOLE' : n.durationBeats >= 2 ? 'HALF' : n.durationBeats >= 1 ? 'QUARTER' : 'EIGHTH+',
            hand: n.hand,
            midi: n.midi.join(','),
            names: n.midi.map(m => this.midiToNoteName(m)).join(','),
            isRest: n.isRest,
            state: n.state
        })));
        console.log('%c=== END DEBUG INFO ===', 'background: yellow; color: black; font-size: 16px; font-weight: bold;');
    }

    /**
     * Convert MIDI number to note name for debugging
     */
    private midiToNoteName(midi: number): string {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midi / 12) - 1;
        const noteName = noteNames[midi % 12];
        return `${noteName}${octave}`;
    }

    onRestart() {
        console.log('[ScrollingPlayer] Restart button clicked');
        this.restart();
    }

    /**
     * Restart the lesson from the beginning
     */
    restart() {
        // Stop playback and auto-play
        this.stop();
        this.isAutoPlaying.set(false);
        this.pianoService.stopAll();

        // Reset beat position - to loop start if loop is active, otherwise to beginning
        const startBeat = this.isLoopActive() ? this.loopStartBeat() : 0;
        this.currentBeat.set(startBeat);
        this.progressPercent.set(this._totalBeats > 0 ? (startBeat / this._totalBeats) * 100 : 0);

        // Reset all notes to upcoming state
        for (const note of this.scrollingNotes) {
            note.state = 'upcoming';
            note.timingFeedback = undefined;
            note.hitBeat = undefined;
            note.releasedEarly = undefined;
            note.wasReplayed = undefined;
            // Clear timing data
            note.heldDurationMs = undefined;
            note.expectedDurationMs = undefined;
            note.pressedAtMs = undefined;
        }

        // Clear tracking maps
        this.heldNotesMap.clear();
        this.noteTimingMap.clear();
        this.previousActiveNotes = [];

        // Clear legato tracking
        this.lastHitNote = null;
        this.lastHitNoteTimestamp = 0;

        // Reset completion tracking
        this.allNotesCompleteBeat = null;

        // Reset extended statistics
        this.extendedStats = {
            perfectNotes: 0,
            earlyNotes: 0,
            lateNotes: 0,
            missedNotes: 0,
            earlyReleases: 0,
            wrongNotes: 0
        };

        // Clear keyboard hints and wrong note events
        this.hintNotes.set([]);
        this.correctNotes.set([]);
        this.wrongNotes.set([]);
        this.wrongNoteEvents.set([]);

        // Reset evaluation service stats
        this.evaluationService.resetStats();

        console.log('[ScrollingPlayer] Lesson restarted');
    }

    /**
     * Jump to a specific measure number (1-indexed)
     * Resets notes at or after the position to 'upcoming' state
     * Preserves state of notes before the position
     */
    jumpToMeasure(measureNumber: number): void {
        // Clamp measure number to valid range
        const targetMeasure = Math.max(1, Math.min(measureNumber, this.totalMeasures));

        // Calculate target beat position (start of the measure)
        const targetBeat = (targetMeasure - 1) * this.beatsPerMeasure;

        // Stop any active playback
        if (this.isPlaying()) {
            this.stop();
        }
        if (this.isAutoPlaying()) {
            this.stopAutoPlay();
        }

        // Stop any currently playing sounds
        this.pianoService.stopAll();

        // Update beat position
        this.currentBeat.set(targetBeat);
        this.progressPercent.set(this._totalBeats > 0 ? (targetBeat / this._totalBeats) * 100 : 0);

        // Reset notes based on their position relative to the target beat
        for (const note of this.scrollingNotes) {
            const noteEndBeat = note.startBeat + note.durationBeats;

            if (noteEndBeat <= targetBeat) {
                // Notes that end before the target position: mark as hit (already passed)
                if (note.state !== 'hit') {
                    note.state = 'hit';
                }
            } else {
                // Notes at or after the target position: reset to upcoming
                note.state = 'upcoming';
                note.timingFeedback = undefined;
                note.hitBeat = undefined;
                note.releasedEarly = undefined;
                note.wasReplayed = undefined;
                note.heldDurationMs = undefined;
                note.expectedDurationMs = undefined;
                note.pressedAtMs = undefined;
            }
        }

        // Clear tracking maps
        this.heldNotesMap.clear();
        this.noteTimingMap.clear();
        this.previousActiveNotes = [];

        // Clear legato tracking
        this.lastHitNote = null;
        this.lastHitNoteTimestamp = 0;

        // Reset completion tracking
        this.allNotesCompleteBeat = null;

        // Clear keyboard hints and wrong note events
        this.hintNotes.set([]);
        this.correctNotes.set([]);
        this.wrongNotes.set([]);
        this.wrongNoteEvents.set([]);

        // Trigger change detection for notes
        this._scrollingNotes.set([...this.scrollingNotes]);

        console.log(`[ScrollingPlayer] Jumped to measure ${targetMeasure} (beat ${targetBeat})`);

        // Start playback from the new position
        this.start();
    }

    /**
     * Set the start measure for practice loop
     * If end is already set and start > end, swap them
     */
    setLoopStart(measure: number): void {
        const currentRange = this.loopRange();
        const clampedMeasure = Math.max(1, Math.min(measure, this.totalMeasures));

        if (currentRange && clampedMeasure > currentRange.endMeasure) {
            // Swap: start becomes end, new value becomes start
            this.loopRange.set({
                startMeasure: currentRange.endMeasure,
                endMeasure: clampedMeasure
            });
        } else if (currentRange) {
            this.loopRange.set({
                ...currentRange,
                startMeasure: clampedMeasure
            });
        } else {
            // First click - set both start and end to same measure
            this.loopRange.set({
                startMeasure: clampedMeasure,
                endMeasure: clampedMeasure
            });
            // Jump to loop start when first creating a loop
            this.jumpToLoopStart();
        }

        console.log('[ScrollingPlayer] Loop start set:', this.loopRange());
    }

    /**
     * Set the end measure for practice loop
     * If start is already set and end < start, swap them
     */
    setLoopEnd(measure: number): void {
        const currentRange = this.loopRange();
        const clampedMeasure = Math.max(1, Math.min(measure, this.totalMeasures));

        if (currentRange && clampedMeasure < currentRange.startMeasure) {
            // Swap: end becomes start, new value becomes end
            this.loopRange.set({
                startMeasure: clampedMeasure,
                endMeasure: currentRange.startMeasure
            });
        } else if (currentRange) {
            this.loopRange.set({
                ...currentRange,
                endMeasure: clampedMeasure
            });
        } else {
            // First click - set both start and end to same measure
            this.loopRange.set({
                startMeasure: clampedMeasure,
                endMeasure: clampedMeasure
            });
            // Jump to loop start when first creating a loop
            this.jumpToLoopStart();
        }

        console.log('[ScrollingPlayer] Loop end set:', this.loopRange());
    }

    /**
     * Clear the practice loop - return to full lesson playback
     */
    clearLoop(): void {
        this.loopRange.set(null);
        console.log('[ScrollingPlayer] Loop cleared');
    }

    /**
     * Increment the loop start measure
     */
    incrementLoopStart(): void {
        const range = this.loopRange();
        if (!range) return;

        const newStart = Math.min(range.startMeasure + 1, range.endMeasure);
        this.loopRange.set({
            ...range,
            startMeasure: newStart
        });
        console.log('[ScrollingPlayer] Loop start incremented to:', newStart);
        this.jumpToLoopStartIfOutside();
    }

    /**
     * Decrement the loop start measure
     */
    decrementLoopStart(): void {
        const range = this.loopRange();
        if (!range) return;

        const newStart = Math.max(range.startMeasure - 1, 1);
        this.loopRange.set({
            ...range,
            startMeasure: newStart
        });
        console.log('[ScrollingPlayer] Loop start decremented to:', newStart);
        // When decreasing start, jump to new start so user can practice from there
        this.jumpToLoopStart();
    }

    /**
     * Increment the loop end measure
     */
    incrementLoopEnd(): void {
        const range = this.loopRange();
        if (!range) return;

        const newEnd = Math.min(range.endMeasure + 1, this.totalMeasures);
        this.loopRange.set({
            ...range,
            endMeasure: newEnd
        });
        console.log('[ScrollingPlayer] Loop end incremented to:', newEnd);
        // Don't jump when increasing end - user might want to continue from current position
    }

    /**
     * Decrement the loop end measure
     */
    decrementLoopEnd(): void {
        const range = this.loopRange();
        if (!range) return;

        const newEnd = Math.max(range.endMeasure - 1, range.startMeasure);
        this.loopRange.set({
            ...range,
            endMeasure: newEnd
        });
        console.log('[ScrollingPlayer] Loop end decremented to:', newEnd);
        this.jumpToLoopStartIfOutside();
    }

    /**
     * Jump to the loop start position
     */
    private jumpToLoopStart(): void {
        const range = this.loopRange();
        if (!range) return;

        const startBeat = (range.startMeasure - 1) * this.beatsPerMeasure;

        // Stop playback
        if (this.isPlaying()) {
            this.stop();
        }

        // Set position to loop start
        this.currentBeat.set(startBeat);
        this.progressPercent.set(this._totalBeats > 0 ? (startBeat / this._totalBeats) * 100 : 0);

        // Reset notes in the loop range
        const endBeat = range.endMeasure * this.beatsPerMeasure;
        this.resetNotesInRange(startBeat, endBeat);

        console.log('[ScrollingPlayer] Jumped to loop start at beat:', startBeat);
    }

    /**
     * Jump to loop start only if current position is outside the loop range
     */
    private jumpToLoopStartIfOutside(): void {
        const range = this.loopRange();
        if (!range) return;

        const startBeat = (range.startMeasure - 1) * this.beatsPerMeasure;
        const endBeat = range.endMeasure * this.beatsPerMeasure;
        const currentBeat = this.currentBeat();

        // If current position is outside the loop range, jump to start
        if (currentBeat < startBeat || currentBeat >= endBeat) {
            this.jumpToLoopStart();
        }
    }

    /**
     * Reset notes within a beat range to 'upcoming' state
     * Used when looping back to practice the same section
     */
    private resetNotesInRange(startBeat: number, endBeat: number): void {
        for (const note of this.scrollingNotes) {
            // Reset notes that start within the range
            if (note.startBeat >= startBeat && note.startBeat < endBeat) {
                note.state = 'upcoming';
                note.timingFeedback = undefined;
                note.hitBeat = undefined;
                note.releasedEarly = undefined;
                note.wasReplayed = undefined;
                note.heldDurationMs = undefined;
                note.expectedDurationMs = undefined;
                note.pressedAtMs = undefined;
            }
        }

        // Clear tracking state
        this.heldNotesMap.clear();
        this.noteTimingMap.clear();
        this.wrongNoteEvents.set([]);

        // Trigger change detection
        this._scrollingNotes.set([...this.scrollingNotes]);
    }

    /**
     * Handle looping when reaching end of range
     * Returns the new beat position (loops back to start if needed)
     */
    private handleLoopBoundary(newBeat: number): number {
        const range = this.loopRange();
        if (!range) return newBeat;

        const endBeat = this.loopEndBeat();
        const startBeat = this.loopStartBeat();

        if (newBeat >= endBeat) {
            // Loop back to start
            console.log('[ScrollingPlayer] Looping back to measure', range.startMeasure);

            // Reset notes in the loop range to 'upcoming' state
            this.resetNotesInRange(startBeat, endBeat);

            return startBeat;
        }

        return newBeat;
    }

    onTempoChange(percent: number) {
        this.tempoPercent.set(percent);
    }

    onModeChange(mode: 'flow' | 'wait') {
        this.playMode.set(mode);
    }

    /**
     * Toggle auto-play mode (listen/demo)
     * In this mode, notes play automatically without MIDI input
     */
    onAutoPlayToggle() {
        if (this.isAutoPlaying()) {
            this.stopAutoPlay();
        } else {
            this.startAutoPlay();
        }
    }

    /**
     * Toggle computer sound playback
     * When enabled, plays piano sounds through computer speakers on correct notes
     */
    onComputerSoundToggle() {
        this.computerSoundEnabled.set(!this.computerSoundEnabled());
    }

    /**
     * Toggle piano sound playback
     * When enabled, plays piano sounds when user plays notes
     */
    onPianoSoundToggle() {
        this.pianoSoundEnabled.set(!this.pianoSoundEnabled());
        this.pianoService.toggle();
        console.log('[ScrollingPlayer] Piano sound toggled:', this.pianoSoundEnabled());
    }

    /**
     * Toggle sound effects
     * When enabled, plays game sound effects (wrong notes, achievements, etc.)
     */
    onSoundEffectsToggle() {
        this.soundEffectsEnabled.set(!this.soundEffectsEnabled());
        this.soundService.toggleSound();
        console.log('[ScrollingPlayer] Sound effects toggled:', this.soundEffectsEnabled());
    }

    /**
     * Toggle fullscreen mode
     * Enters/exits fullscreen mode for the scrolling player
     */
    async onFullscreenToggle() {
        try {
            if (!document.fullscreenElement) {
                // Fullscreen the document root so CDK overlays (dialogs) stay visible
                await document.documentElement.requestFullscreen();
                this.isFullscreen.set(true);
            } else {
                // Exit fullscreen
                await document.exitFullscreen();
                this.isFullscreen.set(false);
            }
        } catch (error) {
            console.error('[ScrollingPlayer] Fullscreen error:', error);
        }
    }

    /**
     * Toggle left hand (bass) playback.
     * OFF → level=0, ON → level=max.
     */
    onLeftHandToggle() {
        const wasEnabled = this.leftHandEnabled();
        this.leftHandEnabled.set(!wasEnabled);
        if (!wasEnabled) {
            this.leftHandLevel.set(this.maxLeftHandLevel());
        } else {
            this.leftHandLevel.set(0);
        }
        console.log('[ScrollingPlayer] Left hand toggled:', this.leftHandEnabled(),
            'level:', this.leftHandLevel());
    }

    /**
     * Increment progressive left-hand level (user plays one more pattern)
     */
    onLeftHandLevelUp() {
        const current = this.leftHandLevel();
        const max = this.maxLeftHandLevel();
        if (current < max) {
            this.leftHandLevel.set(current + 1);
            if (!this.leftHandEnabled()) {
                this.leftHandEnabled.set(true);
            }
            console.log('[ScrollingPlayer] LH level up:', this.leftHandLevel(), '/', max);
        }
    }

    /**
     * Decrement progressive left-hand level (auto-play one more pattern)
     */
    onLeftHandLevelDown() {
        const current = this.leftHandLevel();
        if (current > 0) {
            this.leftHandLevel.set(current - 1);
            if (current - 1 === 0) {
                this.leftHandEnabled.set(false);
            }
            console.log('[ScrollingPlayer] LH level down:', this.leftHandLevel());
        }
    }

    /**
     * Toggle right hand (treble) playback
     * When disabled, right hand notes are auto-completed (skipped)
     */
    onRightHandToggle() {
        this.rightHandEnabled.set(!this.rightHandEnabled());
        console.log('[ScrollingPlayer] Right hand toggled:', this.rightHandEnabled());
    }

    /**
     * Start auto-play mode
     * Starts from the current position (use restart first if you want to start from beginning)
     */
    startAutoPlay() {
        console.log('[ScrollingPlayer] Starting auto-play from current position...');

        // Stop any existing playback first to ensure clean state
        if (this.isPlaying()) {
            this.stop();
        }

        // Enable auto-play mode
        this.isAutoPlaying.set(true);
        // Enable computer sound for auto-play (so user can hear the playback)
        this.computerSoundEnabled.set(true);
        // Use flow mode for auto-play (continuous playback)
        this.playMode.set('flow');
        // Start playback from current position
        this.start();
    }

    /**
     * Stop auto-play mode
     */
    stopAutoPlay() {
        console.log('[ScrollingPlayer] Stopping auto-play...');
        this.isAutoPlaying.set(false);
        this.stop();
        this.pianoService.stopAll();
    }

    // === Game Loop ===

    private gameLoop() {
        if (!this.isPlaying()) {
            console.log('[ScrollingPlayer] gameLoop exit: not playing');
            return;
        }

        // Diagnostic: log every 60th frame
        if (!this._frameCount) this._frameCount = 0;
        this._frameCount++;
        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000;
        const bpm = (this.lesson?.tempo || 120) * (this.tempoPercent() / 100);
        const beatsPerSecond = bpm / 60;
        const beatDelta = beatsPerSecond * deltaTime;
        // Allow scrolling past the end so last note visually scrolls off.
        // Always scroll at least to the end of the last bar + buffer.
        // If notes complete after the last bar (e.g. missed notes with late window),
        // extend the cap to accommodate.
        const endOfSongBeat = this._totalBeats + this.COMPLETION_BUFFER_BEATS;
        const maxBeat = this.allNotesCompleteBeat !== null
            ? Math.max(this.allNotesCompleteBeat + this.COMPLETION_BUFFER_BEATS, endOfSongBeat)
            : endOfSongBeat;
        let newBeat = Math.min(this.currentBeat() + beatDelta, maxBeat);

        // Handle loop boundary (if loop is active)
        if (this.isLoopActive()) {
            newBeat = this.handleLoopBoundary(newBeat);
        }

        if (this._frameCount % 60 === 0) {
            console.log('[ScrollingPlayer] gameLoop frame', this._frameCount,
                'currentBeat:', this.currentBeat(),
                'isPlaying:', this.isPlaying(),
                'animationId:', this.animationId
            );
        }
        this.lastFrameTime = now;

        // Guard: If no notes, stop
        if (!this.scrollingNotes || this.scrollingNotes.length === 0) {
            console.warn('[ScrollingPlayer] No notes to scroll. Stopping playback.');
            this.stop();
            return;
        }

        // Note: We no longer stop immediately when all notes are hit.
        // Instead, we let the game loop continue until the completion buffer check
        // triggers, so the playhead visually scrolls past the last notes.

        // Wait mode: scroll continuously but pause when note reaches playhead
        if (this.playMode() === 'wait') {
            const nextNote = this.getNextUnhitNote();
            if (nextNote) {
                // Calculate the beat position when note would be at playhead
                const noteAtPlayheadBeat = nextNote.startBeat;

                // If advancing would move past the note's start, clamp to the note position
                if (newBeat >= noteAtPlayheadBeat && nextNote.state !== 'hit') {
                    // Note has reached playhead - pause here
                    newBeat = noteAtPlayheadBeat;

                    // Make note active if it wasn't already
                    if (nextNote.state === 'upcoming') {
                        nextNote.state = 'active';
                    }

                    // Update beat position to note position (pause at playhead)
                    this.currentBeat.set(newBeat);
                    // Progress: 0% until beat 0, then normal progress
                    const progress = newBeat <= 0 ? 0 : (newBeat / this._totalBeats) * 100;
                    this.progressPercent.set(progress);
                    // Show hints for ALL active notes at this position (both hands)
                    // This ensures both left and right hand notes are shown on keyboard
                    const activeNotes = this.getActiveNotes();
                    if (activeNotes.length > 0) {
                        this.updateHintsForNotes(activeNotes);
                    } else {
                        this.updateHints(nextNote);
                    }

                    // Keep the loop running but don't advance further
                    this.animationId = requestAnimationFrame(() => this.gameLoop());
                    return;
                }
            }
        }

        // Advance time (flow mode or wait mode still scrolling to next note)
        this.currentBeat.set(newBeat);
        // Progress: 0% until beat 0, then normal progress (capped at 100%)
        const progress = newBeat <= 0 ? 0 : Math.min((newBeat / this._totalBeats) * 100, 100);
        this.progressPercent.set(progress);

        // Update note states
        this.updateNoteStates();

        // Cleanup off-screen wrong note events (Feature 2: Ghost Note cleanup)
        // Remove events that have scrolled off the left edge of the screen
        this.cleanupOffscreenWrongNotes();

        // Determine the latest active beat — the note group the user should play NOW.
        // In flow mode, multiple note groups can be 'active' simultaneously due to
        // overlapping hit windows. We pick the LATEST one (highest startBeat) so the
        // cursor/hints only show the current note, not previous overlapping ones.
        let latestActiveBeat: number | null = null;
        for (const note of this.scrollingNotes) {
            if (note.state === 'active' && !note.isRest && this.isHandEnabled(note)) {
                if (latestActiveBeat === null || note.startBeat > latestActiveBeat) {
                    latestActiveBeat = note.startBeat;
                }
            }
        }
        this.currentActiveBeat.set(latestActiveBeat);

        // Update keyboard hints — show only the LATEST active note group.
        if (this.currentBeat() < 0 || latestActiveBeat === null) {
            this.clearHints();
        } else {
            const latestNotes = this.scrollingNotes.filter(
                n => n.state === 'active' && !n.isRest && this.isHandEnabled(n) &&
                     Math.abs(n.startBeat - latestActiveBeat!) < 0.01
            );
            if (latestNotes.length > 0) {
                this.updateHintsForNotes(latestNotes);
            } else {
                this.clearHints();
            }
        }

        // Track when all notes become complete (for completion buffer timing)
        // This ensures we scroll for the full buffer duration after the last note is hit
        const hasIncompleteNotes = this.scrollingNotes.some(
            n => n.state === 'upcoming' || n.state === 'active'
        );

        if (!hasIncompleteNotes && this.allNotesCompleteBeat === null) {
            // All notes just became complete - record the current beat
            this.allNotesCompleteBeat = newBeat;
            console.log('[ScrollingPlayer] All notes complete at beat:', newBeat.toFixed(2),
                'totalBeats:', this._totalBeats,
                'Will complete at beat:', (newBeat + this.COMPLETION_BUFFER_BEATS).toFixed(2));
        }

        // Check completion - always wait until the end of the last bar + buffer.
        // Even if all notes are hit early, keep scrolling to the end of the measure.
        // completionTargetBeat matches maxBeat so the beat cap and trigger are consistent.
        const completionTargetBeat = maxBeat;

        // Debug: Log progress toward completion every 60 frames after all notes complete
        if (this.allNotesCompleteBeat !== null && this._frameCount % 60 === 0) {
            console.log('[ScrollingPlayer] Buffer scroll progress:',
                'currentBeat:', newBeat.toFixed(2),
                'target:', completionTargetBeat.toFixed(2),
                'remaining:', (completionTargetBeat - newBeat).toFixed(2), 'beats');
        }

        // Skip completion check when loop is active (loop handles its own reset)
        if (!this.isLoopActive() && newBeat >= completionTargetBeat) {
            console.log('[ScrollingPlayer] COMPLETION TRIGGERED - newBeat:', newBeat,
                'completionTarget:', completionTargetBeat,
                'allNotesCompleteBeat:', this.allNotesCompleteBeat);
            this.stop();

            // Stay in fullscreen — dialog will overlay since we fullscreen
            // document.documentElement (not a child element), keeping CDK overlay visible.
            setTimeout(() => {
                this.completed.emit(this.calculateExtendedStats());
            }, 500);
            return;
        }

        // Continue loop
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Calculate extended statistics from the notes array
     */
    private calculateExtendedStats(): ExtendedStats {
        const stats: ExtendedStats = {
            perfectNotes: 0,
            earlyNotes: 0,
            lateNotes: 0,
            missedNotes: 0,
            earlyReleases: 0,
            wrongNotes: 0
        };

        for (const note of this.scrollingNotes) {
            if (note.state === 'missed') {
                stats.missedNotes++;
            } else if (note.state === 'hit') {
                switch (note.timingFeedback) {
                    case 'perfect':
                        stats.perfectNotes++;
                        break;
                    case 'early':
                        stats.earlyNotes++;
                        break;
                    case 'late':
                        stats.lateNotes++;
                        break;
                    case 'early_release':
                        stats.earlyReleases++;
                        break;
                    case 'replayed':
                        // Count replayed as a minor issue
                        stats.perfectNotes++;
                        break;
                    default:
                        stats.perfectNotes++;
                }
            }
        }

        // Add any wrong notes tracked during the session
        stats.wrongNotes = this.extendedStats.wrongNotes;

        return stats;
    }

    /**
     * Get the next note that hasn't been hit yet (for wait mode)
     * Skips rests and disabled hand notes
     */
    private getNextUnhitNote(): ScrollingNote | null {
        for (const note of this.scrollingNotes) {
            if ((note.state === 'upcoming' || note.state === 'active') && !note.isRest) {
                // Skip disabled hand notes
                if (!this.isHandEnabled(note)) continue;
                return note;
            }
        }
        return null;
    }

    private getActiveNote(): ScrollingNote | null {
        const current = this.currentBeat();
        for (const note of this.scrollingNotes) {
            // Skip rests - they don't require user input
            if (note.isRest) continue;

            // Skip disabled hand notes
            if (!this.isHandEnabled(note)) continue;

            if (note.state === 'upcoming' || note.state === 'active') {
                // Note is active if we're within the hit window of its start
                if (note.startBeat <= current + this.HIT_WINDOW_BEATS) {
                    return note;
                }
            }
        }
        return null;
    }

    /**
     * Check if a note should be played by the user (not auto-completed).
     * For left-hand notes in progressive mode, checks whether this specific
     * pattern is enabled at the current level.
     */
    private isHandEnabled(note: ScrollingNote): boolean {
        if (note.hand === 'right') return this.rightHandEnabled();
        if (note.hand === 'left') {
            if (!this.leftHandEnabled()) return false;
            const level = this.leftHandLevel();
            if (level === 0) return false;
            if (level >= this.maxLeftHandLevel()) return true;
            const key = [...note.midi].sort((a, b) => a - b).join(',');
            return this.enabledLeftHandPatternKeys().has(key);
        }
        return true;
    }

    /**
     * Get ALL active notes at the current beat position (enabled hands only)
     * This ensures hints show all notes that need to be played together
     */
    private getActiveNotes(): ScrollingNote[] {
        const current = this.currentBeat();
        const activeNotes: ScrollingNote[] = [];
        let firstActiveBeat: number | null = null;

        for (const note of this.scrollingNotes) {
            // Skip rests - they don't require user input
            if (note.isRest) continue;

            // Skip disabled hand notes
            if (!this.isHandEnabled(note)) continue;

            if (note.state === 'upcoming' || note.state === 'active') {
                // Note is active if we're within the hit window of its start
                if (note.startBeat <= current + this.HIT_WINDOW_BEATS) {
                    // Track the first active beat position
                    if (firstActiveBeat === null) {
                        firstActiveBeat = note.startBeat;
                    }
                    // Include all notes at the same beat position (enabled hands)
                    if (Math.abs(note.startBeat - firstActiveBeat) < 0.01) {
                        activeNotes.push(note);
                    }
                }
            }
        }
        return activeNotes;
    }

    /**
     * Get ALL notes at the current beat position, regardless of state
     * Used for wait mode to check if all notes at this beat are satisfied
     * Includes both hit and unhit notes at the current beat position
     */
    private getAllNotesAtCurrentBeat(): ScrollingNote[] {
        const current = this.currentBeat();
        const notes: ScrollingNote[] = [];
        let targetBeat: number | null = null;

        for (const note of this.scrollingNotes) {
            // Skip rests - they don't require user input
            if (note.isRest) continue;

            // Skip disabled hand notes
            if (!this.isHandEnabled(note)) continue;

            // Check if note is at or near the current playhead position
            if (note.startBeat <= current + this.HIT_WINDOW_BEATS &&
                note.startBeat >= current - this.HIT_WINDOW_BEATS) {
                // Track the first note's beat position
                if (targetBeat === null) {
                    targetBeat = note.startBeat;
                }
                // Include all notes at the same beat position
                if (Math.abs(note.startBeat - targetBeat) < 0.01) {
                    notes.push(note);
                }
            }
        }
        return notes;
    }

    /**
     * Get the next note to show in hints (the one AFTER the active note)
     * This lets the player prepare for what's coming next
     * Skips rests and disabled hand notes
     */
    private getNextNoteForHints(): ScrollingNote | null {
        let foundActive = false;
        for (const note of this.scrollingNotes) {
            // Skip rests
            if (note.isRest) continue;

            // Skip disabled hand notes
            if (!this.isHandEnabled(note)) continue;

            if (note.state === 'active') {
                foundActive = true;
                continue;
            }
            // Return the first upcoming note after the active one
            if (foundActive && note.state === 'upcoming') {
                return note;
            }
        }
        // If no active note yet, return the first upcoming note
        if (!foundActive) {
            for (const note of this.scrollingNotes) {
                if (note.state === 'upcoming' && !note.isRest && this.isHandEnabled(note)) {
                    return note;
                }
            }
        }
        return null;
    }

    private updateNoteStates() {
        const current = this.currentBeat();
        const isAutoPlay = this.isAutoPlaying();

        // Special handling for rests and disabled hands: automatically mark as 'hit' when playhead approaches
        // Rests don't require user input - they're just silence that takes up time
        // Disabled hand notes are also auto-completed to allow single-hand practice
        // Uses isHandEnabled() which respects progressive left-hand level
        // IMPORTANT: Auto-complete at the SAME timing as note activation (HIT_WINDOW_BEATS before startBeat)
        // This ensures disabled hand notes are completed before they would become "active" and block progress
        for (const note of this.scrollingNotes) {
            if (note.state === 'upcoming' && current >= note.startBeat - this.HIT_WINDOW_BEATS) {
                // Auto-complete rests
                if (note.isRest) {
                    note.state = 'hit';
                    continue;
                }

                // Auto-complete notes from disabled hands (or non-enabled progressive patterns)
                if (!this.isHandEnabled(note)) {
                    note.state = 'hit';
                    note.timingFeedback = 'perfect';
                    // Record timing data for auto-completed note
                    this.recordAutoCompleteTiming(note);
                    // Play the note automatically so user can hear full piece
                    if (this.computerSoundEnabled()) {
                        this.playNoteAutomatic(note);
                    }
                }
            }
        }

        // First pass: check for missed notes and count active notes
        let activeNoteCount = 0;
        for (const note of this.scrollingNotes) {
            // Skip rests - they're handled above
            if (note.isRest) continue;

            // Skip disabled hand notes - they're auto-completed above
            if (!this.isHandEnabled(note)) continue;

            if (note.state === 'active') {
                // Check if note was missed (passed playhead + window)
                if (current > note.startBeat + note.durationBeats + this.HIT_WINDOW_BEATS) {
                    // In auto-play mode, mark as hit (demo completed)
                    if (isAutoPlay) {
                        note.state = 'hit';
                        note.timingFeedback = 'perfect';
                        // Record timing data for auto-completed note
                        this.recordAutoCompleteTiming(note);
                    } else {
                        note.state = 'missed';
                        // Record miss
                        for (const midi of note.midi) {
                            this.evaluationService.checkPitch(0, midi, { skipSound: true });
                        }
                    }
                } else {
                    activeNoteCount++;
                }
            }
        }
        const hasActiveNote = activeNoteCount > 0;

        // Second pass: activate ALL notes at the same beat position within hit window
        // This ensures both hands play together when they have notes at the same beat
        // In wait mode: only activate if no notes are currently active (wait for user input)
        // In flow mode: always check for new notes to activate (continuous playback)
        if (!hasActiveNote || this.playMode() === 'flow') {
            let firstActiveBeat: number | null = null;

            for (const note of this.scrollingNotes) {
                // Skip rests - they never become active
                if (note.isRest) continue;

                // Skip disabled hand notes - they're auto-completed
                if (!this.isHandEnabled(note)) continue;

                if (note.state === 'upcoming') {
                    // Check if note should become active (near playhead)
                    if (current >= note.startBeat - this.HIT_WINDOW_BEATS) {
                        // Track the first note's beat position
                        if (firstActiveBeat === null) {
                            firstActiveBeat = note.startBeat;
                        }

                        // Activate all notes at the same beat position (both hands)
                        if (Math.abs(note.startBeat - firstActiveBeat) < 0.01) {
                            note.state = 'active';

                            // In auto-play mode, play the note automatically
                            if (isAutoPlay) {
                                this.playNoteAutomatic(note);
                            }
                        } else {
                            // Different beat position - stop activating
                            break;
                        }
                    }
                }
            }
        }
    }

    /**
     * Record timing data for auto-completed notes (disabled hands, auto-play)
     * Sets pressedAtMs, expectedDurationMs, and heldDurationMs as if perfectly played
     * Only records if not already recorded (prevents double-recording)
     */
    private recordAutoCompleteTiming(note: ScrollingNote): void {
        // Skip if timing already recorded
        if (note.pressedAtMs !== undefined) return;

        const bpm = (this.lesson?.tempo || 120) * (this.tempoPercent() / 100);
        const msPerBeat = (60 / bpm) * 1000;
        const expectedDurationMs = note.durationBeats * msPerBeat;

        note.pressedAtMs = performance.now();
        note.expectedDurationMs = expectedDurationMs;
        // Auto-completed notes are considered "perfect" - held for full duration
        note.heldDurationMs = expectedDurationMs;
    }

    /**
     * Play a note automatically (for auto-play/demo mode)
     */
    private playNoteAutomatic(note: ScrollingNote): void {
        // Record timing data for this auto-completed note
        this.recordAutoCompleteTiming(note);

        // Play sound for each MIDI note (if computer sound is enabled)
        if (this.computerSoundEnabled()) {
            for (const midi of note.midi) {
                this.pianoService.playNote(midi);
            }
        }

        // Flash keyboard to show which notes are playing
        this.flashKeys(note.midi, 'correct');

        // Schedule note off after duration (only if sound was played)
        if (this.computerSoundEnabled()) {
            const bpm = (this.lesson?.tempo || 120) * (this.tempoPercent() / 100);
            const msPerBeat = (60 / bpm) * 1000;
            const durationMs = note.durationBeats * msPerBeat * 0.9; // Release slightly early

            setTimeout(() => {
                for (const midi of note.midi) {
                    this.pianoService.stopNote(midi);
                }
            }, durationMs);
        }
    }

    // === MIDI Input Handling ===
    // Implements the "Consumption Algorithm" for intelligent note repetition handling

    private handleMidiInput(activeNotes: number[]) {
        // Cleanup old wrong notes (runs even when paused for time-based cleanup)
        this.cleanupOffscreenWrongNotes();

        // Detect released notes (were in previous, not in current)
        const releasedNotes = this.previousActiveNotes.filter(n => !activeNotes.includes(n));
        const newlyPressedNotes = activeNotes.filter(n => !this.previousActiveNotes.includes(n));

        // Check for early release on held notes
        this.checkEarlyRelease(releasedNotes);

        // Stop piano sound for released keys (damper effect)
        if (this.computerSoundEnabled() && releasedNotes.length > 0) {
            for (const midi of releasedNotes) {
                this.pianoService.stopNote(midi);
            }
        }

        // Update previous notes for next frame
        this.previousActiveNotes = [...activeNotes];

        // Handle wait mode when paused - check if we should resume
        // For two-hand scenarios: require SIMULTANEOUS playing (both hands held at same time)
        // Resume only when ALL notes at the current beat position are currently being held
        if (!this.isPlaying() && this.playMode() === 'wait') {
            // Get ALL notes at the current beat position (both hands, regardless of state)
            const allNotesAtBeat = this.getAllNotesAtCurrentBeat();

            if (allNotesAtBeat.length > 0) {
                // Check if ALL notes at this beat position are currently being held
                // Simultaneous requirement: ALL MIDI values must be held at the same time
                // Previously hit notes don't count - user must hold all notes simultaneously
                const allNotesHeld = allNotesAtBeat.every(note => {
                    // Check if ALL of this note's MIDI values are currently being held
                    return note.midi.every(midi => activeNotes.includes(midi));
                });

                if (allNotesHeld) {
                    this.start();
                }
            }
        }

        if (!this.isPlaying()) return;
        if (newlyPressedNotes.length === 0) return;

        // === CONSUMPTION ALGORITHM ===
        // For each newly pressed MIDI note, apply the consumption algorithm
        for (const inputPitch of newlyPressedNotes) {
            const result = this.consumeNote(inputPitch, activeNotes);

            if (result === 'hit') {
                // Note was successfully consumed - handled in consumeNote
            } else if (result === 'replay') {
                // Redundant replay error - already handled in consumeNote
            } else if (result === 'wrong') {
                // Wrong note - already handled in consumeNote
            }
            // 'ignored' means legato grace or no action needed
        }
    }

    /**
     * Consumption Algorithm: Process a single MIDI input
     * Returns: 'hit' | 'replay' | 'wrong' | 'ignored'
     */
    private consumeNote(
        inputPitch: number,
        allActiveNotes: number[]
    ): 'hit' | 'replay' | 'wrong' | 'ignored' {
        const currentBeat = this.currentBeat();

        // Step 1: Define the scope - find notes within hit window
        // Early window is tighter (1x) than late window to prevent premature hits
        const validTargets = this.scrollingNotes.filter(note => {
            const noteStart = note.startBeat;
            const noteEnd = note.startBeat + note.durationBeats;
            // Note is valid if we're within range of its start time (plus tolerance)
            // Early: can hit up to HIT_WINDOW_BEATS before note starts
            // Late: can hit up to HIT_WINDOW_BEATS after note ends
            return currentBeat >= noteStart - this.HIT_WINDOW_BEATS &&
                   currentBeat <= noteEnd + this.HIT_WINDOW_BEATS;
        });

        // Step 2: Filter for matching pitch
        const matchingPitchNotes = validTargets.filter(note => note.midi.includes(inputPitch));

        // Step 3: Check status - The Fork
        // Branch A: Is there a PENDING note (upcoming/active) with this pitch?
        const pendingMatch = matchingPitchNotes.find(
            note => note.state === 'upcoming' || note.state === 'active'
        );

        if (pendingMatch) {
            // SUCCESS: Consume this note instance
            return this.markNoteAsHit(pendingMatch, allActiveNotes);
        }

        // Branch B: Is there only a HIT note (already consumed) with this pitch?
        const consumedMatch = matchingPitchNotes.find(note => note.state === 'hit');

        if (consumedMatch) {
            // Check legato grace window before flagging as replay
            if (this.isWithinLegatoGraceWindow() && this.lastHitNote?.midi.includes(inputPitch)) {
                // Legato playing - previous note still releasing
                return 'ignored';
            }

            // REPLAY ERROR: User played a note that was already satisfied
            // But only if there's no upcoming note expecting this pitch
            const upcomingNeedsThis = this.scrollingNotes.find(
                note => (note.state === 'upcoming' || note.state === 'active') &&
                        note.midi.includes(inputPitch)
            );

            if (upcomingNeedsThis) {
                // Actually, this pitch is needed by an upcoming note - not a replay
                return 'ignored';
            }

            // True replay - same note hit twice with no new target
            // Don't mark as error for now, just track it
            return 'replay';
        }

        // Branch C: No match at all - WRONG NOTE
        // Check if there's an active note we're supposed to play
        const activeNote = this.getActiveNote();

        if (!activeNote) {
            // No active note, ignore the input
            return 'ignored';
        }

        // Check legato tolerance before flagging as wrong
        if (this.isWithinLegatoGraceWindow() && this.lastHitNote?.midi.includes(inputPitch)) {
            // Legato overlap from previous note
            return 'ignored';
        }

        // This is a genuinely wrong note
        this.recordWrongNote(inputPitch, activeNote);
        return 'wrong';
    }

    /**
     * Mark a note as successfully hit (consumed)
     */
    private markNoteAsHit(
        note: ScrollingNote,
        allActiveNotes: number[]
    ): 'hit' {
        const currentBeat = this.currentBeat();

        // For chords: check if ALL required notes are being played
        if (note.midi.length > 1) {
            const allChordNotesPressed = note.midi.every(m => allActiveNotes.includes(m));
            if (!allChordNotesPressed) {
                // Not all chord notes pressed yet - wait for complete chord
                return 'hit'; // Partial hit, don't mark as complete yet
            }
        }

        // Check timing: early, late, or perfect
        const timingOffset = currentBeat - note.startBeat;
        if (timingOffset < -this.EARLY_THRESHOLD_BEATS) {
            note.timingFeedback = 'early';
        } else if (timingOffset > this.LATE_THRESHOLD_BEATS) {
            note.timingFeedback = 'late';
        } else {
            note.timingFeedback = 'perfect';
        }

        // CONSUME: Mark as hit
        note.state = 'hit';
        note.hitBeat = currentBeat;

        // Track timing - record when note was pressed and expected duration
        const bpm = (this.lesson?.tempo || 120) * (this.tempoPercent() / 100);
        const msPerBeat = (60 / bpm) * 1000;
        const expectedDurationMs = note.durationBeats * msPerBeat;
        const pressedAtMs = performance.now();

        note.pressedAtMs = pressedAtMs;
        note.expectedDurationMs = expectedDurationMs;
        this.noteTimingMap.set(note, { startTime: pressedAtMs, expectedDurationMs });

        // Debug: Check if this is the last note
        const remainingNotes = this.scrollingNotes.filter(
            n => n.state === 'upcoming' || n.state === 'active'
        );
        if (remainingNotes.length === 0) {
            console.log('[ScrollingPlayer] LAST NOTE HIT - currentBeat:', currentBeat,
                'totalBeats:', this._totalBeats, 'buffer target:', this._totalBeats + this.COMPLETION_BUFFER_BEATS);
        }

        // Track this as the last hit note for legato detection
        this.lastHitNote = note;
        this.lastHitNoteTimestamp = performance.now();

        // Track which MIDI notes are being held for early release detection
        this.heldNotesMap.set(note, new Set(allActiveNotes.filter(n => note.midi.includes(n))));

        // Record success in evaluation service (skip sound — we handle it below)
        for (const midi of note.midi) {
            this.evaluationService.checkPitch(midi, midi, { skipSound: true });
        }

        // Play sound (if computer sound is enabled) — sustained until key release
        if (this.computerSoundEnabled()) {
            for (const midi of note.midi) {
                this.pianoService.playNote(midi);
            }
        }

        return 'hit';
    }

    /**
     * Record a wrong note (Feature 2: Ghost Note)
     *
     * In wait mode: if any note in a simultaneous group (same beat position)
     * is played wrong, ALL previously-hit notes in that group are reset to
     * 'active', forcing the user to replay the entire group correctly.
     */
    private recordWrongNote(wrongPitch: number, expectedNote: ScrollingNote): void {
        const currentBeat = this.currentBeat();
        const now = performance.now();

        // Track statistics
        this.extendedStats.wrongNotes++;

        // Create wrong note event for visual display (Ghost Note)
        const wrongEvent: WrongNoteEvent = {
            midi: wrongPitch,
            beat: currentBeat,
            timestamp: now
        };

        this.wrongNoteEvents.update(events => [...events, wrongEvent]);

        // Record in evaluation service
        const closestExpected = expectedNote.midi.reduce((closest, exp) =>
            Math.abs(exp - wrongPitch) < Math.abs(closest - wrongPitch) ? exp : closest
        );
        this.evaluationService.checkPitch(wrongPitch, closestExpected, { skipSound: true });

        // Flash wrong on keyboard
        this.flashKeys([wrongPitch], 'wrong');

        // Wait mode: reset ALL sibling notes at the same beat position back to 'active'.
        // This enforces "all-or-nothing" — if any note is wrong, the user must replay
        // the entire chord/simultaneous group together.
        if (this.playMode() === 'wait') {
            const targetBeat = expectedNote.startBeat;
            for (const note of this.scrollingNotes) {
                if (note.isRest) continue;
                if (!this.isHandEnabled(note)) continue;
                if (Math.abs(note.startBeat - targetBeat) > 0.01) continue;

                if (note.state === 'hit') {
                    note.state = 'active';
                    note.hitBeat = undefined;
                    note.timingFeedback = undefined;
                    note.pressedAtMs = undefined;
                    note.expectedDurationMs = undefined;
                    this.noteTimingMap.delete(note);
                    this.heldNotesMap.delete(note);
                }
            }
        }
    }

    /**
     * Cleanup wrong note events based on time (1 second) or position (off-screen)
     * Wrong notes should disappear after 1 second for better UX
     */
    private cleanupOffscreenWrongNotes(): void {
        const currentBeat = this.currentBeat();
        const now = performance.now();
        const pixelsPerBeat = 120; // Same as NotationStageComponent.PIXELS_PER_BEAT
        const playheadX = 300; // Same as NotationStageComponent default

        // Time-based cleanup: wrong notes disappear after 1 second
        const maxWrongNoteAgeMs = 1000;

        // Position-based cleanup: off-screen threshold
        const offscreenThresholdBeats = (playheadX + 50) / pixelsPerBeat;

        this.wrongNoteEvents.update(events =>
            events.filter(event => {
                // Remove if older than 1 second
                const ageMs = now - event.timestamp;
                if (ageMs > maxWrongNoteAgeMs) return false;

                // Remove if scrolled off-screen
                const beatsBehind = currentBeat - event.beat;
                if (beatsBehind >= offscreenThresholdBeats) return false;

                return true;
            })
        );
    }

    /**
     * Check if we're within the legato grace window from the last hit note
     */
    private isWithinLegatoGraceWindow(): boolean {
        if (!this.lastHitNote) return false;
        const elapsed = performance.now() - this.lastHitNoteTimestamp;
        return elapsed < this.LEGATO_GRACE_WINDOW_MS;
    }
    /**
     * Check note hit with legato tolerance
     * Implements "Target Priority" principle: if expected note is pressed, it's a hit
     * even if previous notes are still active (legato playing)
     */
    private checkNoteHitWithLegato(
        note: ScrollingNote,
        allActiveNotes: number[],
        newlyPressedNotes: number[]
    ): boolean {
        // Target Priority: Check if ALL required notes for this target are being played
        // Extra notes from previous legato playing are ignored
        const allTargetNotesPressed = note.midi.every(m => allActiveNotes.includes(m));

        if (!allTargetNotesPressed) {
            return false;
        }

        // If we have a previous hit note within the grace window,
        // we need at least ONE new note press that matches the target
        // This prevents "ghost hits" from held notes
        if (this.isWithinLegatoGraceWindow() && this.lastHitNote) {
            // Check if at least one target note was newly pressed
            const hasNewTargetPress = note.midi.some(m => newlyPressedNotes.includes(m));
            if (!hasNewTargetPress) {
                // All target notes were already being held - not a new hit
                return false;
            }
        }

        return true;
    }

    /**
     * Check if any notes were released early (before their duration ended)
     * Also records the held duration for statistics
     */
    private checkEarlyRelease(releasedNotes: number[]): void {
        if (releasedNotes.length === 0) return;

        const currentBeat = this.currentBeat();
        const now = performance.now();

        // Check each note that's being tracked for holding
        for (const [note, heldMidis] of this.heldNotesMap.entries()) {
            if (note.state !== 'hit') continue;

            // Check if any of the released notes belong to this held note
            for (const releasedMidi of releasedNotes) {
                if (heldMidis.has(releasedMidi)) {
                    heldMidis.delete(releasedMidi);

                    // Record held duration when all chord notes released
                    if (heldMidis.size === 0 && note.pressedAtMs) {
                        note.heldDurationMs = now - note.pressedAtMs;
                    }

                    // Check if note duration hasn't ended yet
                    const noteEndBeat = note.startBeat + note.durationBeats;
                    if (currentBeat < noteEndBeat - this.HIT_WINDOW_BEATS) {
                        // Released early!
                        note.releasedEarly = true;
                        note.hitBeat = currentBeat; // Mark where it was released
                        if (!note.timingFeedback || note.timingFeedback === 'perfect') {
                            note.timingFeedback = 'early_release';
                        }
                    }
                }
            }

            // Clean up if all notes released
            if (heldMidis.size === 0) {
                this.noteTimingMap.delete(note);
                this.heldNotesMap.delete(note);
            }
        }
    }

    // === Keyboard Hint Management ===

    private updateHints(note: ScrollingNote) {
        console.log('[ScrollingPlayer] updateHints - MIDI values:', note.midi, 'isRest:', note.isRest);
        this.hintNotes.set([...note.midi]);
    }

    /**
     * Update hints for multiple notes (both hands at the same beat)
     */
    private updateHintsForNotes(notes: ScrollingNote[]) {
        const allMidi: number[] = [];
        for (const note of notes) {
            if (!note.isRest) {
                allMidi.push(...note.midi);
            }
        }
        console.log('[ScrollingPlayer] updateHintsForNotes - MIDI values:', allMidi);
        this.hintNotes.set(allMidi);
    }

    private clearHints() {
        this.hintNotes.set([]);
    }

    private flashKeys(midiNotes: number[], type: 'correct' | 'wrong') {
        if (type === 'correct') {
            this.correctNotes.set([...midiNotes]);
        } else {
            this.wrongNotes.set([...midiNotes]);
        }

        // Clear flash after delay
        setTimeout(() => {
            if (type === 'correct') {
                this.correctNotes.set([]);
            } else {
                this.wrongNotes.set([]);
            }
        }, 200);
    }

    // === Key Signature Parsing ===

    /**
     * Parse a key signature string into a KeySignature object
     * Supports formats like "C major", "G", "Ab major", "F# minor", etc.
     */
    private parseKeySignature(keyStr: string): KeySignature {
        // Key signature data: number of sharps (+) or flats (-)
        const keySignatures: Record<string, number> = {
            // Major keys
            'c major': 0, 'c': 0,
            'g major': 1, 'g': 1,
            'd major': 2, 'd': 2,
            'a major': 3, 'a': 3,
            'e major': 4, 'e': 4,
            'b major': 5, 'b': 5,
            'f# major': 6, 'f#': 6,
            'c# major': 7, 'c#': 7,
            'f major': -1, 'f': -1,
            'bb major': -2, 'b♭ major': -2,
            'eb major': -3, 'e♭ major': -3,
            'ab major': -4, 'a♭ major': -4,
            'd♭ major': -5, 'db major': -5,
            'gb major': -6, 'g♭ major': -6,
            'cb major': -7, 'c♭ major': -7,
            // Minor keys (relative minors have same accidentals)
            'a minor': 0,
            'e minor': 1,
            'b minor': 2,
            'f# minor': 3,
            'c# minor': 4,
            'g# minor': 5,
            'd# minor': 6,
            'a# minor': 7,
            'd minor': -1,
            'g minor': -2,
            'c minor': -3,
            'f minor': -4,
            'bb minor': -5, 'b♭ minor': -5,
            'eb minor': -6, 'e♭ minor': -6,
            'ab minor': -7, 'a♭ minor': -7,
        };

        const normalized = keyStr.toLowerCase().trim();
        const accidentals = keySignatures[normalized] ?? 0;
        const isMinor = normalized.includes('minor');

        // Extract root note
        const rootMatch = normalized.match(/^([a-g][#♯b♭]?)/);
        const root = rootMatch ? rootMatch[1].toUpperCase() : 'C';

        // Sharps order: F#, C#, G#, D#, A# (the resulting altered notes)
        // F#=6, C#=1, G#=8, D#=3, A#=10
        // Note: E# (5) and B# (0) are enharmonic with white keys
        const sharpResults = [6, 1, 8, 3, 10, 5, 0]; // F#, C#, G#, D#, A#, E#(F), B#(C)

        // Flats order: Bb, Eb, Ab, Db, Gb (the resulting altered notes)
        // Bb=10, Eb=3, Ab=8, Db=1, Gb=6
        // Note: Cb (11) and Fb (4) are enharmonic with white keys
        const flatResults = [10, 3, 8, 1, 6, 11, 4]; // Bb, Eb, Ab, Db, Gb, Cb(B), Fb(E)

        let sharpNotes: number[] = [];
        let flatNotes: number[] = [];

        if (accidentals > 0) {
            sharpNotes = sharpResults.slice(0, accidentals);
        } else if (accidentals < 0) {
            flatNotes = flatResults.slice(0, Math.abs(accidentals));
        }

        return {
            root,
            mode: isMinor ? 'minor' : 'major',
            accidentals,
            sharpNotes,
            flatNotes
        };
    }
}
