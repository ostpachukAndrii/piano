import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
        MatDividerModule,
        MatProgressSpinnerModule
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

            <!-- Bluetooth MIDI Info -->
            <div class="bluetooth-info">
              <mat-icon>bluetooth</mat-icon>
              <span>Bluetooth MIDI devices also appear here after pairing in Windows Settings</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-divider></mat-divider>

      <!-- Bluetooth MIDI Setup Guide -->
      <mat-card class="settings-card bluetooth-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="bluetooth-icon">bluetooth</mat-icon>
          <mat-card-title>Bluetooth MIDI Setup</mat-card-title>
          <mat-card-subtitle>Connect your piano wirelessly</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="bluetooth-guide">
            <p class="guide-intro">
              To connect a Bluetooth MIDI device (like Roland FP-E50), pair it through Windows first:
            </p>

            <ol class="setup-steps">
              <li>
                <mat-icon>settings_bluetooth</mat-icon>
                <div>
                  <strong>Enable Bluetooth on your piano</strong>
                  <p>Check your piano's settings menu for Bluetooth MIDI option</p>
                </div>
              </li>
              <li>
                <mat-icon>settings</mat-icon>
                <div>
                  <strong>Open Windows Settings</strong>
                  <p>Go to <em>Settings → Bluetooth & devices → Add device</em></p>
                </div>
              </li>
              <li>
                <mat-icon>add_circle</mat-icon>
                <div>
                  <strong>Pair your device</strong>
                  <p>Select your piano (e.g., "FP-E50 MIDI") from the list</p>
                </div>
              </li>
              <li>
                <mat-icon>refresh</mat-icon>
                <div>
                  <strong>Scan for devices above</strong>
                  <p>After pairing, click "Scan for Devices" - your piano will appear in the MIDI devices list</p>
                </div>
              </li>
            </ol>

            <div class="bluetooth-tips">
              <mat-icon>lightbulb</mat-icon>
              <span>Once paired in Windows, your Bluetooth MIDI device works just like a USB device!</span>
            </div>
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

    .bluetooth-card {
      mat-icon[mat-card-avatar].bluetooth-icon {
        color: #2196f3;
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

    .bluetooth-connected {
      background: #e3f2fd;
      border-color: #2196f3;

      .device-info .success-icon {
        color: #2196f3;
      }

      .device-info .device-status {
        color: #1976d2;
      }
    }

    .scan-button {
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      mat-spinner {
        margin-right: 8px;
      }
    }

    .midi-badge {
      background: #4caf50;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      margin-left: 8px;
      font-weight: 500;
    }

    .midi-device {
      background: #f1f8e9;
    }

    .bluetooth-tips {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #1976d2;
      padding: 0.75rem;
      background: #e3f2fd;
      border-radius: 4px;
      margin-top: 1rem;
      font-size: 0.9rem;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .bluetooth-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #1976d2;
      padding: 0.75rem;
      background: #e3f2fd;
      border-radius: 4px;
      margin-top: 1rem;
      font-size: 0.85rem;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .bluetooth-guide {
      .guide-intro {
        margin-bottom: 1rem;
        color: #333;
      }

      .setup-steps {
        list-style: none;
        padding: 0;
        margin: 0 0 1rem 0;

        li {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 0.5rem;
          background: #f5f5f5;

          mat-icon {
            color: #2196f3;
            margin-top: 2px;
          }

          strong {
            display: block;
            margin-bottom: 0.25rem;
          }

          p {
            margin: 0;
            color: #666;
            font-size: 0.9rem;
          }

          em {
            background: #e3f2fd;
            padding: 0.1rem 0.3rem;
            border-radius: 3px;
            font-style: normal;
          }
        }
      }
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

    // MIDI signals (includes both USB and Bluetooth MIDI devices)
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

    // USB MIDI methods
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
