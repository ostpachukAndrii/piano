import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    Component,
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
    SingleNoteDTO,
    isChordNote,
    isRestNote,
    isSingleNote,
} from '../../core/models/note.model';
import { EvaluationService } from '../../core/services/evaluation.service';
import { MidiService } from '../../core/services/midi.service';
import { PianoSoundService } from '../../core/services/piano-sound.service';
import { KeyboardRange, KeySignature, ScrollingNote, WrongNoteEvent } from './models/scrolling-note.model';
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
                (playToggle)="onPause()"
                (autoPlayToggle)="onAutoPlayToggle()"
                (computerSoundToggle)="onComputerSoundToggle()"
                (restart)="onRestart()"
                (tempoChange)="onTempoChange($event)"
                (modeChange)="onModeChange($event)">
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
                [keySignature]="keySignature()">
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
            border-top: 2px solid #3B82F6;
            padding: 1rem;
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

    // Track when all notes became complete (for completion buffer timing)
    // This ensures we scroll for the full buffer duration after the last note
    private allNotesCompleteBeat: number | null = null;

    // Keyboard state - signals for child component
    keyboardRange = signal<KeyboardRange>({ min: 48, max: 72 });
    hintNotes = signal<number[]>([]);
    correctNotes = signal<number[]>([]);
    wrongNotes = signal<number[]>([]);

    // Wrong note events for visual feedback on stage (persist until replay)
    wrongNoteEvents = signal<WrongNoteEvent[]>([]);

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
            console.log('[ScrollingPlayer] Notes initialized:', this.scrollingNotes.length);
        }
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
    }

    private initializeNotes() {
        if (!this.lesson) return;

        const notes: ScrollingNote[] = [];
        let beatPosition = 0;

        for (const measure of this.lesson.measures) {
            for (const note of measure.notes) {
                const duration = this.getNoteDuration(note);

                if (isRestNote(note)) {
                    // Rests: silent notes with no MIDI values
                    // They take up time and space but require no user input
                    notes.push({
                        midi: [],
                        startBeat: beatPosition,
                        durationBeats: duration,
                        state: 'upcoming',
                        hand: 'right', // Default to treble staff for rendering
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
                        startBeat: beatPosition,
                        durationBeats: duration,
                        state: 'upcoming',
                        hand,
                        isRest: false
                    });
                }

                beatPosition += duration;
            }
        }

        this._scrollingNotes.set(notes);
        this._totalBeats = beatPosition;
        this.currentBeat.set(0);
        this.progressPercent.set(0);
    }

    private updateKeyboardRange() {
        if (this.scrollingNotes.length === 0) return;

        let minMidi = 127;
        let maxMidi = 0;

        for (const note of this.scrollingNotes) {
            for (const midi of note.midi) {
                minMidi = Math.min(minMidi, midi);
                maxMidi = Math.max(maxMidi, midi);
            }
        }

        // Add some padding and snap to octave boundaries
        minMidi = Math.max(21, Math.floor((minMidi - 5) / 12) * 12);
        maxMidi = Math.min(108, Math.ceil((maxMidi + 5) / 12) * 12);

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

        // Reset beat position to start
        this.currentBeat.set(0);
        this.progressPercent.set(0);

        // Reset all notes to upcoming state
        for (const note of this.scrollingNotes) {
            note.state = 'upcoming';
            note.timingFeedback = undefined;
            note.hitBeat = undefined;
            note.releasedEarly = undefined;
            note.wasReplayed = undefined;
        }

        // Clear tracking maps
        this.heldNotesMap.clear();
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
     * Start auto-play mode
     * Always restarts from the beginning with a clean state
     */
    startAutoPlay() {
        console.log('[ScrollingPlayer] Starting auto-play...');
        // Restart from the beginning to ensure clean state
        this.restart();
        // Now enable auto-play mode
        this.isAutoPlaying.set(true);
        // Auto-play uses flow mode behavior with lead-in bars
        this.playMode.set('flow');
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
        // Allow scrolling past the end so last note visually scrolls off
        let newBeat = Math.min(this.currentBeat() + beatDelta, this._totalBeats + this.COMPLETION_BUFFER_BEATS);

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
                    // Show hints for the NEXT note (after the active one)
                    const hintNote = this.getNextNoteForHints();
                    if (hintNote) {
                        this.updateHints(hintNote);
                    } else {
                        this.clearHints();
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

        // Update keyboard hints (show NEXT note to prepare player)
        const hintNote = this.getNextNoteForHints();
        if (hintNote) {
            this.updateHints(hintNote);
        } else {
            this.clearHints();
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

        // Check completion - use the beat when all notes became complete + buffer
        // This ensures we always scroll for the full buffer duration, regardless of
        // whether the last note was hit early, on time, or at the end of its duration
        const completionTargetBeat = this.allNotesCompleteBeat !== null
            ? this.allNotesCompleteBeat + this.COMPLETION_BUFFER_BEATS
            : this._totalBeats + this.COMPLETION_BUFFER_BEATS;

        // Debug: Log progress toward completion every 60 frames after all notes complete
        if (this.allNotesCompleteBeat !== null && this._frameCount % 60 === 0) {
            console.log('[ScrollingPlayer] Buffer scroll progress:',
                'currentBeat:', newBeat.toFixed(2),
                'target:', completionTargetBeat.toFixed(2),
                'remaining:', (completionTargetBeat - newBeat).toFixed(2), 'beats');
        }

        if (newBeat >= completionTargetBeat) {
            console.log('[ScrollingPlayer] COMPLETION TRIGGERED - newBeat:', newBeat,
                'completionTarget:', completionTargetBeat,
                'allNotesCompleteBeat:', this.allNotesCompleteBeat);
            this.stop();
            // Small delay for the sound to finish, then show completion
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
     * Skips rests since they don't require user input
     */
    private getNextUnhitNote(): ScrollingNote | null {
        for (const note of this.scrollingNotes) {
            if ((note.state === 'upcoming' || note.state === 'active') && !note.isRest) {
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
     * Get the next note to show in hints (the one AFTER the active note)
     * This lets the player prepare for what's coming next
     * Skips rests since they don't require user input
     */
    private getNextNoteForHints(): ScrollingNote | null {
        let foundActive = false;
        for (const note of this.scrollingNotes) {
            // Skip rests
            if (note.isRest) continue;

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
                if (note.state === 'upcoming' && !note.isRest) {
                    return note;
                }
            }
        }
        return null;
    }

    private updateNoteStates() {
        const current = this.currentBeat();
        const isAutoPlay = this.isAutoPlaying();

        // Special handling for rests: automatically mark as 'hit' when playhead passes
        // Rests don't require user input - they're just silence that takes up time
        for (const note of this.scrollingNotes) {
            if (note.isRest && note.state === 'upcoming') {
                // Rest becomes active when playhead reaches its start
                if (current >= note.startBeat) {
                    // Immediately mark as hit - no waiting for user input
                    note.state = 'hit';
                }
            }
        }

        // First pass: check for missed notes and find if there's already an active note
        let hasActiveNote = false;
        for (const note of this.scrollingNotes) {
            // Skip rests - they're handled above
            if (note.isRest) continue;

            if (note.state === 'active') {
                hasActiveNote = true;
                // Check if note was missed (passed playhead + window)
                if (current > note.startBeat + note.durationBeats + this.HIT_WINDOW_BEATS) {
                    // In auto-play mode, mark as hit (demo completed)
                    if (isAutoPlay) {
                        note.state = 'hit';
                        note.timingFeedback = 'perfect';
                    } else {
                        note.state = 'missed';
                        // Record miss
                        for (const midi of note.midi) {
                            this.evaluationService.checkPitch(0, midi);
                        }
                    }
                    hasActiveNote = false; // This note is no longer active
                }
            }
        }

        // Second pass: activate ONLY the first upcoming note within hit window
        // This ensures only ONE note is active at a time, even if notes are very close together
        if (!hasActiveNote) {
            for (const note of this.scrollingNotes) {
                // Skip rests - they never become active
                if (note.isRest) continue;

                if (note.state === 'upcoming') {
                    // Check if note should become active (near playhead)
                    if (current >= note.startBeat - this.HIT_WINDOW_BEATS) {
                        note.state = 'active';

                        // In auto-play mode, play the note automatically
                        if (isAutoPlay) {
                            this.playNoteAutomatic(note);
                        }

                        // Only activate one note at a time
                        break;
                    }
                }
            }
        }
    }

    /**
     * Play a note automatically (for auto-play/demo mode)
     */
    private playNoteAutomatic(note: ScrollingNote): void {
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
        // Detect released notes (were in previous, not in current)
        const releasedNotes = this.previousActiveNotes.filter(n => !activeNotes.includes(n));
        const newlyPressedNotes = activeNotes.filter(n => !this.previousActiveNotes.includes(n));

        // Check for early release on held notes
        this.checkEarlyRelease(releasedNotes);

        // Update previous notes for next frame
        this.previousActiveNotes = [...activeNotes];

        // Handle wait mode when paused - check if we should resume
        if (!this.isPlaying() && this.playMode() === 'wait') {
            const activeNote = this.getActiveNote();
            if (activeNote && this.checkNoteHitWithLegato(activeNote, activeNotes, newlyPressedNotes)) {
                this.start();
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

        // Record success in evaluation service
        for (const midi of note.midi) {
            this.evaluationService.checkPitch(midi, midi);
        }

        // Play sound (if computer sound is enabled)
        if (this.computerSoundEnabled()) {
            for (const midi of note.midi) {
                this.pianoService.playNote(midi);
            }
        }

        return 'hit';
    }

    /**
     * Record a wrong note (Feature 2: Ghost Note)
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
        this.evaluationService.checkPitch(wrongPitch, closestExpected);

        // Flash wrong on keyboard
        this.flashKeys([wrongPitch], 'wrong');
    }

    /**
     * Cleanup wrong note events that have scrolled off-screen (Feature 2: Ghost Note cleanup)
     * Removes events where X position < -50 (off left edge)
     */
    private cleanupOffscreenWrongNotes(): void {
        const currentBeat = this.currentBeat();
        const pixelsPerBeat = 80; // Same as NotationStageComponent.PIXELS_PER_BEAT
        const playheadX = 300; // Same as NotationStageComponent default

        // Calculate the beat threshold for off-screen (X < -50)
        // X = playheadX + (eventBeat - currentBeat) * pixelsPerBeat
        // -50 = 300 + (eventBeat - currentBeat) * 80
        // -350 = (eventBeat - currentBeat) * 80
        // eventBeat - currentBeat = -4.375
        // eventBeat < currentBeat - 4.375
        const offscreenThresholdBeats = (playheadX + 50) / pixelsPerBeat; // ~4.375 beats behind

        this.wrongNoteEvents.update(events =>
            events.filter(event => {
                const beatsBehind = currentBeat - event.beat;
                return beatsBehind < offscreenThresholdBeats;
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
     */
    private checkEarlyRelease(releasedNotes: number[]): void {
        if (releasedNotes.length === 0) return;

        const currentBeat = this.currentBeat();

        // Check each note that's being tracked for holding
        for (const [note, heldMidis] of this.heldNotesMap.entries()) {
            if (note.state !== 'hit') continue;

            // Check if any of the released notes belong to this held note
            for (const releasedMidi of releasedNotes) {
                if (heldMidis.has(releasedMidi)) {
                    heldMidis.delete(releasedMidi);

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
                this.heldNotesMap.delete(note);
            }
        }
    }

    // === Keyboard Hint Management ===

    private updateHints(note: ScrollingNote) {
        this.hintNotes.set([...note.midi]);
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
