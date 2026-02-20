import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import {
    LessonMode,
    isTimingMode,
    isStudyMode,
    getModeHands,
    getLessonModeLabel,
} from '../../core/models/lesson.model';
import {
    ChordNoteDTO,
    NoteDTO,
    SingleNoteDTO,
    isChordNote,
    isRestNote,
    isSingleNote,
} from '../../core/models/note.model';
import { EvaluationService } from '../../core/services/evaluation.service';
import { LessonService } from '../../core/services/lesson.service';
import { MidiService } from '../../core/services/midi.service';
import { TauriService } from '../../core/services/tauri.service';
import { PlaybackService } from '../../core/services/playback.service';
import { PianoSoundService } from '../../core/services/piano-sound.service';
import { FeedbackBadgeComponent } from '../../shared/components/feedback-badge/feedback-badge.component';
import { StatsDisplayComponent } from '../../shared/components/stats-display/stats-display.component';
import { GrandStaffComponent } from './grand-staff.component';
import { LessonCompletionDialogComponent, ExtendedStats } from './lesson-completion-dialog.component';
import { ScrollingPlayerComponent } from './scrolling-player.component';

// Extracted components
import { DebugPanelComponent } from './components/debug-panel/debug-panel.component';
import { LessonStatesComponent } from './components/lesson-states/lesson-states.component';
import { LessonHeaderComponent } from './components/lesson-header/lesson-header.component';
import { ModeSelectorComponent } from './components/mode-selector/mode-selector.component';
import { MeasuresPreviewComponent } from './components/measures-preview/measures-preview.component';
import { PlaybackBarComponent } from './components/playback-bar/playback-bar.component';

