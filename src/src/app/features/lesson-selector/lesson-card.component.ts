import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { LessonMetadataDTO, formatDuration } from '../../core/models/lesson.model';

@Component({
    selector: 'app-lesson-card',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule
    ],
    template: `
    <mat-card class="lesson-card" (click)="onSelect()">
      <mat-card-header>
        <div mat-card-avatar class="lesson-icon">
          <mat-icon>music_note</mat-icon>
        </div>
        <mat-card-title>{{ lesson.title }}</mat-card-title>
        <mat-card-subtitle>
          <mat-icon class="duration-icon">schedule</mat-icon>
          {{ formatDuration(lesson.duration_seconds) }}
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <p class="description" *ngIf="lesson.description">
          {{ lesson.description }}
        </p>
        <p class="description placeholder" *ngIf="!lesson.description">
          No description available
        </p>
      </mat-card-content>

      <mat-card-actions align="end">
        <button mat-button color="primary" (click)="onSelect(); $event.stopPropagation()">
          <mat-icon>play_arrow</mat-icon>
          Start
        </button>
      </mat-card-actions>
    </mat-card>
  `,
    styles: [`
    .lesson-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      height: 100%;
      display: flex;
      flex-direction: column;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.15);
      }
    }

    .lesson-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #3f51b5, #7986cb);
      border-radius: 50%;
      
      mat-icon {
        color: white;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    mat-card-subtitle {
      display: flex;
      align-items: center;
      gap: 4px;

      .duration-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    mat-card-content {
      flex: 1;
    }

    .description {
      color: #666;
      font-size: 0.9rem;
      line-height: 1.4;
      margin: 0;

      &.placeholder {
        font-style: italic;
        color: #999;
      }
    }

    mat-card-actions {
      padding-top: 0;
    }
  `]
})
export class LessonCardComponent {
    @Input({ required: true }) lesson!: LessonMetadataDTO;
    @Output() selected = new EventEmitter<string>();

    formatDuration = formatDuration;

    onSelect(): void {
        this.selected.emit(this.lesson.id);
    }
}
