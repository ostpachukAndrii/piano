import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BACKEND_CLIENT, BluetoothDeviceInfo, BluetoothStatus } from '../api';

/**
 * Bluetooth MIDI service for handling wireless piano input
 * Uses BackendClient abstraction for testability
 */
@Injectable({
  providedIn: 'root',
})
export class BluetoothMidiService implements OnDestroy {
  private snackBar = inject(MatSnackBar);
  private backend = inject(BACKEND_CLIENT);

  // Cleanup functions for event listeners
  private cleanupFunctions: Array<() => void> = [];

  // Reactive state
  private readonly _devices = signal<BluetoothDeviceInfo[]>([]);
  private readonly _selectedDevice = signal<BluetoothDeviceInfo | null>(null);
  private readonly _status = signal<BluetoothStatus>('Disconnected');
  private readonly _scanning = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly devices = this._devices.asReadonly();
  readonly selectedDevice = this._selectedDevice.asReadonly();
  readonly status = this._status.asReadonly();
  readonly scanning = this._scanning.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed values
  readonly hasDevices = computed(() => this._devices().length > 0);
  readonly connected = computed(() => this._status() === 'Connected');
  readonly midiDevices = computed(() =>
    this._devices().filter((d) => d.is_midi_device)
  );

  constructor() {
    this.setupEventListeners();
  }

  ngOnDestroy(): void {
    this.cleanupFunctions.forEach((cleanup) => cleanup());
    this.cleanupFunctions = [];
  }

  private setupEventListeners(): void {
    // Listen for Bluetooth status changes
    const statusCleanup = this.backend.onBluetoothStatusChanged((status) => {
      this._status.set(status);

      if (typeof status === 'object' && 'Error' in status) {
        this._error.set(status.Error);
      }
    });
    this.cleanupFunctions.push(statusCleanup);
  }

  /**
   * Initialize Bluetooth adapter
   */
  async initialize(): Promise<void> {
    try {
      await this.backend.initBluetooth();
      this._error.set(null);
    } catch (err) {
      const message = `Failed to initialize Bluetooth: ${err}`;
      this._error.set(message);
      console.error('[BluetoothMidiService]', err);
      throw err;
    }
  }

  /**
   * Scan for Bluetooth MIDI devices
   */
  async scanDevices(timeoutSecs = 5): Promise<void> {
    try {
      this._scanning.set(true);
      this._error.set(null);

      this.snackBar.open(`Scanning for Bluetooth devices...`, 'Dismiss', {
        duration: timeoutSecs * 1000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });

      const devices = await this.backend.scanBluetoothDevices(timeoutSecs);
      this._devices.set(devices);

      const midiCount = devices.filter((d) => d.is_midi_device).length;
      this.snackBar.open(
        `Found ${devices.length} devices (${midiCount} MIDI)`,
        'Dismiss',
        {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        }
      );
    } catch (err: unknown) {
      // Extract error message
      const errorMsg = err instanceof Error ? err.message : String(err);
      const message = `Bluetooth error: ${errorMsg}`;
      this._error.set(message);
      console.error('[BluetoothMidiService]', err);

      this.snackBar.open(message, 'Dismiss', {
        duration: 6000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar'],
      });

      throw err;
    } finally {
      this._scanning.set(false);
    }
  }

  /**
   * Connect to a Bluetooth MIDI device
   */
  async connect(
    deviceId: string,
    showNotification = true
  ): Promise<void> {
    try {
      await this.backend.connectBluetoothMidi(deviceId);
      const device = this._devices().find((d) => d.id === deviceId);

      if (device) {
        this._selectedDevice.set(device);
        this._error.set(null);

        if (showNotification) {
          this.snackBar.open(
            `Connected to ${device.name} via Bluetooth`,
            'Dismiss',
            {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['success-snackbar'],
            }
          );
        }
      }
    } catch (err) {
      const message = `Failed to connect: ${err}`;
      this._error.set(message);
      console.error('[BluetoothMidiService]', err);

      if (showNotification) {
        this.snackBar.open('Failed to connect to Bluetooth device', 'Dismiss', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar'],
        });
      }

      throw err;
    }
  }

  /**
   * Disconnect from Bluetooth MIDI device
   */
  async disconnect(showNotification = true): Promise<void> {
    try {
      const deviceName = this._selectedDevice()?.name || 'Bluetooth device';
      await this.backend.disconnectBluetooth();

      this._selectedDevice.set(null);
      this._error.set(null);

      if (showNotification) {
        this.snackBar.open(`Disconnected from ${deviceName}`, 'OK', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      }
    } catch (err) {
      console.error('[BluetoothMidiService] Disconnect error:', err);
      throw err;
    }
  }

  /**
   * Get current Bluetooth status
   */
  async refreshStatus(): Promise<BluetoothStatus> {
    try {
      const status = await this.backend.getBluetoothStatus();
      this._status.set(status);
      return status;
    } catch (err) {
      console.error('[BluetoothMidiService] Status error:', err);
      throw err;
    }
  }

  /**
   * Auto-connect to first available MIDI device
   */
  async autoConnect(): Promise<boolean> {
    await this.scanDevices();
    const midiDevices = this.midiDevices();

    if (midiDevices.length > 0) {
      await this.connect(midiDevices[0].id, true);
      return true;
    }

    return false;
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }
}