@Component({
    selector: 'app-lesson-player',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatDialogModule,
        GrandStaffComponent,
        ScrollingPlayerComponent,
        FeedbackBadgeComponent,
        StatsDisplayComponent,
        // Extracted components
        DebugPanelComponent,
        LessonStatesComponent,
        LessonHeaderComponent,
        ModeSelectorComponent,
        MeasuresPreviewComponent,
        PlaybackBarComponent,
    ],
    template: `
    <div class="lesson-player">
        <!-- Loading/Error/Browser Warning States -->
        <app-lesson-states
            [loading]="loading()"
            [error]="error()"
            [isTauri]="isTauri"
            (retry)="loadLesson()"
            (back)="goBack()">
        </app-lesson-states>

        <!-- Lesson Content -->
        <ng-container *ngIf="lesson() && !loading() && !error()">
            <!-- Header with Stats -->
            <app-lesson-header
                [lesson]="lesson()!"
                [currentMode]="currentMode()"
                [isTimingEnabled]="isTimingEnabled()"
                [isStudyMode]="isStudyModeEnabled()"
                [activeHands]="activeHands()"
                [modeLabel]="modeLabel()"
                (back)="goBack()">
            </app-lesson-header>

            <!-- Mode Selector and Controls -->
            <app-mode-selector
                [currentMode]="currentMode()"
                [playerView]="playerView()"
                [isTimingEnabled]="isTimingEnabled()"
                [isStudyMode]="isStudyModeEnabled()"
                [isTimingPlaying]="isTimingPlaying()"
                [activeHands]="activeHands()"
                [tempo]="lesson()!.tempo"
                (modeChange)="onModeChange($event)"
                (viewChange)="onViewChange($event)"
                (toggleTiming)="toggleTimingMode()">
            </app-mode-selector>

            <!-- Classic View: Grand Staff -->
            <mat-card class="staff-card" *ngIf="playerView() === 'classic'">
                <mat-card-header>
                    <mat-icon mat-card-avatar>music_note</mat-icon>
                    <mat-card-title>Music Staff</mat-card-title>
                    <mat-card-subtitle>
                        {{ midiService.connected() ? 'MIDI Connected' : 'Connect keyboard in Settings' }}
                    </mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                    <!-- Feedback Badge -->
                    <div class="feedback-container">
                        <app-feedback-badge [result]="evaluationService.lastResult()"></app-feedback-badge>
                    </div>

                    <app-grand-staff
                        [lesson]="lesson()!"
                        [activeNotes]="activeNotesArray()"
                        [currentMeasureIndex]="currentMeasureIndex()"
                        [currentNoteIndex]="getCurrentGlobalNoteIndex()"
                        [playheadPosition]="getPlayheadPosition()"
                        [playheadBeatPosition]="playheadBeatPosition()"
                        [highlightNoteIndex]="getCurrentGlobalNoteIndex()"
                        [isPlaying]="playbackService.isPlaying() || isTimingPlaying()">
                    </app-grand-staff>

                    <!-- Stats Display -->
                    <div class="stats-container" *ngIf="evaluationService.stats()">
                        <app-stats-display [stats]="evaluationService.stats()"></app-stats-display>
                    </div>
                </mat-card-content>
            </mat-card>

            <!-- Scrolling View: Guitar Hero Style -->
            <div class="scrolling-player-container" *ngIf="playerView() === 'scrolling'">
                <app-scrolling-player
                    [lesson]="lesson()!"
                    [activeNotes]="activeNotesArray()"
                    (completed)="showCompletionDialog($event)"
                    (paused)="onScrollingPaused()">
                </app-scrolling-player>
            </div>

            <!-- Debug Panel -->
            <app-debug-panel
                [lesson]="lesson()"
                [currentMode]="currentMode()"
                [currentMeasureIndex]="currentMeasureIndex()"
                [currentNoteIndex]="currentNoteIndex()"
                [globalNoteIndex]="getCurrentGlobalNoteIndex()"
                [playheadPosition]="getPlayheadPosition()"
                [playheadBeatPosition]="playheadBeatPosition()"
                [expectedNotes]="expectedNotes()"
                [activeNotes]="activeNotesArray()"
                [waitingForRelease]="waitingForRelease()"
                [notesToRelease]="getNotesToReleaseString()"
                [lastEvaluatedNotes]="lastEvaluatedNotes()"
                [isTimingPlaying]="isTimingPlaying()"
                [notePlayedInWindow]="notePlayedInWindow()"
                [isTimingEnabled]="isTimingEnabled()"
                [activeHands]="activeHands()"
                [playerView]="playerView()"
                [timingWindowMs]="timingWindowMs">
            </app-debug-panel>

            <!-- Measures Preview -->
            <app-measures-preview [measures]="lesson()!.measures"></app-measures-preview>

            <!-- Playback Controls Bar (only show in classic view) -->
            <app-playback-bar
                *ngIf="playerView() === 'classic'"
                (seek)="onSeek($event)"
                (tempoChange)="onTempoChange($event)"
                (playToggle)="togglePlayback()"
                (volumeToggle)="toggleVolume()">
            </app-playback-bar>
        </ng-container>
    </div>
    `,
    styles: [`
        .lesson-player {
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 1rem 2rem;
            box-sizing: border-box;
            padding-bottom: 100px;
        }

        .staff-card {
            margin-bottom: 2rem;
        }

        .scrolling-player-container {
            margin-bottom: 2rem;
            border-radius: 8px;
            overflow: hidden;
            height: 700px;
            width: 100%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .feedback-container {
            display: flex;
            justify-content: center;
            min-height: 50px;
            margin-bottom: 1rem;
        }

        .stats-container {
            display: flex;
            justify-content: center;
            margin-top: 1rem;
        }
    `],
})
export class LessonPlayerComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private lessonService = inject(LessonService);
    private tauriService = inject(TauriService);
    private dialog = inject(MatDialog);
    midiService = inject(MidiService);
    evaluationService = inject(EvaluationService);
    playbackService = inject(PlaybackService);
    pianoService = inject(PianoSoundService);

    // ViewChild reference to scrolling player for restart functionality
    @ViewChild(ScrollingPlayerComponent) scrollingPlayer?: ScrollingPlayerComponent;

    // Flag to prevent duplicate completion dialogs
    private isCompletionDialogOpen = false;

    isTauri = false;
    lessonId = signal<string | null>(null);
    currentMeasureIndex = signal(0);
    currentNoteIndex = signal(0);
    waitingForRelease = signal(false);
    notesToRelease = signal<Set<number>>(new Set());
    lastEvaluatedNotes = signal<string>('');

    // Timing mode state
    private timingIntervalId: number | null = null;
    private timingStartTime = 0;
    private currentNoteStartBeat = 0;
    isTimingPlaying = signal(false);
    notePlayedInWindow = signal(false);
    timingWindowMs = 400;
    playheadBeatPosition = signal(-1);

    // Expose service signals
    lesson = this.lessonService.currentLesson;
    loading = this.lessonService.loading;
    error = this.lessonService.error;

    // Convert Set to Array for template binding
    activeNotesArray = computed(() => Array.from(this.midiService.activeNotes()));

    // Get current expected notes
    expectedNotes = computed(() => {
        const les = this.lesson();
        if (!les || les.measures.length === 0) return [];

        const measureIdx = this.currentMeasureIndex();
        const noteIdx = this.currentNoteIndex();

        if (measureIdx >= les.measures.length) return [];
        const measure = les.measures[measureIdx];

        if (noteIdx >= measure.notes.length) return [];
        const note = measure.notes[noteIdx];

        if (isRestNote(note)) return [];
        if (isSingleNote(note)) return [(note as SingleNoteDTO).midi];
        if (isChordNote(note)) return (note as ChordNoteDTO).midi;
        return [];
    });

    getNotesToReleaseString(): string {
        const notes = this.notesToRelease();
        if (notes.size === 0) return 'None';
        return Array.from(notes).join(', ');
    }

    // Lesson mode
    currentMode = signal<LessonMode>('study_right_hand_no_timing');
    isTimingEnabled = computed(() => isTimingMode(this.currentMode()));
    isStudyModeEnabled = computed(() => isStudyMode(this.currentMode()));
    activeHands = computed(() => getModeHands(this.currentMode()));
    modeLabel = computed(() => getLessonModeLabel(this.currentMode()));

    // Player view type
    playerView = signal<'classic' | 'scrolling'>('scrolling');

    getPlayheadPosition(): number {
        if (!this.playbackService.isPlaying() && !this.playbackService.isPaused()) {
            return -1;
        }
        const pos = this.playbackService.currentPosition();
        const les = this.lesson();
        if (!les) return -1;

        let globalIndex = 0;
        for (let i = 0; i < pos.measureIndex && i < les.measures.length; i++) {
            globalIndex += les.measures[i].notes.length;
        }
        globalIndex += pos.noteIndex;
        return globalIndex;
    }

    getCurrentGlobalNoteIndex(): number {
        const les = this.lesson();
        if (!les) return -1;

        const measureIdx = this.currentMeasureIndex();
        const noteIdx = this.currentNoteIndex();

        let globalIndex = 0;
        for (let i = 0; i < measureIdx && i < les.measures.length; i++) {
            globalIndex += les.measures[i].notes.length;
        }
        globalIndex += noteIdx;
        return globalIndex;
    }

    constructor() {
        // React to MIDI input and evaluate notes (classic view only)
        // In scrolling view, the scrolling player handles its own evaluation
        // with {skipSound: true} to avoid killing sustained notes.
        effect(() => {
            const active = this.activeNotesArray();
            const expected = this.expectedNotes();
            const toRelease = this.notesToRelease();

            // Skip evaluation in scrolling view — handled by scrolling-player
            if (this.playerView() !== 'classic') return;

            if (this.waitingForRelease()) {
                const allReleased = [...toRelease].every(note => !active.includes(note));
                if (allReleased) {
                    this.waitingForRelease.set(false);
                    this.notesToRelease.set(new Set());
                    this.lastEvaluatedNotes.set('');
                } else {
                    const newExpectedDifferent = expected.length > 0 &&
                        !expected.every(exp => toRelease.has(exp));
                    const newExpectedPressed = newExpectedDifferent &&
                        expected.every(exp => active.includes(exp));

                    if (newExpectedPressed) {
                        this.waitingForRelease.set(false);
                        this.notesToRelease.set(new Set());
                        this.lastEvaluatedNotes.set('');
                    } else {
                        return;
                    }
                }
            }

            if (active.length > 0 && expected.length > 0) {
                const currentKey = `${[...active].sort().join(',')}-${[...expected].sort().join(',')}`;
                const lastKey = this.lastEvaluatedNotes();

                if (currentKey !== lastKey) {
                    this.lastEvaluatedNotes.set(currentKey);
                    this.evaluatePlayedNotes(active, expected);
                }
            }
        }, { allowSignalWrites: true });
    }

    async ngOnInit(): Promise<void> {
        this.isTauri = this.tauriService.isTauri();

        const id = this.route.snapshot.paramMap.get('id');
        this.lessonId.set(id);

        if (this.isTauri && id) {
            await this.loadLesson();
            await this.evaluationService.initialize();
        }
    }

    async ngOnDestroy(): Promise<void> {
        this.stopTimingMode();
        this.playbackService.stop();
        await this.evaluationService.cleanup();
    }

    async loadLesson(): Promise<void> {
        const id = this.lessonId();
        if (!id) return;

        try {
            const lesson = await this.lessonService.loadLesson(id);

            if (lesson.mode) {
                this.currentMode.set(lesson.mode);
            } else {
                this.currentMode.set('study_right_hand_no_timing');
            }

            await this.evaluationService.resetStats();
            this.skipRests();
        } catch (err) {
            console.error('Failed to load lesson:', err);
        }
    }

    private skipRests(): void {
        const les = this.lesson();
        if (!les || les.measures.length === 0) return;

        let measureIdx = this.currentMeasureIndex();
        let noteIdx = this.currentNoteIndex();

        while (measureIdx < les.measures.length) {
            const measure = les.measures[measureIdx];
            if (noteIdx >= measure.notes.length) {
                measureIdx++;
                noteIdx = 0;
                continue;
            }

            const note = measure.notes[noteIdx];
            if (isRestNote(note)) {
                noteIdx++;
            } else {
                break;
            }
        }

        if (measureIdx !== this.currentMeasureIndex() || noteIdx !== this.currentNoteIndex()) {
            if (measureIdx >= les.measures.length) {
                if (this.playerView() === 'classic') {
                    this.showCompletionDialog();
                }
            } else {
                this.currentMeasureIndex.set(measureIdx);
                this.currentNoteIndex.set(noteIdx);
            }
        }
    }

    private async evaluatePlayedNotes(played: number[], expected: number[]): Promise<void> {
        const allCorrect = expected.every(exp => played.includes(exp)) && played.length === expected.length;

        if (allCorrect) {
            await Promise.all(expected.map(midi =>
                this.evaluationService.checkPitch(midi, midi)
            ));

            if (this.isTimingPlaying()) {
                this.notePlayedInWindow.set(true);
            } else {
                this.notesToRelease.set(new Set(expected));
                this.advanceToNextNote();
            }
        } else {
            await Promise.all(played.map(midi => {
                const closestExpected = this.findClosestExpected(midi, expected);
                return this.evaluationService.checkPitch(midi, closestExpected);
            }));
        }
    }

    private findClosestExpected(played: number, expected: number[]): number {
        return expected.reduce((closest, exp) =>
            Math.abs(exp - played) < Math.abs(closest - played) ? exp : closest
        );
    }

    private advanceToNextNote(): void {
        const les = this.lesson();
        if (!les) return;

        const measureIdx = this.currentMeasureIndex();
        const noteIdx = this.currentNoteIndex();
        const measure = les.measures[measureIdx];

        if (noteIdx + 1 < measure.notes.length) {
            this.currentNoteIndex.set(noteIdx + 1);
        } else if (measureIdx + 1 < les.measures.length) {
            this.currentMeasureIndex.set(measureIdx + 1);
            this.currentNoteIndex.set(0);
        } else {
            if (this.playerView() === 'classic') {
                this.showCompletionDialog();
            }
            return;
        }

        this.skipRests();

        if (this.currentMeasureIndex() >= les.measures.length) {
            return;
        }

        this.waitingForRelease.set(true);
    }

    async showCompletionDialog(extendedStats?: ExtendedStats): Promise<void> {
        if (this.isCompletionDialogOpen) {
            return;
        }

        this.isCompletionDialogOpen = true;
        this.evaluationService.awardLessonCompletionXP();

        const dialogRef = this.dialog.open(LessonCompletionDialogComponent, {
            data: {
                lessonTitle: this.lesson()?.title || 'Lesson',
                stats: this.evaluationService.stats(),
                extendedStats: extendedStats
            },
            disableClose: true,
            width: '420px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            panelClass: ['completion-dialog-fullscreen', 'force-clickable'],
            hasBackdrop: true,
            backdropClass: 'completion-dialog-backdrop',
            autoFocus: true,
            restoreFocus: true
        });

        dialogRef.afterClosed().subscribe(async result => {
            this.isCompletionDialogOpen = false;

            if (result === 'replay') {
                this.replayLesson();
            } else if (result === 'back') {
                if (document.fullscreenElement) {
                    try {
                        await document.exitFullscreen();
                    } catch (error) {
                        console.error('Error exiting fullscreen:', error);
                    }
                }
                this.goBack();
            }
        });
    }

    private replayLesson(): void {
        this.currentMeasureIndex.set(0);
        this.currentNoteIndex.set(0);
        this.waitingForRelease.set(false);
        this.lastEvaluatedNotes.set('');
        this.evaluationService.resetStats();

        if (this.playerView() === 'scrolling' && this.scrollingPlayer) {
            this.scrollingPlayer.restart();
        }
    }

    goBack(): void {
        this.playbackService.stop();
        this.router.navigate(['/lessons']);
    }

    onModeChange(mode: LessonMode): void {
        this.stopTimingMode();
        this.currentMode.set(mode);

        this.currentMeasureIndex.set(0);
        this.currentNoteIndex.set(0);
        this.waitingForRelease.set(false);
        this.lastEvaluatedNotes.set('');
        this.evaluationService.resetStats();

        this.skipRests();
    }

    onViewChange(view: 'classic' | 'scrolling'): void {
        this.stopTimingMode();
        this.playerView.set(view);

        this.currentMeasureIndex.set(0);
        this.currentNoteIndex.set(0);
        this.waitingForRelease.set(false);
        this.lastEvaluatedNotes.set('');
        this.evaluationService.resetStats();
    }

    onScrollingPaused(): void {
        // Handle pause from scrolling player if needed
    }

    // Timing mode methods
    startTimingMode(): void {
        if (this.timingIntervalId !== null) return;

        const les = this.lesson();
        if (!les) return;

        this.isTimingPlaying.set(true);
        this.timingStartTime = performance.now();
        this.currentNoteStartBeat = this.calculateCurrentBeatPosition();
        this.notePlayedInWindow.set(false);

        const beatDurationMs = 60000 / les.tempo;

        this.timingIntervalId = window.setInterval(() => {
            this.timingTick(beatDurationMs);
        }, 50);
    }

    stopTimingMode(): void {
        if (this.timingIntervalId !== null) {
            window.clearInterval(this.timingIntervalId);
            this.timingIntervalId = null;
        }
        this.isTimingPlaying.set(false);
    }

    toggleTimingMode(): void {
        if (this.isTimingPlaying()) {
            this.stopTimingMode();
        } else {
            this.startTimingMode();
        }
    }

    private timingTick(beatDurationMs: number): void {
        const les = this.lesson();
        if (!les) return;

        const measureIdx = this.currentMeasureIndex();
        const noteIdx = this.currentNoteIndex();

        if (measureIdx >= les.measures.length) {
            this.stopTimingMode();
            return;
        }

        const measure = les.measures[measureIdx];
        if (noteIdx >= measure.notes.length) {
            this.stopTimingMode();
            return;
        }

        const note = measure.notes[noteIdx];
        const noteDurationBeats = this.getNoteDuration(note);
        const noteDurationMs = noteDurationBeats * beatDurationMs;

        const elapsed = performance.now() - this.timingStartTime;
        const noteEndTime = this.currentNoteStartBeat * beatDurationMs + noteDurationMs;

        if (elapsed > noteEndTime + this.timingWindowMs / 2) {
            if (!this.notePlayedInWindow()) {
                const expected = this.expectedNotes();
                if (expected.length > 0) {
                    expected.forEach(midi => {
                        this.evaluationService.checkPitch(0, midi);
                    });
                }
            }

            this.advanceToNextNoteInTiming();
        }
    }

    private advanceToNextNoteInTiming(): void {
        const les = this.lesson();
        if (!les) return;

        const measureIdx = this.currentMeasureIndex();
        const noteIdx = this.currentNoteIndex();
        const measure = les.measures[measureIdx];

        const note = measure.notes[noteIdx];
        const noteDuration = this.getNoteDuration(note);
        this.currentNoteStartBeat += noteDuration;

        if (noteIdx + 1 < measure.notes.length) {
            this.currentNoteIndex.set(noteIdx + 1);
        } else if (measureIdx + 1 < les.measures.length) {
            this.currentMeasureIndex.set(measureIdx + 1);
            this.currentNoteIndex.set(0);
        } else {
            this.stopTimingMode();
            if (this.playerView() === 'classic') {
                this.showCompletionDialog();
            }
            return;
        }

        this.notePlayedInWindow.set(false);
        this.lastEvaluatedNotes.set('');

        this.skipRestsInTiming();
    }

    private skipRestsInTiming(): void {
        const les = this.lesson();
        if (!les) return;

        let measureIdx = this.currentMeasureIndex();
        let noteIdx = this.currentNoteIndex();

        while (measureIdx < les.measures.length) {
            const measure = les.measures[measureIdx];
            if (noteIdx >= measure.notes.length) {
                measureIdx++;
                noteIdx = 0;
                continue;
            }

            const note = measure.notes[noteIdx];
            if (isRestNote(note)) {
                this.currentNoteStartBeat += this.getNoteDuration(note);
                noteIdx++;
            } else {
                break;
            }
        }

        if (measureIdx !== this.currentMeasureIndex() || noteIdx !== this.currentNoteIndex()) {
            if (measureIdx >= les.measures.length) {
                this.stopTimingMode();
                if (this.playerView() === 'classic') {
                    this.showCompletionDialog();
                }
            } else {
                this.currentMeasureIndex.set(measureIdx);
                this.currentNoteIndex.set(noteIdx);
            }
        }
    }

    private calculateCurrentBeatPosition(): number {
        const les = this.lesson();
        if (!les) return 0;

        let beatPosition = 0;
        const measureIdx = this.currentMeasureIndex();
        const noteIdx = this.currentNoteIndex();

        for (let m = 0; m < measureIdx; m++) {
            for (const note of les.measures[m].notes) {
                beatPosition += this.getNoteDuration(note);
            }
        }

        const currentMeasure = les.measures[measureIdx];
        if (currentMeasure) {
            for (let n = 0; n < noteIdx; n++) {
                beatPosition += this.getNoteDuration(currentMeasure.notes[n]);
            }
        }

        return beatPosition;
    }

    private getNoteDuration(note: NoteDTO): number {
        if (isRestNote(note)) {
            return note.duration;
        }
        if (isSingleNote(note)) {
            return (note as SingleNoteDTO).duration;
        }
        if (isChordNote(note)) {
            return (note as ChordNoteDTO).duration;
        }
        return 1;
    }

    // Playback control methods
    togglePlayback(): void {
        const les = this.lesson();
        if (!les) return;

        if (this.playbackService.isStopped()) {
            this.playbackService.loadLesson(les);
        }

        this.playbackService.toggle();
    }

    onSeek(percent: number): void {
        this.playbackService.seekTo(percent);
    }

    onTempoChange(bpm: number): void {
        this.playbackService.setTempo(bpm);
    }

    toggleVolume(): void {
        if (this.pianoService.volume() > 0) {
            this.pianoService.setVolume(0);
        } else {
            this.pianoService.setVolume(0.7);
        }
    }
}
