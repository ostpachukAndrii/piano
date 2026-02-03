import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { MidiService } from './midi.service';
import { BACKEND_CLIENT, BackendClient, MockBackendClient } from '../api';
import { MidiDevice, MidiChord } from '../models/midi-event.model';

describe('MidiService', () => {
  let service: MidiService;
  let mockBackend: MockBackendClient;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    // Create mock backend
    mockBackend = new MockBackendClient();

    // Create mock snackbar
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        MidiService,
        { provide: BACKEND_CLIENT, useValue: mockBackend },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    });

    service = TestBed.inject(MidiService);
  });

  afterEach(() => {
    // Clean up
    service.ngOnDestroy();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have initial state', () => {
      expect(service.devices()).toEqual([]);
      expect(service.selectedDevice()).toBeNull();
      expect(service.connected()).toBe(false);
      expect(service.error()).toBeNull();
      expect(service.hasDevices()).toBe(false);
    });
  });

  describe('listDevices()', () => {
    it('should list MIDI devices from backend', async () => {
      await service.listDevices();

      const devices = service.devices();
      expect(devices.length).toBeGreaterThan(0);
      expect(devices[0].name).toContain('Mock');
    });

    it('should update hasDevices computed signal', async () => {
      expect(service.hasDevices()).toBe(false);

      await service.listDevices();

      expect(service.hasDevices()).toBe(true);
    });

    it('should clear error on successful list', async () => {
      // Set an error first
      await service.connect('invalid-id', false).catch(() => {});
      expect(service.error()).toBeTruthy();

      await service.listDevices();

      expect(service.error()).toBeNull();
    });

    it('should handle backend errors', async () => {
      // Make backend throw error
      spyOn(mockBackend, 'listMidiDevices').and.returnValue(
        Promise.reject(new Error('Backend failed'))
      );

      await expectAsync(service.listDevices()).toBeRejected();
      expect(service.error()).toContain('Failed to list MIDI devices');
    });
  });

  describe('connect()', () => {
    beforeEach(async () => {
      await service.listDevices();
    });

    it('should connect to MIDI device', async () => {
      const devices = service.devices();
      const deviceId = devices[0].id;

      await service.connect(deviceId, false);

      expect(service.connected()).toBe(true);
      expect(service.selectedDevice()).toBeTruthy();
      expect(service.selectedDevice()?.id).toBe(deviceId);
    });

    it('should show notification when specified', async () => {
      const devices = service.devices();
      const deviceId = devices[0].id;

      await service.connect(deviceId, true);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Connected'),
        'Dismiss',
        jasmine.any(Object)
      );
    });

    it('should not show notification when disabled', async () => {
      const devices = service.devices();
      const deviceId = devices[0].id;

      await service.connect(deviceId, false);

      expect(mockSnackBar.open).not.toHaveBeenCalled();
    });

    it('should clear error on successful connect', async () => {
      const devices = service.devices();

      // First attempt fails
      await service.connect('invalid', false).catch(() => {});
      expect(service.error()).toBeTruthy();

      // Second attempt succeeds
      await service.connect(devices[0].id, false);
      expect(service.error()).toBeNull();
    });

    it('should handle connection errors', async () => {
      spyOn(mockBackend, 'startMidiListening').and.returnValue(
        Promise.reject(new Error('Connection failed'))
      );

      await expectAsync(service.connect('device-1', false)).toBeRejected();

      expect(service.connected()).toBe(false);
      expect(service.error()).toContain('Failed to connect');
    });

    it('should show error notification on failure', async () => {
      spyOn(mockBackend, 'startMidiListening').and.returnValue(
        Promise.reject(new Error('Connection failed'))
      );

      await service.connect('device-1', true).catch(() => {});

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed'),
        'Dismiss',
        jasmine.any(Object)
      );
    });
  });

  describe('disconnect()', () => {
    beforeEach(async () => {
      await service.listDevices();
      const devices = service.devices();
      await service.connect(devices[0].id, false);
    });

    it('should disconnect from MIDI device', async () => {
      expect(service.connected()).toBe(true);

      await service.disconnect(false);

      expect(service.connected()).toBe(false);
      expect(service.selectedDevice()).toBeNull();
    });

    it('should clear active notes on disconnect', async () => {
      // Simulate some active notes
      mockBackend.simulateChord([60, 64, 67], 'right');
      expect(service.activeNotes().size).toBeGreaterThan(0);

      await service.disconnect(false);

      expect(service.activeNotes().size).toBe(0);
    });

    it('should clear last chord on disconnect', async () => {
      // Simulate a chord
      mockBackend.simulateChord([60, 64, 67], 'right');
      expect(service.lastChord()).toBeTruthy();

      await service.disconnect(false);

      expect(service.lastChord()).toBeNull();
    });

    it('should show notification when specified', async () => {
      await service.disconnect(true);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Disconnected'),
        'OK',
        jasmine.any(Object)
      );
    });

    it('should handle disconnect errors', async () => {
      spyOn(mockBackend, 'stopMidiListening').and.returnValue(
        Promise.reject(new Error('Disconnect failed'))
      );

      await expectAsync(service.disconnect(false)).toBeRejected();
    });
  });

  describe('autoConnect()', () => {
    it('should connect to first device if available', async () => {
      const result = await service.autoConnect();

      expect(result).toBe(true);
      expect(service.connected()).toBe(true);
      expect(service.selectedDevice()).toBeTruthy();
    });

    it('should return false if no devices available', async () => {
      // Clear mock devices
      spyOn(mockBackend, 'listMidiDevices').and.returnValue(Promise.resolve([]));

      const result = await service.autoConnect();

      expect(result).toBe(false);
      expect(service.connected()).toBe(false);
    });
  });

  describe('MIDI Event Handling', () => {
    it('should handle chord detected event', () => {
      const chord: MidiChord = {
        notes: [60, 64, 67],
        hand: 'right',
        velocity: 100,
        timestamp_ms: 0
      };

      mockBackend.simulateChord(chord.notes, chord.hand);

      expect(service.activeNotes().size).toBe(3);
      expect(service.activeNotes().has(60)).toBe(true);
      expect(service.activeNotes().has(64)).toBe(true);
      expect(service.activeNotes().has(67)).toBe(true);
      expect(service.lastChord()).toEqual(jasmine.objectContaining({
        notes: [60, 64, 67],
        hand: 'right'
      }));
    });

    it('should accumulate notes from multiple chords', () => {
      mockBackend.simulateChord([60, 64, 67], 'right');
      expect(service.activeNotes().size).toBe(3);

      mockBackend.simulateChord([48, 52, 55], 'left');
      expect(service.activeNotes().size).toBe(6);
    });

    it('should handle note-off event', () => {
      // First add some notes
      mockBackend.simulateChord([60, 64, 67], 'right');
      expect(service.activeNotes().size).toBe(3);

      // Release one note
      mockBackend.simulateNoteOff(60);
      expect(service.activeNotes().size).toBe(2);
      expect(service.activeNotes().has(60)).toBe(false);
      expect(service.activeNotes().has(64)).toBe(true);
      expect(service.activeNotes().has(67)).toBe(true);
    });

    it('should handle all notes released', () => {
      mockBackend.simulateChord([60, 64, 67], 'right');

      mockBackend.simulateNoteOff(60);
      mockBackend.simulateNoteOff(64);
      mockBackend.simulateNoteOff(67);

      expect(service.activeNotes().size).toBe(0);
    });

    it('should compute active note names correctly', () => {
      mockBackend.simulateChord([60, 64, 67], 'right'); // C, E, G

      const noteNames = service.activeNoteNames();
      expect(noteNames).toContain('C4');
      expect(noteNames).toContain('E4');
      expect(noteNames).toContain('G4');
    });
  });

  describe('isNoteActive()', () => {
    it('should return false for inactive note', () => {
      expect(service.isNoteActive(60)).toBe(false);
    });

    it('should return true for active note', () => {
      mockBackend.simulateChord([60, 64, 67], 'right');

      expect(service.isNoteActive(60)).toBe(true);
      expect(service.isNoteActive(64)).toBe(true);
      expect(service.isNoteActive(67)).toBe(true);
      expect(service.isNoteActive(69)).toBe(false);
    });
  });

  describe('clearError()', () => {
    it('should clear error state', async () => {
      // Create an error
      await service.connect('invalid', false).catch(() => {});
      expect(service.error()).toBeTruthy();

      service.clearError();

      expect(service.error()).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should clean up event listeners on destroy', () => {
      const chordSpy = jasmine.createSpy();

      // Subscribe to events before
      const cleanup = mockBackend.onMidiChordDetected(chordSpy);

      // Destroy service
      service.ngOnDestroy();

      // Events after destroy should not be received
      mockBackend.simulateChord([60, 64, 67], 'right');

      // The spy from service should not be called
      // (We can't directly test this, but it verifies cleanup runs)
      expect(service.activeNotes().size).toBe(0); // State shouldn't change
    });
  });
});
