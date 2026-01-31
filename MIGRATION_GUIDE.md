# Frontend Service Migration Guide

## Migrating Services to Use Backend Client Abstraction

This guide shows how to migrate existing Angular services from direct Tauri calls to the new BackendClient abstraction.

## Why Migrate?

The new abstraction provides:
- **Testability**: Mock backend for unit tests
- **Flexibility**: Easy to switch backends
- **Type Safety**: Strongly typed interfaces
- **Error Handling**: Standardized error types
- **Maintenance**: Single point of change for backend calls

## Migration Steps

### Step 1: Import BackendClient

**Before:**
```typescript
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

@Injectable({ providedIn: 'root' })
export class MidiService {
  async listDevices() {
    return await invoke<MidiDeviceInfo[]>('get_midi_devices');
  }
}
```

**After:**
```typescript
import { BackendClient, MidiDeviceInfo } from '@core/api';
import { inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MidiService {
  private backend = inject(BackendClient); // Use Angular DI

  async listDevices() {
    return this.backend.listMidiDevices();
  }
}
```

### Step 2: Replace Direct Tauri Calls

#### MIDI Commands

**Before:**
```typescript
// Direct Tauri calls
async startListening(deviceId: string) {
  await invoke('start_midi_listening', { device_id: deviceId });
}

async stopListening() {
  await invoke('stop_midi_listening');
}

async isConnected() {
  return await invoke<boolean>('is_midi_connected');
}
```

**After:**
```typescript
// Using BackendClient
async startListening(deviceId: string) {
  await this.backend.startMidiListening(deviceId);
}

async stopListening() {
  await this.backend.stopMidiListening();
}

async isConnected() {
  return this.backend.isMidiConnected();
}
```

#### Lesson Commands

**Before:**
```typescript
async loadLesson(lessonId: string) {
  return await invoke<Lesson>('load_lesson', { lesson_id: lessonId });
}

async listLessons() {
  return await invoke<LessonMetadata[]>('list_lessons');
}
```

**After:**
```typescript
async loadLesson(lessonId: string) {
  return this.backend.loadLesson(lessonId);
}

async listLessons() {
  return this.backend.listLessons();
}
```

### Step 3: Replace Event Listeners

**Before:**
```typescript
private setupListeners() {
  listen<MidiChord>('midi_chord_detected', (event) => {
    this.onChord(event.payload);
  });

  listen<number>('midi_note_off', (event) => {
    this.onNoteOff(event.payload);
  });
}
```

**After:**
```typescript
private cleanupFunctions: Array<() => void> = [];

private setupListeners() {
  // Store cleanup functions
  this.cleanupFunctions.push(
    this.backend.onMidiChordDetected((chord) => {
      this.onChord(chord);
    })
  );

  this.cleanupFunctions.push(
    this.backend.onMidiNoteOff((midi) => {
      this.onNoteOff(midi);
    })
  );
}

ngOnDestroy() {
  // Clean up listeners
  this.cleanupFunctions.forEach(cleanup => cleanup());
}
```

### Step 4: Add Error Handling

**Before:**
```typescript
async loadLesson(lessonId: string) {
  try {
    return await invoke('load_lesson', { lesson_id: lessonId });
  } catch (error) {
    console.error('Failed to load lesson:', error);
    throw error;
  }
}
```

**After:**
```typescript
import { BackendClientError } from '@core/api';

async loadLesson(lessonId: string) {
  try {
    return await this.backend.loadLesson(lessonId);
  } catch (error) {
    if (error instanceof BackendClientError) {
      console.error(`Backend error [${error.code}]:`, error.message);
      // Handle specific error codes
      if (error.code === 'LESSON_LOAD_FAILED') {
        // Show user-friendly message
      }
    }
    throw error;
  }
}
```

### Step 5: Write Tests

**Before (no tests possible):**
```typescript
// Can't test without Tauri runtime
```

