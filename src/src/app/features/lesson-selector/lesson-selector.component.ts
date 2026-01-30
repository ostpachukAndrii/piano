import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { LessonService } from '../../core/services/lesson.service';
import { TauriService } from '../../core/services/tauri.service';
import { LessonCardComponent } from './lesson-card.component';

@Component({
    selector: 'app-lesson-selector',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        LessonCardComponent
    ],
    template: `
    <div class="lesson-selector">
      <header class="page-header">
        <h1>📚 Select a Lesson</h1>
        <p class="subtitle">Choose a lesson to practice</p>
      </header>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading()">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading lessons...</p>
      </div>

      <!-- Error State -->
      <mat-card class="error-card" *ngIf="error()">
        <mat-icon>error_outline</mat-icon>
        <div class="error-content">
          <h3>Failed to load lessons</h3>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="loadLessons()">
            <mat-icon>refresh</mat-icon>
            Retry
          </button>
        </div>
      </mat-card>

      <!-- Browser Mode Warning -->
      <mat-card class="warning-card" *ngIf="!isTauri && !loading()">
        <mat-icon>info</mat-icon>
        <div class="warning-content">
          <h3>Browser Mode</h3>
          <p>Lessons require the Tauri backend. Run with <code>cargo tauri dev</code></p>
        </div>
      </mat-card>

      <!-- Lesson Grid -->
      <div class="lesson-grid" *ngIf="!loading() && !error() && lessons().length > 0">
        <app-lesson-card
          *ngFor="let lesson of lessons()"
          [lesson]="lesson"
          (selected)="onLessonSelected($event)"
        ></app-lesson-card>
      </div>

      <!-- Empty State -->
      <mat-card class="empty-card" *ngIf="!loading() && !error() && isTauri && lessons().length === 0">
        <mat-icon>library_music</mat-icon>
        <h3>No lessons found</h3>
        <p>Add YAML lesson files to the <code>lessons/</code> folder</p>
      </mat-card>
    </div>
  `,
    styles: [`
    .lesson-selector {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page-header {
      margin-bottom: 2rem;

      h1 {
        margin: 0 0 0.5rem 0;
        font-size: 2rem;
      }

      .subtitle {
        color: #666;
        margin: 0;
      }
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

    .lesson-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .error-card, .warning-card, .empty-card {
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
        margin: 0;
        color: #666;
      }

      code {
        background: #f5f5f5;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-size: 0.9rem;
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

      button {
        margin-top: 1rem;
      }
    }

    .warning-card {
      background: #fff3e0;
      
      mat-icon {
        color: #ef6c00;
      }
    }

    .empty-card {
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 3rem;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #9e9e9e;
      }
    }
  `]
})
export class LessonSelectorComponent implements OnInit {
    private router = inject(Router);
    private lessonService = inject(LessonService);
    private tauriService = inject(TauriService);

    isTauri = false;

    // Expose signals
    lessons = this.lessonService.availableLessons;
    loading = this.lessonService.loading;
    error = this.lessonService.error;

    async ngOnInit(): Promise<void> {
        this.isTauri = this.tauriService.isTauri();

        if (this.isTauri) {
            await this.loadLessons();
        }
    }

    async loadLessons(): Promise<void> {
        try {
            await this.lessonService.listLessons();
        } catch (err) {
            console.error('Failed to load lessons', err);
        }
    }

    onLessonSelected(lessonId: string): void {
        console.log(`Selected lesson: ${lessonId}`);
        this.router.navigate(['/lesson', lessonId]);
    }
}
