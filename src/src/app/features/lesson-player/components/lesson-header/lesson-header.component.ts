import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { LessonDTO, LessonMode, formatDuration } from '../../../../core/models/lesson.model';

@Component({
    selector: 'app-lesson-header',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
    ],
    template: `
        <!-- Header -->
        <header class="lesson-header">
            <button mat-icon-button (click)="back.emit()" class="back-button">
                <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="lesson-info">
                <h1>{{ lesson.title }}</h1>
                <p class="description" *ngIf="lesson.description">
                    {{ lesson.description }}
                </p>
            </div>
        </header>

        <!-- Lesson Stats -->
        <div class="lesson-stats">
            <mat-chip-set>
                <mat-chip [class.study-mode]="isStudyMode" [class.play-mode]="isTimingEnabled">
                    <mat-icon>{{ isStudyMode ? 'menu_book' : 'music_note' }}</mat-icon>
                    {{ modeLabel }}
                </mat-chip>
                <mat-chip>
                    <mat-icon>schedule</mat-icon>
                    {{ formatDuration(lesson.total_seconds) }}
                </mat-chip>
                <mat-chip *ngIf="isTimingEnabled">
                    <mat-icon>speed</mat-icon>
                    {{ lesson.tempo }} BPM
                </mat-chip>
                <mat-chip>
                    <mat-icon>music_note</mat-icon>
                    {{ lesson.time_signature }}
                </mat-chip>
                <mat-chip>
                    <mat-icon>piano</mat-icon>
                    {{ lesson.key_signature }}
                </mat-chip>
                <mat-chip>
                    <mat-icon>view_module</mat-icon>
                    {{ lesson.measures.length }} measures
                </mat-chip>
                <mat-chip *ngIf="activeHands !== 'both'">
                    <mat-icon>{{ activeHands === 'left' ? 'pan_tool_alt' : 'pan_tool' }}</mat-icon>
                    {{ activeHands === 'left' ? 'Left Hand' : 'Right Hand' }}
                </mat-chip>
            </mat-chip-set>
        </div>
    `,
    styles: [`
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
    `]
})
export class LessonHeaderComponent {
    @Input({ required: true }) lesson!: LessonDTO;
    @Input() currentMode: LessonMode = 'study_right_hand_no_timing';
    @Input() isTimingEnabled = false;
    @Input() isStudyMode = true;
    @Input() activeHands: 'left' | 'right' | 'both' = 'both';
    @Input() modeLabel = '';

    @Output() back = new EventEmitter<void>();

    formatDuration = formatDuration;
}
