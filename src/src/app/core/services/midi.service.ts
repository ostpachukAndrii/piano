import { computed, inject, Injectable, signal, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MidiChord, MidiDevice, midiToNoteName } from '../models/midi-event.model';
import { BACKEND_CLIENT } from '../api';

/**
 * MIDI service for handling keyboard input
 * Uses BackendClient abstraction for testability
 */
@Injectable({
    providedIn: 'root'
})
export class MidiService implements OnDestroy {
    private snackBar = inject(MatSnackBar);
    private backend = inject(BACKEND_CLIENT);

    // Cleanup functions for event listeners
    private cleanupFunctions: Array<() => void> = [];

    // Reactive state
    private readonly _devices = signal<MidiDevice[]>([]);
    private readonly _selectedDevice = signal<MidiDevice | null>(null);
    private readonly _activeNotes = signal<Set<number>>(new Set());
    private readonly _connected = signal(false);
    private readonly _error = signal<string | null>(null);
    private readonly _lastChord = signal<MidiChord | null>(null);

    // Public readonly signals
    readonly devices = this._devices.asReadonly();
    readonly selectedDevice = this._selectedDevice.asReadonly();
    readonly activeNotes = this._activeNotes.asReadonly();
    readonly connected = this._connected.asReadonly();
    readonly error = this._error.asReadonly();
    readonly lastChord = this._lastChord.asReadonly();

    // Computed values
    readonly hasDevices = computed(() => this._devices().length > 0);
    readonly activeNoteNames = computed(() => {
        const notes = this._activeNotes();
        return Array.from(notes).map(midiToNoteName);
    });

    constructor() {
        this.setupEventListeners();
    }

    /**
     * Clean up event listeners on service destruction
     */
    ngOnDestroy(): void {
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions = [];
    }

    /**
     * Set up backend event listeners for MIDI events
     */
    private setupEventListeners(): void {
        console.log('[MidiService] Setting up event listeners...');

        // Listen for chord detected events
        const chordCleanup = this.backend.onMidiChordDetected((chord) => {
            console.log('[MidiService] >>> Received chord event:', chord);
            this.handleChordDetected(chord);
        });
        this.cleanupFunctions.push(chordCleanup);

        // Listen for note-off events
        const noteOffCleanup = this.backend.onMidiNoteOff((note) => {
            console.log('[MidiService] >>> Received note-off:', note);
            this.handleNoteOff(note);
        });
        this.cleanupFunctions.push(noteOffCleanup);

        console.log('[MidiService] Event listeners set up');
    }

    /**
     * Handle chord detected event from backend (note on)
     */
    private handleChordDetected(chord: MidiChord): void {
        // Add the chord notes to active notes
        const currentNotes = new Set(this._activeNotes());
        for (const note of chord.notes) {
            currentNotes.add(note);
        }
        this._activeNotes.set(currentNotes);
        this._lastChord.set(chord);
    }

    /**
     * Handle note-off event from backend
     */
    private handleNoteOff(note: number): void {
        const currentNotes = new Set(this._activeNotes());
        currentNotes.delete(note);
        this._activeNotes.set(currentNotes);
    }

    /**
     * List available MIDI devices
     */
    async listDevices(): Promise<void> {
        try {
            const devices = await this.backend.listMidiDevices();
            this._devices.set(devices);
            this._error.set(null);
        } catch (err) {
            const message = `Failed to list MIDI devices: ${err}`;
            this._error.set(message);
            console.error('[MidiService]', err);
            throw err;
        }
    }

    /**
     * Connect to a MIDI device
     */
    async connect(deviceId: string, showNotification = true): Promise<void> {
        console.log('[MidiService] connect() called with deviceId:', deviceId);
        try {
            console.log('[MidiService] Calling backend.startMidiListening...');
            await this.backend.startMidiListening(deviceId);
            console.log('[MidiService] backend.startMidiListening returned successfully');
            const device = this._devices().find(d => d.id === deviceId);

            if (device) {
                this._selectedDevice.set(device);
                this._connected.set(true);
                this._error.set(null);

                if (showNotification) {
                    this.snackBar.open(`Connected to ${device.name}`, 'Dismiss', {
                        duration: 3000,
                        horizontalPosition: 'center',
                        verticalPosition: 'bottom',
                        panelClass: ['success-snackbar']
                    });
                }
            }
        } catch (err) {
            const message = `Failed to connect: ${err}`;
            this._error.set(message);
            console.error('[MidiService]', err);

            if (showNotification) {
                this.snackBar.open(`Failed to connect to MIDI device`, 'Dismiss', {
                    duration: 4000,
                    horizontalPosition: 'center',
                    verticalPosition: 'bottom',
                    panelClass: ['error-snackbar']
                });
            }

            throw err;
        }
    }

    /**
     * Disconnect from current MIDI device
     */
    async disconnect(showNotification = true): Promise<void> {
        try {
            const deviceName = this._selectedDevice()?.name || 'MIDI device';
            await this.backend.stopMidiListening();

            this._selectedDevice.set(null);
            this._connected.set(false);
            this._activeNotes.set(new Set());
            this._lastChord.set(null);
            this._error.set(null);

            if (showNotification) {
                this.snackBar.open(`Disconnected from ${deviceName}`, 'OK', {
                    duration: 2000,
                    horizontalPosition: 'center',
                    verticalPosition: 'bottom'
                });
            }
        } catch (err) {
            console.error('[MidiService] Disconnect error:', err);
            throw err;
        }
    }

    /**
     * Auto-connect to first available MIDI device
     */
    async autoConnect(): Promise<boolean> {
        try {
            await this.listDevices();
            const devices = this._devices();

            if (devices.length > 0) {
                const firstDevice = devices[0];
                await this.connect(firstDevice.id, true);
                return true;
            }

            return false;
        } catch (err) {
            console.error('[MidiService] Auto-connect failed:', err);
            return false;
        }
    }

    /**
     * Check if a specific note is currently pressed
     */
    isNoteActive(midi: number): boolean {
        return this._activeNotes().has(midi);
    }

    /**
     * Clear error state
     */
    clearError(): void {
        this._error.set(null);
    }
}
