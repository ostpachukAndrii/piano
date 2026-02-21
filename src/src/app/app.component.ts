import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MidiService } from './core/services/midi.service';
import { TauriService } from './core/services/tauri.service';
import { AchievementService } from './core/services/achievement.service';
import { XPProgressBarComponent } from './shared/components/xp-progress-bar/xp-progress-bar.component';
import { AchievementNotificationComponent } from './shared/components/achievement-notification/achievement-notification.component';
import { ErrorDisplayComponent } from './shared/components/error-display/error-display.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    XPProgressBarComponent,
    AchievementNotificationComponent,
    ErrorDisplayComponent
  ],
  template: `
    <mat-toolbar color="primary" class="app-toolbar">
      <button mat-icon-button routerLink="/">
        <mat-icon>piano</mat-icon>
      </button>
      <span class="app-title">Piano Learning App</span>

      <span class="spacer"></span>

      <nav class="nav-links">
        <a mat-button routerLink="/" routerLinkActive="active"
           [routerLinkActiveOptions]="{exact: true}">
          <mat-icon>home</mat-icon>
          Home
        </a>
        <a mat-button routerLink="/lessons" routerLinkActive="active">
          <mat-icon>library_music</mat-icon>
          Lessons
        </a>
        <a mat-button routerLink="/settings" routerLinkActive="active">
          <mat-icon>settings</mat-icon>
          Settings
        </a>
      </nav>
    </mat-toolbar>

    <!-- XP Progress Bar -->
    <app-xp-progress-bar></app-xp-progress-bar>

    <!-- Achievement Notifications -->
    <app-achievement-notification></app-achievement-notification>

    <!-- Error Display -->
    <app-error-display></app-error-display>

    <main class="app-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .app-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .app-title {
      margin-left: 0.5rem;
      font-weight: 500;
    }

    .spacer {
      flex: 1;
    }

    .nav-links {
      display: flex;
      gap: 0.5rem;

      a {
        mat-icon {
          margin-right: 0.25rem;
        }

        &.active {
          background: rgba(255, 255, 255, 0.15);
        }
      }
    }

    .app-content {
      min-height: calc(100vh - 64px);
      background: #fafafa;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'piano-app';

  private midiService = inject(MidiService);
  private tauriService = inject(TauriService);
  private achievementService = inject(AchievementService);

  async ngOnInit(): Promise<void> {
    // Auto-connect to MIDI device if in Tauri environment
    if (this.tauriService.isTauri()) {
      try {
        console.log('[App] Attempting auto-connect to MIDI device...');
        const connected = await this.midiService.autoConnect();
        if (!connected) {
          console.log('[App] No MIDI devices found for auto-connect');
        }
      } catch (err) {
        console.error('[App] MIDI auto-connect error (non-fatal):', err);
      }
    }

    // Start practice session tracking
    this.achievementService.startPracticeSession();
  }
}

