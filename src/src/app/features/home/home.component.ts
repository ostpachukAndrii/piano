import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { LessonService } from '../../core/services/lesson.service';
import { TauriService } from '../../core/services/tauri.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule
    ],
    template: `
    <div class="home-container">
      <header class="hero">
        <h1>🎹 Piano Learning App</h1>
        <p class="subtitle">Learn to play piano with interactive lessons</p>
        <p class="tech-stack" *ngIf="isTauri">
          <span class="badge angular">Angular 18</span>
          <span class="badge rust">Rust + Tauri</span>
        </p>
        <p class="browser-mode" *ngIf="!isTauri">
          ⚠️ Running in browser mode (Tauri features unavailable)
        </p>
      </header>

      <section class="quick-actions">
        <mat-card class="action-card" (click)="goToLessons()">
          <mat-card-header>
            <mat-icon mat-card-avatar>library_music</mat-icon>
            <mat-card-title>Start Learning</mat-card-title>
            <mat-card-subtitle>{{ lessonCount() }} lessons available</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Browse and practice piano lessons</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary">
              <mat-icon>play_arrow</mat-icon>
              View Lessons
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card class="action-card" (click)="goToSettings()">
          <mat-card-header>
            <mat-icon mat-card-avatar>piano</mat-icon>
            <mat-card-title>MIDI Setup</mat-card-title>
            <mat-card-subtitle>Connect your keyboard</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Configure your MIDI keyboard</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-stroked-button>
              <mat-icon>settings</mat-icon>
              Settings
            </button>
          </mat-card-actions>
        </mat-card>
      </section>

      <section class="status" *ngIf="loading()">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading lessons...</p>
      </section>

      <section class="error" *ngIf="error()">
        <mat-card class="error-card">
          <mat-icon>error</mat-icon>
          <p>{{ error() }}</p>
        </mat-card>
      </section>
    </div>
  `,
    styles: [`
    .home-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }

    .hero {
      text-align: center;
      margin-bottom: 3rem;

      h1 {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
      }

      .subtitle {
        font-size: 1.2rem;
        color: #666;
        margin-bottom: 1rem;
      }

      .tech-stack {
        display: flex;
        justify-content: center;
        gap: 0.5rem;

        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.85rem;
          font-weight: 500;

          &.angular {
            background: #dd0031;
            color: white;
          }

          &.rust {
            background: #f74c00;
            color: white;
          }
        }
      }

      .browser-mode {
        color: #f57c00;
        font-size: 0.9rem;
      }
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .action-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.15);
      }

      mat-icon[mat-card-avatar] {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: #3f51b5;
      }
    }

    .status {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 2rem;
      gap: 1rem;
    }

    .error-card {
      background: #ffebee;
      color: #c62828;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
    }
  `]
})
export class HomeComponent implements OnInit {
    isTauri = false;

    private router = inject(Router);
    private lessonService = inject(LessonService);
    private tauriService = inject(TauriService);

    // Expose signals to template
    loading = this.lessonService.loading;
    error = this.lessonService.error;
    lessonCount = this.lessonService.lessonCount;

    async ngOnInit(): Promise<void> {
        this.isTauri = this.tauriService.isTauri();

        if (this.isTauri) {
            try {
                await this.lessonService.listLessons();
            } catch (err) {
                console.error('Failed to load lessons on init', err);
            }
        }
    }

    goToLessons(): void {
        this.router.navigate(['/lessons']);
    }

    goToSettings(): void {
        this.router.navigate(['/settings']);
    }
}
