import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MidiService } from '../../core/services/midi.service';
import { TauriService } from '../../core/services/tauri.service';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatListModule,
        MatDividerModule
    ],
    template: `
    <div class="settings-container">
      <h2>⚙️ Settings</h2>

      <!-- MIDI Device Selection -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>piano</mat-icon>
          <mat-card-title>MIDI Devices</mat-card-title>
          <mat-card-subtitle>
            {{ connected() ? 'Connected' : 'Not connected' }}
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div *ngIf="!isTauri" class="browser-warning">
            <mat-icon>warning</mat-icon>
            <span>MIDI requires Tauri. Run with <code>cargo tauri dev</code></span>
          </div>

          <div *ngIf="isTauri">
            <!-- Currently Connected Device -->
            <div *ngIf="connected() && selectedDevice()" class="connected-device">
              <div class="device-info">
                <mat-icon class="success-icon">check_circle</mat-icon>
                <div>
                  <strong>{{ selectedDevice()?.name }}</strong>
                  <p class="device-status">Connected and ready</p>
                </div>
              </div>
              <button mat-stroked-button color="warn" (click)="disconnectDevice()">
                <mat-icon>link_off</mat-icon>
                Disconnect
              </button>
            </div>

            <!-- Scan for Devices -->
            <button mat-stroked-button (click)="refreshDevices()" class="scan-button">
              <mat-icon>refresh</mat-icon>
              Scan for Devices
            </button>

            <!-- Available Devices List -->
            <mat-list *ngIf="hasDevices()">
              <mat-list-item *ngFor="let device of devices()">
                <mat-icon matListItemIcon>piano</mat-icon>
                <span matListItemTitle>{{ device.name }}</span>
                <button mat-button color="primary"
                        (click)="connectDevice(device.id)"
                        [disabled]="connected()">
                  Connect
                </button>
              </mat-list-item>
            </mat-list>

            <p *ngIf="!hasDevices()" class="no-devices">
              No MIDI devices found. Connect a keyboard and scan again.
            </p>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-divider></mat-divider>

      <!-- Active Notes Display -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>music_note</mat-icon>
          <mat-card-title>Active Notes</mat-card-title>
          <mat-card-subtitle>Notes currently pressed</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="active-notes" *ngIf="activeNoteNames().length > 0">
            <span class="note-badge" *ngFor="let note of activeNoteNames()">
              {{ note }}
            </span>
          </div>
          <p *ngIf="activeNoteNames().length === 0" class="no-notes">
            Press keys on your MIDI keyboard to see notes here
          </p>
        </mat-card-content>
      </mat-card>

      <!-- App Info -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>info</mat-icon>
          <mat-card-title>About</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p><strong>Piano Learning App</strong></p>
          <p>Version: 0.1.0</p>
          <p>Stack: Angular 18 + Rust (Tauri v2)</p>
          <p>Environment: {{ isTauri ? 'Tauri Desktop' : 'Browser' }}</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
    styles: [`
    .settings-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem;
    }

    h2 {
      margin-bottom: 1.5rem;
    }

    .settings-card {
      margin-bottom: 1.5rem;

      mat-icon[mat-card-avatar] {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #3f51b5;
      }
    }

    .browser-warning {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #f57c00;
      padding: 1rem;
      background: #fff3e0;
      border-radius: 4px;

      code {
        background: #ffecb3;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
      }
    }

    .no-devices, .no-notes {
      color: #666;
      font-style: italic;
    }

    .active-notes {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .note-badge {
      background: #3f51b5;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 2rem;
      font-weight: 500;
      font-size: 1.1rem;
    }

    .connected-device {
      background: #e8f5e9;
      border: 2px solid #4caf50;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .device-info {
        display: flex;
        align-items: center;
        gap: 1rem;

        .success-icon {
          color: #4caf50;
          font-size: 32px;
          width: 32px;
          height: 32px;
        }

        strong {
          font-size: 1.1rem;
        }

        .device-status {
          margin: 0;
          color: #388e3c;
          font-size: 0.9rem;
        }
      }
    }

    .scan-button {
      margin-bottom: 1rem;
    }

    mat-divider {
      margin: 1.5rem 0;
    }
  `]
})
export class SettingsComponent implements OnInit {
    isTauri = false;

    private midiService = inject(MidiService);
    private tauriService = inject(TauriService);

    // Expose signals
    devices = this.midiService.devices;
    hasDevices = this.midiService.hasDevices;
    connected = this.midiService.connected;
    selectedDevice = this.midiService.selectedDevice;
    activeNoteNames = this.midiService.activeNoteNames;

    ngOnInit(): void {
        this.isTauri = this.tauriService.isTauri();

        // Load devices on init
        if (this.isTauri) {
            this.refreshDevices();
        }
    }

    async refreshDevices(): Promise<void> {
        await this.midiService.listDevices();
    }

    async connectDevice(deviceId: string): Promise<void> {
        await this.midiService.connect(deviceId);
    }

    async disconnectDevice(): Promise<void> {
        await this.midiService.disconnect();
    }
}
