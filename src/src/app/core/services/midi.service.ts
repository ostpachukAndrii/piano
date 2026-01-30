import { computed, inject, Injectable, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MidiChord, MidiDevice, midiToNoteName } from '../models/midi-event.model';
import { TauriService } from './tauri.service';

/**
 * MIDI service for handling keyboard input
 * Connects to Rust backend for native MIDI access via Tauri
 */
@Injectable({
    providedIn: 'root'
})
export class MidiService {
    private snackBar = inject(MatSnackBar);

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

    constructor(private tauri: TauriService) {
        this.setupEventListeners();
    }

    /**
     * Set up Tauri event listeners for MIDI events
     */
    private async setupEventListeners(): Promise<void> {
        if (!this.tauri.isTauri()) {
            console.log('[MidiService] Not in Tauri environment, skipping event setup');
            return;
        }

        // Listen for chord detected events from Rust backend
        // Event: midi_chord_detected with MidiChord payload
        await this.tauri.listen<MidiChord>('midi_chord_detected', (chord) => {
            this.handleChordDetected(chord);
        });

        // Listen for note-off events from Rust backend
        // Event: midi_note_off with note number payload
        await this.tauri.listen<number>('midi_note_off', (note) => {
            this.handleNoteOff(note);
        });

        console.log('[MidiService] Event listeners set up');
    }

    /**
     * Handle chord detected event from backend (note on)
     */
    private handleChordDetected(chord: MidiChord): void {
        // Add the chord notes to active notes (don't replace, add to existing)
        const currentNotes = new Set(this._activeNotes());
        for (const note of chord.notes) {
            currentNotes.add(note);
        }
        this._activeNotes.set(currentNotes);
        this._lastChord.set(chord);

        console.log(`[MIDI] Note On: ${chord.notes.map(midiToNoteName).join('+')} (${chord.hand} hand)`);
    }

    /**
     * Handle note-off event from backend
     */
    private handleNoteOff(note: number): void {
        const currentNotes = new Set(this._activeNotes());
        currentNotes.delete(note);
        this._activeNotes.set(currentNotes);

        console.log(`[MIDI] Note Off: ${midiToNoteName(note)}`);
    }

    /**
     * List available MIDI devices
     * Calls: src-tauri/src/commands/midi.rs::get_midi_devices
     */
    async listDevices(): Promise<void> {
        try {
            const devices = await this.tauri.invoke<MidiDevice[]>('get_midi_devices');
            this._devices.set(devices);
            console.log(`[MidiService] Found ${devices.length} MIDI devices`);
        } catch (err) {
            this._error.set(`Failed to list MIDI devices: ${err}`);
            console.error('[MidiService]', err);
        }
    }

    /**
     * Connect to a MIDI device
     * Calls: src-tauri/src/commands/midi.rs::start_midi_listening
     */
    async connect(deviceId: string, showNotification = true): Promise<void> {
        try {
            await this.tauri.invoke('start_midi_listening', { deviceId });
            const device = this._devices().find(d => d.id === deviceId);
            if (device) {
                this._selectedDevice.set(device);
                this._connected.set(true);
                console.log(`[MidiService] Connected to ${device.name}`);

                if (showNotification) {
                    this.snackBar.open(`🎹 Connected to ${device.name}`, 'Dismiss', {
                        duration: 3000,
                        horizontalPosition: 'center',
                        verticalPosition: 'bottom',
                        panelClass: ['success-snackbar']
                    });
                }
            }
        } catch (err) {
            this._error.set(`Failed to connect: ${err}`);
            console.error('[MidiService]', err);

            if (showNotification) {
                this.snackBar.open(`❌ Failed to connect to MIDI device`, 'Dismiss', {
                    duration: 4000,
                    horizontalPosition: 'center',
                    verticalPosition: 'bottom',
                    panelClass: ['error-snackbar']
                });
            }
        }
    }

    /**
     * Disconnect from current MIDI device
     */
    async disconnect(showNotification = true): Promise<void> {
        try {
            const deviceName = this._selectedDevice()?.name || 'MIDI device';
            await this.tauri.invoke('stop_midi_listening');
            this._selectedDevice.set(null);
            this._connected.set(false);
            this._activeNotes.set(new Set());
            this._lastChord.set(null);
            console.log('[MidiService] Disconnected');

            if (showNotification) {
                this.snackBar.open(`Disconnected from ${deviceName}`, 'OK', {
                    duration: 2000,
                    horizontalPosition: 'center',
                    verticalPosition: 'bottom'
                });
            }
        } catch (err) {
            console.error('[MidiService] Disconnect error:', err);
        }
    }

    /**
     * Auto-connect to first available MIDI device
     */
    async autoConnect(): Promise<boolean> {
        await this.listDevices();
        const devices = this._devices();

        if (devices.length > 0) {
            const firstDevice = devices[0];
            await this.connect(firstDevice.id, true);
            return true;
        }

        return false;
    }

    /**
     * Check if a specific note is currently pressed
     */
    isNoteActive(midi: number): boolean {
        return this._activeNotes().has(midi);
    }
}
