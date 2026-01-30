import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ProgressService } from '../../../core/services/progress.service';

/**
 * XP Progress Bar Component
 * Displays user level and XP progress
 */
@Component({
  selector: 'app-xp-progress-bar',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule, MatIconModule],
  template: `
    <div class="xp-bar-container">
      <!-- Level Display -->
      <div class="level-badge">
        <mat-icon>stars</mat-icon>
        <span class="level-text">{{ progress().level }}</span>
      </div>

      <!-- XP Progress -->
      <div class="xp-progress">
        <div class="xp-info">
          <span class="xp-label">{{ progress().xp }} / {{ progress().xpToNextLevel }} XP</span>
          <span class="next-level">Level {{ progress().level + 1 }}</span>
        </div>
        <mat-progress-bar
          mode="determinate"
          [value]="progressPercent()"
          color="accent">
        </mat-progress-bar>
      </div>

      <!-- XP Gain Notification -->
      <div class="xp-gain"
           *ngIf="lastGain()"
           [@fadeInOut]>
        <mat-icon [class.level-up]="lastGain()?.levelUp">{{ lastGain()?.levelUp ? 'celebration' : 'add_circle' }}</mat-icon>
        <span>+{{ lastGain()?.amount }} XP</span>
        <small>{{ lastGain()?.reason }}</small>
      </div>

      <!-- Level Up Notification -->
      <div class="level-up-notification"
           *ngIf="lastGain()?.levelUp"
           [@levelUp]>
        <div class="level-up-content">
          <mat-icon>emoji_events</mat-icon>
          <h2>Level Up!</h2>
          <p class="new-level">Level {{ lastGain()?.newLevel }}</p>
          <p class="congrats">Congratulations!</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .xp-bar-container {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      position: relative;
    }

    .level-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.4);
      flex-shrink: 0;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: #ffd700;
        position: absolute;
        top: 8px;
      }

      .level-text {
        font-size: 24px;
        font-weight: 700;
        margin-top: 8px;
      }
    }

    .xp-progress {
      flex: 1;
      min-width: 200px;
    }

    .xp-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.85rem;
      opacity: 0.95;
    }

    .xp-label {
      font-weight: 600;
    }

    .next-level {
      font-weight: 500;
      opacity: 0.8;
    }

    mat-progress-bar {
      height: 12px;
      border-radius: 6px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.2) !important;
    }

    mat-progress-bar ::ng-deep .mdc-linear-progress__bar-inner {
      border-color: #ffd700 !important;
      background: linear-gradient(90deg, #ffd700, #ffed4e);
    }

    .xp-gain {
      position: absolute;
      right: 1.5rem;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.95);
      color: #667eea;
      padding: 0.5rem 1rem;
      border-radius: 2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      font-weight: 600;
      font-size: 0.9rem;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #4caf50;

        &.level-up {
          color: #ffd700;
          animation: spin 1s ease-in-out;
        }
      }

      small {
        font-size: 0.75rem;
        opacity: 0.8;
        margin-left: 0.25rem;
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.2); }
      100% { transform: rotate(360deg) scale(1); }
    }

    .level-up-notification {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }

    .level-up-content {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 3rem;
      border-radius: 16px;
      text-align: center;
      color: white;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      max-width: 400px;

      mat-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
        color: #ffd700;
        margin-bottom: 1rem;
        animation: bounce 0.8s ease-in-out infinite;
      }

      h2 {
        font-size: 2.5rem;
        margin: 0 0 1rem 0;
        font-weight: 700;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }

      .new-level {
        font-size: 3rem;
        font-weight: 900;
        color: #ffd700;
        margin: 0 0 1rem 0;
        text-shadow: 0 4px 8px rgba(0,0,0,0.4);
      }

      .congrats {
        font-size: 1.1rem;
        opacity: 0.9;
        margin: 0;
      }
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
  `],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px) scale(0.8)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-10px) scale(0.8)' }))
      ])
    ]),
    trigger('levelUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'scale(0.8)' }))
      ])
    ])
  ]
})
export class XPProgressBarComponent {
  private progressService = inject(ProgressService);

  progress = this.progressService.progress;
  progressPercent = this.progressService.progressPercent;
  lastGain = this.progressService.lastXPGain;
}
