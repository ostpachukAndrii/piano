import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AchievementService } from '../../../core/services/achievement.service';

/**
 * Achievement Notification Component
 * Shows a toast notification when an achievement is unlocked
 */
@Component({
  selector: 'app-achievement-notification',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="achievement-notification"
         *ngIf="recentUnlock()"
         [@slideIn]>
      <div class="achievement-content">
        <mat-icon class="achievement-icon">{{ recentUnlock()!.icon }}</mat-icon>
        <div class="achievement-details">
          <div class="achievement-header">
            <mat-icon class="trophy">emoji_events</mat-icon>
            <span class="unlock-text">Achievement Unlocked!</span>
          </div>
          <h3>{{ recentUnlock()!.title }}</h3>
          <p>{{ recentUnlock()!.description }}</p>
          <div class="xp-badge">
            <mat-icon>star</mat-icon>
            <span>+{{ recentUnlock()!.xpReward }} XP</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .achievement-notification {
      position: fixed;
      top: 140px;
      right: 2rem;
      z-index: 9999;
      max-width: 400px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .achievement-content {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      color: white;
      position: relative;
    }

    .achievement-content::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #ffd700, #ffed4e, #ffd700);
      animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
      0%, 100% { transform: translateX(-100%); }
      50% { transform: translateX(100%); }
    }

    .achievement-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ffd700;
      flex-shrink: 0;
      animation: bounce 0.8s ease-in-out;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      25% { transform: translateY(-10px); }
      50% { transform: translateY(0); }
      75% { transform: translateY(-5px); }
    }

    .achievement-details {
      flex: 1;
    }

    .achievement-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;

      .trophy {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #ffd700;
      }

      .unlock-text {
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.9;
      }
    }

    h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
    }

    p {
      margin: 0 0 0.75rem 0;
      font-size: 0.95rem;
      opacity: 0.9;
      line-height: 1.4;
    }

    .xp-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: rgba(255, 255, 255, 0.2);
      padding: 0.35rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.9rem;
      font-weight: 600;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #ffd700;
      }
    }
  `],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({
          transform: 'translateX(450px)',
          opacity: 0
        }),
        animate('500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                style({
                  transform: 'translateX(0)',
                  opacity: 1
                }))
      ]),
      transition(':leave', [
        animate('300ms ease-in',
                style({
                  transform: 'translateX(450px)',
                  opacity: 0
                }))
      ])
    ])
  ]
})
export class AchievementNotificationComponent {
  private achievementService = inject(AchievementService);

  recentUnlock = this.achievementService.recentUnlock;
}
