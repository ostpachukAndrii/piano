import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SessionStats } from '../../core/models/evaluation.model';

/**
 * Extended statistics for detailed performance breakdown
 */
export interface ExtendedStats {
  perfectNotes: number;
  earlyNotes: number;
  lateNotes: number;
  missedNotes: number;
  earlyReleases: number;
  wrongNotes: number;
}

export interface CompletionDialogData {
  lessonTitle: string;
  stats: SessionStats;
  extendedStats?: ExtendedStats;
}

@Component({
  selector: 'app-lesson-completion-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="completion-dialog">
      <div class="dialog-header">
        <mat-icon class="trophy-icon">emoji_events</mat-icon>
        <h2>Lesson Complete!</h2>
        <p class="lesson-title">{{ data.lessonTitle }}</p>
      </div>

      <div class="stats-container">
        <div class="stat-card" [class.excellent]="accuracyPercent >= 80">
          <mat-icon>{{ accuracyPercent >= 80 ? 'star' : 'trending_up' }}</mat-icon>
          <div class="stat-value">{{ accuracyPercent }}%</div>
          <div class="stat-label">Accuracy</div>
          <div class="stat-detail" *ngIf="hasExtendedStats">{{ correctNotes }} of {{ totalNotes }} notes</div>
        </div>

        <div class="stat-card" [class.fire]="(data.stats.best_streak || 0) >= 10">
          <mat-icon>whatshot</mat-icon>
          <div class="stat-value">{{ data.stats.best_streak || 0 }}</div>
          <div class="stat-label">Best Streak</div>
        </div>
      </div>

      <!-- Detailed breakdown -->
      <div class="breakdown-section" *ngIf="hasExtendedStats">
        <h3>Performance Breakdown</h3>
        <div class="breakdown-grid">
          <div class="breakdown-item success" *ngIf="extStats.perfectNotes > 0">
            <mat-icon>check_circle</mat-icon>
            <span class="count">{{ extStats.perfectNotes }}</span>
            <span class="label">Perfect</span>
          </div>
          <div class="breakdown-item warning" *ngIf="extStats.earlyNotes > 0">
            <mat-icon>fast_forward</mat-icon>
            <span class="count">{{ extStats.earlyNotes }}</span>
            <span class="label">Early</span>
          </div>
          <div class="breakdown-item warning" *ngIf="extStats.lateNotes > 0">
            <mat-icon>schedule</mat-icon>
            <span class="count">{{ extStats.lateNotes }}</span>
            <span class="label">Late</span>
          </div>
          <div class="breakdown-item error" *ngIf="extStats.missedNotes > 0">
            <mat-icon>remove_circle</mat-icon>
            <span class="count">{{ extStats.missedNotes }}</span>
            <span class="label">Missed</span>
          </div>
          <div class="breakdown-item warning" *ngIf="extStats.earlyReleases > 0">
            <mat-icon>release_alert</mat-icon>
            <span class="count">{{ extStats.earlyReleases }}</span>
            <span class="label">Short</span>
          </div>
          <div class="breakdown-item error" *ngIf="extStats.wrongNotes > 0">
            <mat-icon>close</mat-icon>
            <span class="count">{{ extStats.wrongNotes }}</span>
            <span class="label">Wrong</span>
          </div>
        </div>
      </div>

      <!-- Tips based on performance -->
      <div class="tips-section" *ngIf="hasExtendedStats && getTip()">
        <mat-icon>lightbulb</mat-icon>
        <span>{{ getTip() }}</span>
      </div>

      <div class="performance-message">
        <p *ngIf="accuracyPercent >= 90" class="excellent">🌟 Outstanding performance!</p>
        <p *ngIf="accuracyPercent >= 70 && accuracyPercent < 90" class="good">👍 Great job!</p>
        <p *ngIf="accuracyPercent >= 50 && accuracyPercent < 70" class="okay">💪 Keep practicing!</p>
        <p *ngIf="accuracyPercent < 50" class="needs-work">📚 Practice makes perfect!</p>
      </div>

      <div class="actions">
        <button mat-raised-button color="primary" (click)="replay()">
          <mat-icon>replay</mat-icon>
          Play Again
        </button>
        <button mat-stroked-button (click)="close()">
          <mat-icon>arrow_back</mat-icon>
          Back to Lessons
        </button>
      </div>
    </div>
  `,
  styles: [`
    .completion-dialog {
      padding: 2rem;
      text-align: center;
      min-width: 400px;
    }

    .dialog-header {
      margin-bottom: 2rem;
    }

    .trophy-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ffd700;
      margin-bottom: 1rem;
    }

    h2 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      color: #333;
    }

    .lesson-title {
      color: #666;
      font-size: 1.1rem;
      margin: 0;
    }

    .stats-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: #f5f5f5;
      padding: 1.5rem;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      transition: transform 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-card mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #3f51b5;
    }

    .stat-card.excellent mat-icon {
      color: #4caf50;
    }

    .stat-card.fire mat-icon {
      color: #ff9800;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #333;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-detail {
      font-size: 0.8rem;
      color: #888;
      margin-top: 0.25rem;
    }

    .performance-message {
      margin-bottom: 2rem;
      padding: 1rem;
      border-radius: 8px;
    }

    .performance-message p {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 500;
    }

    .excellent { color: #4caf50; }
    .good { color: #2196f3; }
    .okay { color: #ff9800; }
    .needs-work { color: #f44336; }

    .breakdown-section {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #fafafa;
      border-radius: 8px;
    }

    .breakdown-section h3 {
      margin: 0 0 1rem 0;
      font-size: 0.9rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .breakdown-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: center;
    }

    .breakdown-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
    }

    .breakdown-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .breakdown-item .count {
      font-weight: 700;
    }

    .breakdown-item .label {
      color: inherit;
      opacity: 0.9;
    }

    .breakdown-item.success {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .breakdown-item.warning {
      background: #fff3e0;
      color: #ef6c00;
    }

    .breakdown-item.error {
      background: #ffebee;
      color: #c62828;
    }

    .tips-section {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #e3f2fd;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      color: #1565c0;
      font-size: 0.9rem;
      text-align: left;
    }

    .tips-section mat-icon {
      color: #ffc107;
      flex-shrink: 0;
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .actions button {
      min-width: 150px;
    }
  `]
})
export class LessonCompletionDialogComponent {
  accuracyPercent: number;
  extStats: ExtendedStats;
  hasExtendedStats: boolean;
  totalNotes: number;
  correctNotes: number;

  constructor(
    public dialogRef: MatDialogRef<LessonCompletionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CompletionDialogData
  ) {
    console.log('[CompletionDialog] Initialized with data:', data);
    this.extStats = data.extendedStats || {
      perfectNotes: 0,
      earlyNotes: 0,
      lateNotes: 0,
      missedNotes: 0,
      earlyReleases: 0,
      wrongNotes: 0
    };
    this.hasExtendedStats = !!data.extendedStats;

    // Calculate accuracy from extended stats if available (more accurate)
    if (this.hasExtendedStats) {
      // Count successful notes (perfect, early, late count as "hit")
      this.correctNotes = this.extStats.perfectNotes + this.extStats.earlyNotes + this.extStats.lateNotes;
      // Total = correct + missed + early releases that weren't hit
      this.totalNotes = this.correctNotes + this.extStats.missedNotes;
      this.accuracyPercent = this.totalNotes > 0
        ? Math.round((this.correctNotes / this.totalNotes) * 100)
        : 0;
      console.log('[CompletionDialog] Calculated from ExtendedStats:', {
        correct: this.correctNotes,
        total: this.totalNotes,
        accuracy: this.accuracyPercent
      });
    } else {
      // Fall back to evaluation service stats
      this.accuracyPercent = Math.round(data.stats?.accuracy || 0);
      this.totalNotes = data.stats?.total_notes || 0;
      this.correctNotes = Math.round((this.accuracyPercent / 100) * this.totalNotes);
    }
  }

  getTip(): string | null {
    if (!this.hasExtendedStats) return null;

    const { earlyNotes, lateNotes, missedNotes, earlyReleases, wrongNotes } = this.extStats;
    const total = earlyNotes + lateNotes + missedNotes + earlyReleases + wrongNotes;

    if (total === 0) return null;

    // Find the most common issue
    if (missedNotes > earlyNotes && missedNotes > lateNotes && missedNotes > wrongNotes) {
      return 'Try using Wait mode to practice playing each note before adding timing.';
    }
    if (earlyNotes > lateNotes && earlyNotes > wrongNotes) {
      return 'You\'re playing ahead of the beat. Try following the playhead more closely.';
    }
    if (lateNotes > earlyNotes && lateNotes > wrongNotes) {
      return 'You\'re playing behind the beat. Try to anticipate the notes as they approach.';
    }
    if (earlyReleases > earlyNotes && earlyReleases > lateNotes) {
      return 'Hold the keys longer - release them after the full note duration.';
    }
    if (wrongNotes > 0) {
      return 'Focus on accuracy first. Try a slower tempo or Wait mode to learn the notes.';
    }

    return null;
  }

  replay(): void {
    this.dialogRef.close('replay');
  }

  close(): void {
    this.dialogRef.close('back');
  }
}
