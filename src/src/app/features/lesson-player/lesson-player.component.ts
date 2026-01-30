import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ActivatedRoute, Router } from '@angular/router';
import {
    formatDuration,
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
    midiToNoteName,
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
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
    selector: 'app-lesson-player',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatChipsModule,
        MatDialogModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatSelectModule,
        MatSliderModule,
        MatTooltipModule,
        MatButtonToggleModule,
        GrandStaffComponent,
        ScrollingPlayerComponent,
        FeedbackBadgeComponent,
        StatsDisplayComponent,
    ],
    template: `
    <div class="lesson-player">
      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading()">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading lesson...</p>
      </div>

      <!-- Error State -->
      <mat-card class="error-card" *ngIf="error()">
        <mat-icon>error_outline</mat-icon>
        <div class="error-content">
          <h3>Failed to load lesson</h3>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="loadLesson()">
            <mat-icon>refresh</mat-icon>
            Retry
          </button>
          <button mat-stroked-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Back to Lessons
          </button>
        </div>
      </mat-card>

      <!-- Browser Mode Warning -->
      <mat-card class="warning-card" *ngIf="!isTauri && !loading()">
        <mat-icon>info</mat-icon>
        <div class="warning-content">
          <h3>Browser Mode</h3>
          <p>
            Lessons require the Tauri backend. Run with
            <code>cargo tauri dev</code>
          </p>
          <button mat-stroked-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Back
          </button>
        </div>
      </mat-card>

      <!-- Lesson Content -->
      <ng-container *ngIf="lesson() && !loading() && !error()">
        <!-- Header -->
        <header class="lesson-header">
          <button mat-icon-button (click)="goBack()" class="back-button">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="lesson-info">
            <h1>{{ lesson()!.title }}</h1>
            <p class="description" *ngIf="lesson()!.description">
              {{ lesson()!.description }}
            </p>
          </div>
        </header>

        <!-- Lesson Stats -->
        <div class="lesson-stats">
          <mat-chip-set>
            <mat-chip [class.study-mode]="isStudyModeEnabled()" [class.play-mode]="isTimingEnabled()">
              <mat-icon>{{ isStudyModeEnabled() ? 'menu_book' : 'music_note' }}</mat-icon>
              {{ modeLabel() }}
            </mat-chip>
            <mat-chip>
              <mat-icon>schedule</mat-icon>
              {{ formatDuration(lesson()!.total_seconds) }}
            </mat-chip>
            <mat-chip *ngIf="isTimingEnabled()">
              <mat-icon>speed</mat-icon>
              {{ lesson()!.tempo }} BPM
            </mat-chip>
            <mat-chip>
              <mat-icon>music_note</mat-icon>
              {{ lesson()!.time_signature }}
            </mat-chip>
            <mat-chip>
              <mat-icon>piano</mat-icon>
              {{ lesson()!.key_signature }}
            </mat-chip>
            <mat-chip>
              <mat-icon>view_module</mat-icon>
              {{ lesson()!.measures.length }} measures
            </mat-chip>
            <mat-chip *ngIf="activeHands() !== 'both'">
              <mat-icon>{{ activeHands() === 'left' ? 'pan_tool_alt' : 'pan_tool' }}</mat-icon>
              {{ activeHands() === 'left' ? 'Left Hand' : 'Right Hand' }}
            </mat-chip>
          </mat-chip-set>
        </div>

        <!-- Mode Selector and Instructions -->
        <div class="mode-selector-section">
          <div class="mode-selector">
            <mat-form-field appearance="outline">
              <mat-label>Practice Mode</mat-label>
              <mat-select [value]="currentMode()" (selectionChange)="onModeChange($event.value)">
                <mat-optgroup label="Study (No Timing)">
                  <mat-option value="study_right_hand_no_timing">📖 Study Right Hand</mat-option>
                  <mat-option value="study_left_hand_no_timing">📖 Study Left Hand</mat-option>
                  <mat-option value="study_two_hands_no_timing">📖 Study Both Hands</mat-option>
                </mat-optgroup>
                <mat-optgroup label="Play (With Timing)">
                  <mat-option value="play_right_hand_timing">🎵 Play Right Hand</mat-option>
                  <mat-option value="play_left_hand_timing">🎵 Play Left Hand</mat-option>
                  <mat-option value="play_two_hands_timing">🎹 Full Performance</mat-option>
                </mat-optgroup>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="mode-instructions" [class.study]="isStudyModeEnabled()" [class.play]="isTimingEnabled()">
            <mat-icon>{{ isStudyModeEnabled() ? 'lightbulb' : 'timer' }}</mat-icon>
            <div class="mode-text">
              <span *ngIf="isStudyModeEnabled()">
                <strong>Study Mode:</strong> Take your time. Play each note correctly to advance. No timing required.
              </span>
              <span *ngIf="isTimingEnabled() && !isTimingPlaying()">
                <strong>Play Mode:</strong> Press Start to begin. Follow the rhythm at {{ lesson()!.tempo }} BPM.
              </span>
              <span *ngIf="isTimingEnabled() && isTimingPlaying()">
                <strong>Playing...</strong> Follow the cursor! Play notes within the timing window.
              </span>
              <span class="hand-hint" *ngIf="activeHands() !== 'both'">
                Focus on {{ activeHands() === 'left' ? 'left hand (bass clef)' : 'right hand (treble clef)' }} only.
              </span>
            </div>
          </div>
          <!-- Timing Mode Controls -->
          <div class="timing-controls" *ngIf="isTimingEnabled() && playerView() === 'classic'">
            <button mat-raised-button
                    [color]="isTimingPlaying() ? 'warn' : 'primary'"
                    (click)="toggleTimingMode()"
                    class="timing-button">
              <mat-icon>{{ isTimingPlaying() ? 'stop' : 'play_arrow' }}</mat-icon>
              {{ isTimingPlaying() ? 'Stop' : 'Start' }}
            </button>
          </div>

          <!-- View Toggle -->
          <div class="view-toggle">
            <mat-button-toggle-group [value]="playerView()" (change)="onViewChange($event.value)">
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

        <!-- Classic View: Grand Staff -->
        <mat-card class="staff-card" *ngIf="playerView() === 'classic'">
          <mat-card-header>
            <mat-icon mat-card-avatar>music_note</mat-icon>
            <mat-card-title>Music Staff</mat-card-title>
            <mat-card-subtitle>
              {{ midiService.connected() ? '🎹 MIDI Connected' : 'Connect keyboard in Settings' }}
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
            <div class="debug-section">
              <h4>🎯 Lesson Mode</h4>
              <div class="debug-grid">
                <div class="debug-item">
                  <span class="label">Mode:</span>
                  <span class="value">{{ modeLabel() }}</span>
                </div>
                <div class="debug-item">
                  <span class="label">Timing Required:</span>
                  <span class="value" [style.color]="isTimingEnabled() ? '#ff9800' : '#4caf50'">
                    {{ isTimingEnabled() ? 'Yes' : 'No - Take your time' }}
                  </span>
                </div>
                <div class="debug-item">
                  <span class="label">Active Hands:</span>
                  <span class="value">{{ activeHands() === 'both' ? 'Both Hands' : (activeHands() === 'left' ? 'Left Hand Only' : 'Right Hand Only') }}</span>
                </div>
              </div>
            </div>

            <div class="debug-section">
              <h4>📍 Position</h4>
              <div class="debug-grid">
                <div class="debug-item">
                  <span class="label">Measure Index:</span>
                  <span class="value">{{ currentMeasureIndex() }}</span>
                </div>
                <div class="debug-item">
                  <span class="label">Note Index:</span>
                  <span class="value">{{ currentNoteIndex() }}</span>
                </div>
              </div>
            </div>

            <div class="debug-section">
              <h4>🎹 MIDI Notes</h4>
              <div class="debug-grid">
                <div class="debug-item">
                  <span class="label">Expected:</span>
                  <span class="value notes-display">
                    <span *ngIf="expectedNotes().length === 0" class="empty">None (Rest or End)</span>
                    <span *ngFor="let note of expectedNotes()" class="note-badge expected">
                      {{ note }} ({{ midiToNoteName(note) }})
                    </span>
                  </span>
                </div>
                <div class="debug-item">
                  <span class="label">Playing:</span>
                  <span class="value notes-display">
                    <span *ngIf="activeNotesArray().length === 0" class="empty">None</span>
                    <span *ngFor="let note of activeNotesArray()" class="note-badge playing">
                      {{ note }} ({{ midiToNoteName(note) }})
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div class="debug-section">
              <h4>🔍 Evaluation State</h4>
              <div class="debug-grid">
                <div class="debug-item">
                  <span class="label">Waiting for Release:</span>
                  <span class="value" [style.color]="waitingForRelease() ? '#ff9800' : '#4caf50'">
                    {{ waitingForRelease() ? "🔒 YES - Release keys to continue" : "✓ Ready" }}
                  </span>
                </div>
                <div class="debug-item">
                  <span class="label">Last Evaluated Key:</span>
                  <span class="value">{{ lastEvaluatedNotes() || 'None' }}</span>
                </div>
                <div class="debug-item">
                  <span class="label">Last Result:</span>
                  <span class="value" [class.correct]="evaluationService.lastResult()?.pitch_correct"
                        [class.incorrect]="evaluationService.lastResult() && !evaluationService.lastResult()?.pitch_correct">
                    {{ evaluationService.lastResult() ? (evaluationService.lastResult()?.pitch_correct ? '✓ Correct' : '✗ Wrong') : 'Waiting...' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="debug-section">
              <h4>📊 Session Stats</h4>
              <div class="debug-grid">
                <div class="debug-item">
                  <span class="label">Total Evaluated:</span>
                  <span class="value">{{ evaluationService.stats()?.total_notes ?? 0 }}</span>
                </div>
                <div class="debug-item">
                  <span class="label">Current Streak:</span>
                  <span class="value">{{ evaluationService.stats()?.current_streak ?? 0 }}</span>
                </div>
                <div class="debug-item">
                  <span class="label">Accuracy:</span>
                  <span class="value">{{ evaluationService.stats()?.accuracy?.toFixed(1) ?? 0 }}%</span>
                </div>
              </div>
            </div>
          </div>
        </mat-expansion-panel>

        <!-- Measures Preview -->
        <section class="measures-section">
          <h2>📋 Lesson Content</h2>
          <div class="measures-grid">
            <mat-card
              class="measure-card"
              *ngFor="let measure of lesson()!.measures; let i = index"
            >
              <mat-card-header>
                <mat-card-title>Measure {{ measure.number }}</mat-card-title>
                <mat-card-subtitle
                  >{{ measure.notes.length }} notes</mat-card-subtitle
                >
              </mat-card-header>
              <mat-card-content>
                <div class="notes-list">
                  <span
                    class="note-chip"
                    *ngFor="let note of measure.notes"
                    [class.rest]="isRest(note)"
                    [class.chord]="isChord(note)"
                  >
                    {{ getNoteDisplay(note) }}
                  </span>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </section>

        <!-- Playback Controls (only show in classic view) -->
        <div class="playback-controls-bar" *ngIf="playerView() === 'classic'">
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
                     (valueChange)="onSeek($event)">
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
                    (click)="togglePlayback()"
                    matTooltip="{{ playbackService.isPlaying() ? 'Pause' : 'Play' }}">
              <mat-icon>{{ playbackService.isPlaying() ? 'pause' : 'play_arrow' }}</mat-icon>
            </button>

            <button mat-icon-button
                    (click)="toggleVolume()"
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
                     (valueChange)="onTempoChange($event)">
            </mat-slider>
            <span class="tempo-value">{{ playbackService.tempo() }} BPM</span>
          </div>
        </div>
      </ng-container>
    </div>
  `,
    styles: [
        `
      .lesson-player {
        width: 100%;
        max-width: 100%;
        margin: 0;
        padding: 1rem 2rem;
        box-sizing: border-box;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem;
        gap: 1rem;

        p {
          color: #666;
        }
      }

      .error-card,
      .warning-card {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1.5rem;
        margin-bottom: 2rem;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
        }

        h3 {
          margin: 0 0 0.5rem 0;
        }

        p {
          margin: 0 0 1rem 0;
          color: #666;
        }

        button {
          margin-right: 0.5rem;
        }
      }

      .error-card {
        background: #ffebee;

        mat-icon {
          color: #c62828;
        }

        h3 {
          color: #c62828;
        }
      }

      .warning-card {
        background: #fff3e0;

        mat-icon {
          color: #ef6c00;
        }
      }

      .lesson-header {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1.5rem;

        .back-button {
          margin-top: 0.25rem;
        }

        h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
        }

        .description {
          color: #666;
          margin: 0;
        }
      }

      .lesson-stats {
        margin-bottom: 2rem;

        mat-chip {
          mat-icon {
            margin-right: 4px;
            font-size: 18px;
            width: 18px;
            height: 18px;
          }

          &.study-mode {
            background: #e8f5e9 !important;
            color: #2e7d32 !important;
          }

          &.play-mode {
            background: #e3f2fd !important;
            color: #1565c0 !important;
          }
        }
      }

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

      .staff-placeholder {
        margin-bottom: 2rem;

        mat-icon[mat-card-avatar] {
          background: linear-gradient(135deg, #3f51b5, #7986cb);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          width: 40px;
          height: 40px;
        }

        .staff-preview {
          background: #fafafa;
          padding: 2rem;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;

          .staff-line {
            height: 2px;
            background: #333;
          }
        }
      }

      .measures-section {
        margin-bottom: 2rem;

        h2 {
          margin-bottom: 1rem;
        }
      }

      .measures-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
      }

      .measure-card {
        .notes-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .note-chip {
          background: #e3f2fd;
          color: #1565c0;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.85rem;

          &.rest {
            background: #f5f5f5;
            color: #666;
          }

          &.chord {
            background: #e8f5e9;
            color: #2e7d32;
          }
        }
      }

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

      /* Add padding to bottom of page so content isn't hidden behind playback bar */
      .lesson-player {
        padding-bottom: 100px;
      }

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
    `,
    ],
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
    notesToRelease = signal<Set<number>>(new Set()); // Track which notes need to be released
    lastEvaluatedNotes = signal<string>(''); // Track last evaluated combination

    // Timing mode state
    private timingIntervalId: number | null = null;
    private timingStartTime = 0;
    private currentNoteStartBeat = 0; // Beat position where current note starts
    isTimingPlaying = signal(false); // Whether timing mode is actively running
    notePlayedInWindow = signal(false); // Whether current note was played correctly
    timingWindowMs = 400; // Timing window in ms (±200ms around the beat)
    playheadBeatPosition = signal(-1); // Smooth playhead position in beats (-1 = hidden)

    // Expose service signals
    lesson = this.lessonService.currentLesson;
    loading = this.lessonService.loading;
    error = this.lessonService.error;

    // Convert Set to Array for template binding - use computed for reactivity
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

        // Extract MIDI numbers from note
        if (isRestNote(note)) return [];
        if (isSingleNote(note)) return [(note as SingleNoteDTO).midi];
        if (isChordNote(note)) return (note as ChordNoteDTO).midi;
        return [];
    });

    // Helper functions
    formatDuration = formatDuration;
    isRest = isRestNote;
    isChord = isChordNote;
    midiToNoteName = midiToNoteName;
    Math = Math; // Expose Math to template

    // Lesson mode - user-selectable signal (initialized from lesson default)
    currentMode = signal<LessonMode>('study_right_hand_no_timing');
    isTimingEnabled = computed(() => isTimingMode(this.currentMode()));
    isStudyModeEnabled = computed(() => isStudyMode(this.currentMode()));
    activeHands = computed(() => getModeHands(this.currentMode()));
    modeLabel = computed(() => getLessonModeLabel(this.currentMode()));

    // All available modes for the selector
    availableModes: LessonMode[] = [
        'study_right_hand_no_timing',
        'study_left_hand_no_timing',
        'study_two_hands_no_timing',
        'play_right_hand_timing',
        'play_left_hand_timing',
        'play_two_hands_timing',
    ];
    getModeLabel = getLessonModeLabel;

    // Player view type: 'classic' (staff notation) or 'scrolling' (Guitar Hero style)
    // Default to scrolling view (Guitar Hero style) for better user experience
    playerView = signal<'classic' | 'scrolling'>('scrolling');

    // Computed: global note index for playhead during playback
    getPlayheadPosition(): number {
        if (!this.playbackService.isPlaying() && !this.playbackService.isPaused()) {
            return -1; // Hide playhead when stopped
        }
        const pos = this.playbackService.currentPosition();
        const les = this.lesson();
        if (!les) return -1;

        // Calculate global index from measure and note indices
        let globalIndex = 0;
        for (let i = 0; i < pos.measureIndex && i < les.measures.length; i++) {
            globalIndex += les.measures[i].notes.length;
        }
        globalIndex += pos.noteIndex;
        return globalIndex;
    }

    // Computed: global note index for current evaluation position (cursor during practice)
    getCurrentGlobalNoteIndex(): number {
        const les = this.lesson();
        if (!les) return -1;

        const measureIdx = this.currentMeasureIndex();
        const noteIdx = this.currentNoteIndex();

        // Calculate global index from measure and note indices
        let globalIndex = 0;
        for (let i = 0; i < measureIdx && i < les.measures.length; i++) {
            globalIndex += les.measures[i].notes.length;
        }
        globalIndex += noteIdx;
        return globalIndex;
    }

    constructor() {
        // React to MIDI input and evaluate notes
        effect(() => {
            const active = this.activeNotesArray();
            const expected = this.expectedNotes();
            const toRelease = this.notesToRelease();

            // If waiting for key release, check if we can proceed
            if (this.waitingForRelease()) {
                // Check if all notes that need releasing are no longer active
                const allReleased = [...toRelease].every(note => !active.includes(note));
                if (allReleased) {
                    console.log('[LessonPlayer] Expected notes released, ready for next note');
                    this.waitingForRelease.set(false);
                    this.notesToRelease.set(new Set());
                    this.lastEvaluatedNotes.set(''); // Clear debounce
                } else {
                    // Not all old notes released, but check if NEW expected notes are being played
                    // This allows legato playing (pressing next note before releasing previous)
                    const newExpectedDifferent = expected.length > 0 &&
                        !expected.every(exp => toRelease.has(exp)); // New expected != old expected
                    const newExpectedPressed = newExpectedDifferent &&
                        expected.every(exp => active.includes(exp));

                    if (newExpectedPressed) {
                        // New expected notes are pressed - clear the wait and continue
                        console.log('[LessonPlayer] New expected notes pressed (legato), proceeding');
                        this.waitingForRelease.set(false);
                        this.notesToRelease.set(new Set());
                        this.lastEvaluatedNotes.set('');
                    } else {
                        return; // Still waiting for expected notes to be released
                    }
                }
            }

            if (active.length > 0 && expected.length > 0) {
                // Create a unique key for this combination to prevent re-evaluation
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

        // Get lesson ID from route
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
            console.log('[LessonPlayer] Loaded:', lesson);
            console.log('[LessonPlayer] Measures:', lesson.measures);
            if (lesson.measures.length > 0) {
                console.log('[LessonPlayer] First measure notes:', lesson.measures[0].notes);
            }

            // Initialize mode from lesson's suggested mode or default to study right hand
            if (lesson.mode) {
                this.currentMode.set(lesson.mode);
                console.log('[LessonPlayer] Using lesson mode:', lesson.mode);
            } else {
                this.currentMode.set('study_right_hand_no_timing');
                console.log('[LessonPlayer] Using default mode: study_right_hand_no_timing');
            }

            // Reset evaluation stats for new lesson
            await this.evaluationService.resetStats();

            // Skip any initial rests to start at the first playable note
            this.skipRests();
        } catch (err) {
            console.error('Failed to load lesson:', err);
        }
    }

    /**
     * Skip over rests to the next playable note
     * Rests don't require user input - they're just silence
     */
    private skipRests(): void {
        const les = this.lesson();
        if (!les || les.measures.length === 0) return;

        let measureIdx = this.currentMeasureIndex();
        let noteIdx = this.currentNoteIndex();

        // Keep advancing while current note is a rest
        while (measureIdx < les.measures.length) {
            const measure = les.measures[measureIdx];
            if (noteIdx >= measure.notes.length) {
                // Move to next measure
                measureIdx++;
                noteIdx = 0;
                continue;
            }

            const note = measure.notes[noteIdx];
            if (isRestNote(note)) {
                console.log('[LessonPlayer] Skipping rest at measure', measureIdx, 'note', noteIdx);
                noteIdx++;
            } else {
                // Found a playable note
                break;
            }
        }

        // Update position if we moved
        if (measureIdx !== this.currentMeasureIndex() || noteIdx !== this.currentNoteIndex()) {
            if (measureIdx >= les.measures.length) {
                // All remaining notes are rests - lesson complete
                console.log('[LessonPlayer] All remaining notes are rests, lesson complete');
                if (this.playerView() === 'classic') {
                    this.showCompletionDialog();
                }
            } else {
                this.currentMeasureIndex.set(measureIdx);
                this.currentNoteIndex.set(noteIdx);
                console.log('[LessonPlayer] Skipped to playable note at measure', measureIdx, 'note', noteIdx);
            }
        }
    }

    /**
     * Evaluate played notes against expected notes
     * Behavior depends on mode:
     * - Study mode: Wait for correct notes, then advance
     * - Timing mode: Mark as played if correct within timing window
     */
    private async evaluatePlayedNotes(played: number[], expected: number[]): Promise<void> {
        console.log('[LessonPlayer] Evaluating - Played:', played, 'Expected:', expected);

        // Check if all expected notes are played (chord matching)
        const allCorrect = expected.every(exp => played.includes(exp)) && played.length === expected.length;

        if (allCorrect) {
            console.log('[LessonPlayer] All notes correct!');
            // All notes correct - evaluate all in parallel for faster processing
            await Promise.all(expected.map(midi =>
                this.evaluationService.checkPitch(midi, midi)
            ));

            // Different behavior for timing vs study mode
            if (this.isTimingPlaying()) {
                // Timing mode: mark as played, timing tick will handle advancement
                this.notePlayedInWindow.set(true);
                console.log('[LessonPlayer] Timing mode: Note played in window!');
            } else {
                // Study mode: wait for release then advance
                this.notesToRelease.set(new Set(expected));
                this.advanceToNextNote();
            }
        } else {
            console.log('[LessonPlayer] Wrong notes - played:', played, 'expected:', expected);
            // Check individual notes for feedback - all in parallel
            await Promise.all(played.map(midi => {
                const closestExpected = this.findClosestExpected(midi, expected);
                return this.evaluationService.checkPitch(midi, closestExpected);
            }));
        }
    }

    /**
     * Find the closest expected note to a played note
     */
    private findClosestExpected(played: number, expected: number[]): number {
        return expected.reduce((closest, exp) =>
            Math.abs(exp - played) < Math.abs(closest - played) ? exp : closest
        );
    }

    /**
     * Advance to next note in lesson
     */
    private advanceToNextNote(): void {
        const les = this.lesson();
        if (!les) return;

        const measureIdx = this.currentMeasureIndex();
        const noteIdx = this.currentNoteIndex();
        const measure = les.measures[measureIdx];

        console.log('[LessonPlayer] advanceToNextNote - measureIdx:', measureIdx, 'noteIdx:', noteIdx);
        console.log('[LessonPlayer] Total measures:', les.measures.length, 'Notes in current measure:', measure.notes.length);

        if (noteIdx + 1 < measure.notes.length) {
            // Next note in current measure
            console.log('[LessonPlayer] Moving to next note in same measure');
            this.currentNoteIndex.set(noteIdx + 1);
        } else if (measureIdx + 1 < les.measures.length) {
            // First note of next measure
            console.log('[LessonPlayer] Moving to first note of next measure');
            this.currentMeasureIndex.set(measureIdx + 1);
            this.currentNoteIndex.set(0);
        } else {
            // Lesson complete!
            console.log('[LessonPlayer] Lesson complete! Last measure:', measureIdx, 'Last note:', noteIdx);
            // Only show completion dialog directly in classic view
            // In scrolling view, the scrolling player handles completion with its buffer
            if (this.playerView() === 'classic') {
                this.showCompletionDialog();
            }
            return; // Don't set waitingForRelease since lesson is done
        }

        // Skip any rests to get to the next playable note
        this.skipRests();

        // Check if we ended up at the end of the lesson after skipping rests
        if (this.currentMeasureIndex() >= les.measures.length) {
            return; // Lesson complete, don't set waitingForRelease
        }

        // Wait for user to release keys before evaluating next note
        this.waitingForRelease.set(true);
        console.log('[LessonPlayer] Advanced to next note, waiting for key release');
    }

    /**
     * Show completion dialog when lesson is finished
     * @param extendedStats Optional extended statistics from scrolling player
     */
    showCompletionDialog(extendedStats?: ExtendedStats): void {
        // Prevent duplicate dialogs
        if (this.isCompletionDialogOpen) {
            console.log('[LessonPlayer] Completion dialog already open, ignoring');
            return;
        }

        console.log('[LessonPlayer] showCompletionDialog called');
        console.log('[LessonPlayer] Current lesson:', this.lesson());
        console.log('[LessonPlayer] Current stats:', this.evaluationService.stats());
        console.log('[LessonPlayer] Extended stats:', extendedStats);

        this.isCompletionDialogOpen = true;

        // Award lesson completion XP
        this.evaluationService.awardLessonCompletionXP();

        const dialogRef = this.dialog.open(LessonCompletionDialogComponent, {
            data: {
                lessonTitle: this.lesson()?.title || 'Lesson',
                stats: this.evaluationService.stats(),
                extendedStats: extendedStats
            },
            disableClose: true,
            width: '500px',
            // Ensure dialog appears above fullscreen content
            panelClass: 'completion-dialog-fullscreen',
            hasBackdrop: true,
            backdropClass: 'completion-dialog-backdrop'
        });

        console.log('[LessonPlayer] Dialog opened, ref:', dialogRef);

        dialogRef.afterClosed().subscribe(result => {
            console.log('[LessonPlayer] Dialog closed with result:', result);
            this.isCompletionDialogOpen = false;
            if (result === 'replay') {
                this.replayLesson();
            } else {
                this.goBack();
            }
        });
    }

    /**
     * Restart the current lesson
     */
    private replayLesson(): void {
        console.log('[LessonPlayer] Replaying lesson');

        // Reset classic view state
        this.currentMeasureIndex.set(0);
        this.currentNoteIndex.set(0);
        this.waitingForRelease.set(false);
        this.lastEvaluatedNotes.set('');
        this.evaluationService.resetStats();

        // Restart scrolling player if in scrolling view
        if (this.playerView() === 'scrolling' && this.scrollingPlayer) {
            console.log('[LessonPlayer] Restarting scrolling player');
            this.scrollingPlayer.restart();
        }
    }

    goBack(): void {
        this.playbackService.stop();
        this.router.navigate(['/lessons']);
    }

    /**
     * Change the practice mode
     */
    onModeChange(mode: LessonMode): void {
        console.log('[LessonPlayer] Mode changed to:', mode);

        // Stop timing if it was running
        this.stopTimingMode();

        this.currentMode.set(mode);

        // Reset progress when mode changes
        this.currentMeasureIndex.set(0);
        this.currentNoteIndex.set(0);
        this.waitingForRelease.set(false);
        this.lastEvaluatedNotes.set('');
        this.evaluationService.resetStats();

        // Skip initial rests
        this.skipRests();
    }

    /**
     * Change the player view type
     */
    onViewChange(view: 'classic' | 'scrolling'): void {
        console.log('[LessonPlayer] View changed to:', view);

        // Stop timing if it was running
        this.stopTimingMode();

        this.playerView.set(view);

        // Reset progress when view changes
        this.currentMeasureIndex.set(0);
        this.currentNoteIndex.set(0);
        this.waitingForRelease.set(false);
        this.lastEvaluatedNotes.set('');
        this.evaluationService.resetStats();
    }

    /**
     * Handle pause from scrolling player
     */
    onScrollingPaused(): void {
        console.log('[LessonPlayer] Scrolling player paused');
    }

    /**
     * Start timing mode - cursor advances automatically based on tempo
     */
    startTimingMode(): void {
        if (this.timingIntervalId !== null) return; // Already running

        const les = this.lesson();
        if (!les) return;

        console.log('[LessonPlayer] Starting timing mode');
        this.isTimingPlaying.set(true);
        this.timingStartTime = performance.now();
        this.currentNoteStartBeat = this.calculateCurrentBeatPosition();
        this.notePlayedInWindow.set(false);

        // Calculate beat duration in ms
        const beatDurationMs = 60000 / les.tempo;

        // Start timing loop (check every 50ms for responsiveness)
        this.timingIntervalId = window.setInterval(() => {
            this.timingTick(beatDurationMs);
        }, 50);
    }

    /**
     * Stop timing mode
     */
    stopTimingMode(): void {
        if (this.timingIntervalId !== null) {
            console.log('[LessonPlayer] Stopping timing mode');
            window.clearInterval(this.timingIntervalId);
            this.timingIntervalId = null;
        }
        this.isTimingPlaying.set(false);
    }

    /**
     * Toggle timing mode (start/stop)
     */
    toggleTimingMode(): void {
        if (this.isTimingPlaying()) {
            this.stopTimingMode();
        } else {
            this.startTimingMode();
        }
    }

    /**
     * Timing tick - called periodically to check if we need to advance
     */
    private timingTick(beatDurationMs: number): void {
        const les = this.lesson();
        if (!les) return;

        const measureIdx = this.currentMeasureIndex();
        const noteIdx = this.currentNoteIndex();

        // Check if lesson is complete
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

        // Calculate elapsed time since note started
        const elapsed = performance.now() - this.timingStartTime;
        const noteEndTime = this.currentNoteStartBeat * beatDurationMs + noteDurationMs;

        // Check if we've passed the timing window for this note
        if (elapsed > noteEndTime + this.timingWindowMs / 2) {
            // Time window passed
            if (!this.notePlayedInWindow()) {
                // Note was missed - mark as incorrect
                console.log('[LessonPlayer] Timing: Note missed!');
                const expected = this.expectedNotes();
                if (expected.length > 0) {
                    // Record miss for each expected note
                    expected.forEach(midi => {
                        this.evaluationService.checkPitch(0, midi); // 0 = no note played
                    });
                }
            }

            // Advance to next note
            this.advanceToNextNoteInTiming();
        }
    }

    /**
     * Advance to next note in timing mode (no waiting for release)
     */
    private advanceToNextNoteInTiming(): void {
        const les = this.lesson();
        if (!les) return;

        const measureIdx = this.currentMeasureIndex();
        const noteIdx = this.currentNoteIndex();
        const measure = les.measures[measureIdx];

        // Get current note duration to update beat position
        const note = measure.notes[noteIdx];
        const noteDuration = this.getNoteDuration(note);
        this.currentNoteStartBeat += noteDuration;

        if (noteIdx + 1 < measure.notes.length) {
            this.currentNoteIndex.set(noteIdx + 1);
        } else if (measureIdx + 1 < les.measures.length) {
            this.currentMeasureIndex.set(measureIdx + 1);
            this.currentNoteIndex.set(0);
        } else {
            // Lesson complete
            this.stopTimingMode();
            if (this.playerView() === 'classic') {
                this.showCompletionDialog();
            }
            return;
        }

        // Reset for next note
        this.notePlayedInWindow.set(false);
        this.lastEvaluatedNotes.set('');

        // Skip rests automatically in timing mode
        this.skipRestsInTiming();
    }

    /**
     * Skip rests in timing mode (add their duration to beat position)
     */
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
                // Add rest duration to beat position
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

    /**
     * Calculate current beat position based on measure/note index
     */
    private calculateCurrentBeatPosition(): number {
        const les = this.lesson();
        if (!les) return 0;

        let beatPosition = 0;
        const measureIdx = this.currentMeasureIndex();
        const noteIdx = this.currentNoteIndex();

        // Add all previous measures
        for (let m = 0; m < measureIdx; m++) {
            for (const note of les.measures[m].notes) {
                beatPosition += this.getNoteDuration(note);
            }
        }

        // Add notes in current measure before current note
        const currentMeasure = les.measures[measureIdx];
        if (currentMeasure) {
            for (let n = 0; n < noteIdx; n++) {
                beatPosition += this.getNoteDuration(currentMeasure.notes[n]);
            }
        }

        return beatPosition;
    }

    /**
     * Get note duration in beats
     */
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
        return 1; // Default to 1 beat
    }

    /**
     * Toggle playback (play/pause)
     */
    togglePlayback(): void {
        const les = this.lesson();
        if (!les) return;

        // Load lesson into playback service if not already loaded
        if (this.playbackService.isStopped()) {
            this.playbackService.loadLesson(les);
        }

        this.playbackService.toggle();
    }

    /**
     * Seek to position in playback
     */
    onSeek(percent: number): void {
        this.playbackService.seekTo(percent);
    }

    /**
     * Change playback tempo
     */
    onTempoChange(bpm: number): void {
        this.playbackService.setTempo(bpm);
    }

    /**
     * Toggle volume (mute/unmute)
     */
    toggleVolume(): void {
        if (this.pianoService.volume() > 0) {
            this.pianoService.setVolume(0);
        } else {
            this.pianoService.setVolume(0.7);
        }
    }

    getNoteDisplay(note: NoteDTO): string {
        if (isRestNote(note)) {
            return `Rest (${note.duration})`;
        }
        if (isSingleNote(note)) {
            const single = note as SingleNoteDTO;
            return `${midiToNoteName(single.midi)} (${single.hand})`;
        }
        if (isChordNote(note)) {
            const chord = note as ChordNoteDTO;
            const names = chord.midi.map((m: number) => midiToNoteName(m)).join('+');
            return `${names} (${chord.hand})`;
        }
        return '?';
    }
}