**After (easy to test):**
```typescript
import { TestBed } from '@angular/core/testing';
import { MockBackendClient } from '@core/api';

describe('MidiService', () => {
  let service: MidiService;
  let mockBackend: MockBackendClient;

  beforeEach(() => {
    mockBackend = new MockBackendClient();

    TestBed.configureTestingModule({
      providers: [
        MidiService,
        { provide: BackendClient, useValue: mockBackend }
      ]
    });

    service = TestBed.inject(MidiService);
  });

  it('should list MIDI devices', async () => {
    const devices = await service.listDevices();
    expect(devices.length).toBeGreaterThan(0);
  });

  it('should handle chord events', () => {
    const chordSpy = jasmine.createSpy('chordHandler');
    service.onChordDetected(chordSpy);

    // Simulate chord in mock
    mockBackend.simulateChord([60, 64, 67], 'right');

    expect(chordSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({ notes: [60, 64, 67] })
    );
  });
});
```

## Angular Dependency Injection Setup

### Provide BackendClient

**app.config.ts:**
```typescript
import { ApplicationConfig } from '@angular/core';
import { BackendClient, createBackendClient } from '@core/api';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: BackendClient,
      useFactory: () => createBackendClient(),
    },
    // ... other providers
  ],
};
```

### For Testing

**test.config.ts:**
```typescript
import { TestBed } from '@angular/core/testing';
import { BackendClient, MockBackendClient } from '@core/api';

export function setupTestBackend() {
  TestBed.configureTestingModule({
    providers: [
      { provide: BackendClient, useClass: MockBackendClient }
    ]
  });
}
```

## Migration Checklist

For each service that uses Tauri:

- [ ] Import `BackendClient` from `@core/api`
- [ ] Inject `BackendClient` using Angular DI
- [ ] Replace all `invoke()` calls with backend client methods
- [ ] Replace all `listen()` calls with backend client event methods
- [ ] Store cleanup functions and call them in `ngOnDestroy()`
- [ ] Update error handling to use `BackendClientError`
- [ ] Write unit tests using `MockBackendClient`
- [ ] Remove direct Tauri imports

## Benefits After Migration

✅ **Unit Testable** - Mock backend for isolated tests
✅ **Type Safe** - Strong TypeScript types throughout
✅ **Maintainable** - Single source of truth for backend API
✅ **Flexible** - Easy to add new backend implementations
✅ **Documented** - Clear interface contracts
✅ **Error Handling** - Consistent error types and codes

## Example: Complete Migrated Service

```typescript
import { Injectable, OnDestroy, inject } from '@angular/core';
import {
  BackendClient,
  BackendClientError,
  MidiDeviceInfo,
  MidiChord,
} from '@core/api';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MidiService implements OnDestroy {
  private backend = inject(BackendClient);
  private cleanupFunctions: Array<() => void> = [];
  private chordDetected$ = new Subject<MidiChord>();

  constructor() {
    this.setupListeners();
  }

  async listDevices(): Promise<MidiDeviceInfo[]> {
    try {
      return await this.backend.listMidiDevices();
    } catch (error) {
      if (error instanceof BackendClientError) {
        console.error('Failed to list MIDI devices:', error.message);
      }
      throw error;
    }
  }

  async startListening(deviceId: string): Promise<void> {
    try {
      await this.backend.startMidiListening(deviceId);
    } catch (error) {
      if (error instanceof BackendClientError) {
        console.error('Failed to start MIDI listening:', error.message);
      }
      throw error;
    }
  }

  onChordDetected() {
    return this.chordDetected$.asObservable();
  }

  private setupListeners() {
    this.cleanupFunctions.push(
      this.backend.onMidiChordDetected((chord) => {
        this.chordDetected$.next(chord);
      })
    );
  }

  ngOnDestroy() {
    this.cleanupFunctions.forEach((cleanup) => cleanup());
    this.chordDetected$.complete();
  }
}
```

## Next Steps

1. Start with services that have no dependencies
2. Move to more complex services
3. Add tests as you go
4. Remove old Tauri imports when all services are migrated
