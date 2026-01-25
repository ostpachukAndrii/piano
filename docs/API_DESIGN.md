# Tauri Commands API Reference - Piano Learning App

**Version:** 1.0  
**Date:** January 25, 2026  
**Framework:** Tauri v2 (Desktop App) + Leptos (Frontend WASM)  
**Communication:** Type-Safe IPC (not REST HTTP)

---

## 🎯 Architecture Note

This is **NOT a REST API**. Communication happens via **Tauri Commands** - type-safe Rust functions exposed to the frontend WASM layer. All data is serialized to/from JSON.

**Frontend (Leptos):**
```rust
invoke("load_lesson", json!({ "lesson_id": "alphabet" }))
    .await
```

**Backend (Tauri):**
```rust
#[tauri::command]
pub async fn load_lesson(lesson_id: String) -> Result<LessonDTO, String>
```

---

## 📋 Command Reference

### **LESSON MANAGEMENT**

---

#### `load_lesson`
**Purpose:** Load a lesson from YAML file and parse into data structure

**Frontend Call:**
```rust
invoke("load_lesson", {
  "lesson_id": "alphabet"
})
```

**Backend Signature:**
```rust
#[tauri::command]
pub async fn load_lesson(
    lesson_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<LessonDTO, String>
```

**Request Parameters:**
- `lesson_id` (string) - Lesson filename without .yaml (e.g., "alphabet", "happy_birthday")

**Response (Success):**
```json
{
  "id": "alphabet",
  "name": "Alphabet",
  "description": "Learn the alphabet with notes",
  "difficulty": "beginner",
  "notes": [
    {
      "midi": 60,
      "duration_ms": 500,
      "hand": "right",
      "accidental": null
    },
    {
      "midi": 62,
      "duration_ms": 500,
      "hand": "right",
      "accidental": null
    }
  ]
}
```

**Error Response:**
```json
{
  "error": "Lesson not found: alphabet.yaml"
}
```

**Backend Responsibilities:**
- ✅ Read YAML file from disk
- ✅ Parse YAML into Lesson struct
- ✅ Validate lesson format
- ✅ Return serializable DTO

**Frontend Responsibilities:**
- ✅ Display loaded lesson data
- ✅ Render staff with notes
- ✅ Update timeline

---

#### `list_lessons`
**Purpose:** Get list of all available lessons

**Frontend Call:**
```rust
invoke("list_lessons", {})
```

**Backend Signature:**
```rust
#[tauri::command]
pub async fn list_lessons(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<LessonMetadata>, String>
```

**Response (Success):**
```json
[
  {
    "id": "alphabet",
    "name": "Alphabet",
    "description": "Learn the alphabet with notes",
    "difficulty": "beginner",
    "note_count": 26
  },
  {
    "id": "happy_birthday",
    "name": "Happy Birthday",
    "description": "Classic song",
    "difficulty": "intermediate",
    "note_count": 25
  }
]
```

---

### **MIDI DEVICE MANAGEMENT**

---

#### `get_midi_devices`
**Purpose:** Get list of connected MIDI input devices

**Frontend Call:**
```rust
invoke("get_midi_devices", {})
```

**Backend Signature:**
```rust
#[tauri::command]
pub async fn get_midi_devices(
    state: tauri::State<'_, MidiService>,
) -> Result<Vec<MidiDevice>, String>
```

**Response (Success):**
```json
[
  {
    "id": 0,
    "name": "Roland FP-30X",
    "is_connected": true
  },
  {
    "id": 1,
    "name": "USB Keyboard",
    "is_connected": false
  }
]
```

**Backend Responsibilities:**
- ✅ Query system MIDI devices (midir)
- ✅ Check connection status
- ✅ Return serializable device list

---

#### `start_midi_listening`
**Purpose:** Connect to MIDI device and start listening for note events

**Frontend Call:**
```rust
invoke("start_midi_listening", {
  "device_id": 0
})
```

**Backend Signature:**
```rust
#[tauri::command]
pub async fn start_midi_listening(
    device_id: usize,
    state: tauri::State<'_, MidiService>,
) -> Result<(), String>
```

**Request Parameters:**
- `device_id` (number) - ID from get_midi_devices response

**Response:** Empty object on success

**Backend Responsibilities:**
- ✅ Connect to MIDI device
- ✅ Start listening thread
- ✅ Group notes into chords (50ms window)
- ✅ Emit `midi_chord_detected` events

---

#### `stop_midi_listening`
**Purpose:** Disconnect from MIDI device

**Frontend Call:**
```rust
invoke("stop_midi_listening", {})
```

**Backend Signature:**
```rust
#[tauri::command]
pub async fn stop_midi_listening(
    state: tauri::State<'_, MidiService>,
) -> Result<(), String>
```

---

### **EVALUATION & SCORING**

---

#### `check_note`
**Purpose:** Evaluate if played note matches expected note

**Frontend Call:**
```rust
invoke("check_note", {
  "played_midi": 60,
  "played_duration_ms": 500,
  "expected_midi": 60,
  "expected_duration_ms": 500,
  "lesson_id": "alphabet"
})
```

**Backend Signature:**
```rust
#[tauri::command]
pub async fn check_note(
    played_midi: u8,
    played_duration_ms: u64,
    expected_midi: u8,
    expected_duration_ms: u64,
    lesson_id: String,
    state: tauri::State<'_, EvaluationService>,
) -> Result<EvaluationResult, String>
```

**Response (Success):**
```json
{
  "is_correct": true,
  "pitch_correct": true,
  "timing_offset_ms": 10,
  "duration_status": "perfect",
  "feedback": "Perfect!",
  "score_delta": 100
}
```

**Response (Failure):**
```json
{
  "is_correct": false,
  "pitch_correct": false,
  "expected_midi": 60,
  "played_midi": 61,
  "feedback": "Wrong note. Expected C4, got C#4",
  "score_delta": 0
}
```

**Backend Responsibilities:**
- ✅ Compare pitch (MIDI numbers)
- ✅ Check timing accuracy
- ✅ Classify duration (short/perfect/long)
- ✅ Generate feedback text
- ✅ Calculate score

**Frontend Responsibilities:**
- ✅ Display feedback message
- ✅ Show visual indicator (green/red/yellow)
- ✅ Update streak counter
- ✅ Advance to next note

---

### **PLAYBACK CONTROL**

---

#### `seek_to_note`
**Purpose:** Move playhead to specific note in lesson

**Frontend Call:**
```rust
invoke("seek_to_note", {
  "lesson_id": "alphabet",
  "note_index": 5
})
```

**Backend Signature:**
```rust
#[tauri::command]
pub async fn seek_to_note(
    lesson_id: String,
    note_index: usize,
    state: tauri::State<'_, PlaybackService>,
) -> Result<PlaybackState, String>
```

**Response:**
```json
{
  "time_ms": 2500,
  "current_note_index": 5,
  "current_midi": 64,
  "next_midi": 65,
  "total_notes": 26,
  "progress_percent": 19
}
```

**Backend Responsibilities:**
- ✅ Validate note index
- ✅ Calculate playback time
- ✅ Return timing information

---

#### `get_playback_state`
**Purpose:** Get current playback position (used to move playhead cursor)

**Frontend Call:**
```rust
invoke("get_playback_state", {
  "lesson_id": "alphabet"
})
```

**Backend Signature:**
```rust
#[tauri::command]
pub async fn get_playback_state(
    lesson_id: String,
    state: tauri::State<'_, PlaybackService>,
) -> Result<PlaybackState, String>
```

**Response:**
```json
{
  "time_ms": 1250,
  "current_note_index": 2,
  "current_midi": 62,
  "next_midi": 64,
  "total_notes": 26,
  "progress_percent": 8
}
```

---

### **STATISTICS & PERSISTENCE**

---

#### `record_session_result`
**Purpose:** Save lesson session results to database

**Frontend Call:**
```rust
invoke("record_session_result", {
  "lesson_id": "alphabet",
  "accuracy_percent": 95,
  "completion_percent": 100,
  "duration_ms": 120000,
  "notes_played": 26,
  "notes_correct": 25,
  "timestamp": 1705123456789
})
```

**Backend Signature:**
```rust
#[tauri::command]
pub async fn record_session_result(
    lesson_id: String,
    accuracy_percent: f32,
    completion_percent: f32,
    duration_ms: u64,
    notes_played: u32,
    notes_correct: u32,
    timestamp: u64,
    state: tauri::State<'_, StatisticsService>,
) -> Result<SessionRecord, String>
```

**Response:**
```json
{
  "session_id": "abc123",
  "lesson_id": "alphabet",
  "accuracy_percent": 95,
  "completion_percent": 100,
  "saved_at": "2026-01-25T10:30:45Z"
}
```

**Backend Responsibilities:**
- ✅ Validate data
- ✅ Store in SQLite database
- ✅ Calculate statistics
- ✅ Track progress history

---

#### `get_session_history`
**Purpose:** Get past session results for a lesson

**Frontend Call:**
```rust
invoke("get_session_history", {
  "lesson_id": "alphabet",
  "limit": 10
})
```

**Backend Signature:**
```rust
#[tauri::command]
pub async fn get_session_history(
    lesson_id: String,
    limit: usize,
    state: tauri::State<'_, StatisticsService>,
) -> Result<Vec<SessionRecord>, String>
```

**Response:**
```json
[
  {
    "session_id": "abc123",
    "lesson_id": "alphabet",
    "accuracy_percent": 95,
    "completion_percent": 100,
    "date": "2026-01-25",
    "duration_ms": 120000
  },
  {
    "session_id": "abc122",
    "lesson_id": "alphabet",
    "accuracy_percent": 88,
    "completion_percent": 100,
    "date": "2026-01-24",
    "duration_ms": 145000
  }
]
```

---

## 📡 Event Emissions (Backend → Frontend)

Backend emits these events. Frontend subscribes with `listen_to_event()`:

---

### `note_evaluated`
**When:** After user plays a note and it's evaluated

**Payload:**
```json
{
  "is_correct": true,
  "feedback": "Perfect!",
  "score_delta": 100,
  "accuracy_percent": 95,
  "streak": 5,
  "next_midi": 62
}
```

**Frontend Usage:**
```rust
use_effect(move || {
    listen_to_event("note_evaluated", |data: EvaluationResult| {
        feedback_message.set(data.feedback);
        accuracy.set(data.accuracy_percent);
        streak.set(data.streak);
    });
});
```

---

### `playhead_moved`
**When:** Playhead advances to next note (backend timer, not user action)

**Payload:**
```json
{
  "time_ms": 1250,
  "x_position": 145.5,
  "current_note_index": 2,
  "total_notes": 26
}
```

**Frontend Usage:**
```rust
let playhead_x = create_rw_signal(0.0);

use_effect(move || {
    listen_to_event("playhead_moved", move |data: PlayheadMoved| {
        playhead_x.set(data.x_position);
    });
});
```

---

### `midi_chord_detected`
**When:** User presses note(s) on MIDI keyboard

**Payload:**
```json
{
  "midi_numbers": [60, 64, 67],
  "note_names": ["C4", "E4", "G4"],
  "timestamp_ms": 1705123456789,
  "hand": "right"
}
```

**Frontend Usage:**
```rust
let active_notes = create_rw_signal(vec![]);

use_effect(move || {
    listen_to_event("midi_chord_detected", move |data: MidiChord| {
        active_notes.set(data.midi_numbers);
        // Highlight these notes on keyboard
    });
});
```

---

### `midi_device_connected`
**When:** MIDI device is plugged in

**Payload:**
```json
{
  "device_id": 0,
  "device_name": "Roland FP-30X"
}
```

---

### `midi_device_disconnected`
**When:** MIDI device is unplugged

**Payload:**
```json
{
  "device_id": 0,
  "device_name": "Roland FP-30X"
}
```

---

## 🔄 Example Data Flow: User Plays a Note

```
1. User presses C4 (MIDI 60) on keyboard for 500ms
   ↓
2. [BACKEND] MIDI listener receives event
   └─ emit: midi_chord_detected {midi: [60], hand: "right"}
   ↓
3. [FRONTEND] Receives midi_chord_detected
   └─ Highlight C4 on virtual keyboard
   ↓
4. [FRONTEND] User releases key, calls:
   └─ invoke("check_note", {played_midi: 60, played_duration_ms: 500, ...})
   ↓
5. [BACKEND] Evaluates note
   ├─ Pitch check: 60 == 60 ✓
   ├─ Duration: 500ms is close to 500ms ✓
   ├─ Calculate score: +100
   └─ emit: note_evaluated {is_correct: true, feedback: "Perfect!"}
   ↓
6. [FRONTEND] Receives note_evaluated
   ├─ Show green feedback badge
   ├─ Update streak counter
   └─ Advance to next note
```

---

## 🚫 Error Handling

All commands return `Result<T, String>`:

**Success:**
```json
{
  "status": "ok",
  "data": { /* response */ }
}
```

**Error:**
```json
{
  "status": "error",
  "error": "MIDI device not found"
}
```

**Frontend:**
```rust
match invoke("load_lesson", args).await {
    Ok(lesson) => { /* handle success */ },
    Err(e) => { /* handle error: e.to_string() */ }
}
```

---

## 📋 Command Summary Table

| Command | Purpose | Caller | Sync/Async |
|---------|---------|--------|-----------|
| `load_lesson` | Load lesson YAML | Frontend | Async |
| `list_lessons` | Get available lessons | Frontend | Async |
| `get_midi_devices` | List MIDI keyboards | Frontend | Async |
| `start_midi_listening` | Connect MIDI | Frontend | Async |
| `stop_midi_listening` | Disconnect MIDI | Frontend | Async |
| `check_note` | Evaluate played note | Frontend | Async |
| `seek_to_note` | Move playhead | Frontend | Async |
| `get_playback_state` | Get current position | Frontend | Async |
| `record_session_result` | Save results | Frontend | Async |
| `get_session_history` | Get past results | Frontend | Async |

---

## 🔑 Key Design Decisions

1. **Type-Safe:** All parameters and returns are Rust structs (serialized to JSON)
2. **Async:** All commands are async (runs on Tauri command thread)
3. **Error Handling:** Result<T, String> for clear error propagation
4. **Events:** Backend emits events, frontend listens with subscriptions
5. **No Polling:** Frontend doesn't ask for state repeatedly, backend pushes updates
6. **No HTTP:** Direct IPC, lower latency, no serialization overhead

---

**Version:** 1.0  
**Last Updated:** January 25, 2026  
**Next:** See TAURI_EVENTS_REFERENCE.md for complete event list

**Response:**
```json
{
  "lessons": [
    {
      "id": "alphabet",
      "name": "Alphabet Song",
      "description": "Learn the alphabet with simple notes",
      "difficulty": "beginner",
      "composer": null,
      "total_notes": 26,
      "has_chords": false,
      "tempo": 120,
      "time_signature": "4/4",
      "key_signature": "C major"
    },
    {
      "id": "two_hand_chords",
      "name": "Two Hand Chord Practice",
      "description": "Practice chords with both hands",
      "difficulty": "intermediate",
      "composer": null,
      "total_notes": 8,
      "has_chords": true,
      "tempo": null,
      "time_signature": null,
      "key_signature": null
    }
  ]
}
```

---

### 1.2 Get Lesson Details
**Endpoint:** `GET /lessons/{lesson_id}`

**Description:** Get full details of a specific lesson including all notes/chords with timing information

**Path Parameters:**
- `lesson_id` (string) - Lesson identifier (e.g., "alphabet", "two_hand_chords")

**Query Parameters:**
- `note_format` (optional, string) - "western" (C, D, E) or "solfege" (Do, Re, Mi). Default: "western"

**Response:**
```json
{
  "id": "two_hand_chords",
  "name": "Two Hand Chord Practice",
  "description": "Practice chords with both hands",
  "difficulty": "intermediate",
  "composer": null,
  "tempo": null,
  "time_signature": null,
  "key_signature": null,
  "total_events": 8,
  "note_events": [
    {
      "type": "chord",
      "notes": [60, 64, 67],
      "note_names": ["C4", "E4", "G4"],
      "chord_name": "C Major",
      "hand": "both",
      "duration_ms": 800,
      "midi_numbers": [60, 64, 67],
      "duration_ms": 1000
    },
    {
      "type": "chord",
      "notes": [65, 69, 72],
      "note_names": ["F4", "A4", "C5"],
      "chord_name": "F Major",
      "hand": "both",
      "midi_numbers": [65, 69, 72],
      "duration_ms": 1000
    },
    {
      "type": "single",
      "note": 60,
      "note_name": "C4",
      "hand": null,
      "midi_number": 60,
      "duration_ms": null
    }
  ],
  "measures": [
    {
      "number": 1,
      "event_count": 4
    }
  ]
}
```

**Error Responses:**
- `404 Not Found` - Lesson not found

---

### 1.3 Create Custom Lesson
**Endpoint:** `POST /lessons`

**Description:** Create a new custom lesson

**Request Body:**
```json
{
  "name": "My Custom Lesson",
  "description": "Practice specific chords",
  "difficulty": "intermediate",
  "composer": "John Doe",
  "tempo": 90,
  "time_signature": "4/4",
  "key_signature": "C major",
  "note_events": [
    {
      "type": "chord",
      "midi_numbers": [60, 64, 67],
      "chord_name": "C Major",
      "hand": "both"
    },
    {
      "type": "single",
      "midi_number": 72
    }
  ]
}
```

**Response:**
```json
{
  "id": "my-custom-lesson",
  "name": "My Custom Lesson",
  "message": "Lesson created successfully"
}
```

---

### 1.4 Update Lesson
**Endpoint:** `PUT /lessons/{lesson_id}`

**Description:** Update an existing lesson

**Request Body:** Same as Create Custom Lesson

---

### 1.5 Delete Lesson
**Endpoint:** `DELETE /lessons/{lesson_id}`

**Description:** Delete a custom lesson

**Response:**
```json
{
  "message": "Lesson deleted successfully"
}
```

---

## 2. MIDI Devices API

### 2.1 List Available MIDI Devices
**Endpoint:** `GET /devices`

**Description:** List all connected USB MIDI devices

**Response:**
```json
{
  "devices": [
    {
      "id": 0,
      "name": "Roland FP-E50",
      "connected": false
    },
    {
      "id": 1,
      "name": "USB MIDI Keyboard",
      "connected": true
    }
  ]
}
```

---

### 2.2 Get Device Details
**Endpoint:** `GET /devices/{device_id}`

**Description:** Get details of a specific MIDI device

**Response:**
```json
{
  "id": 1,
  "name": "USB MIDI Keyboard",
  "connected": true,
  "port": 1,
  "manufacturer": "Generic",
  "capabilities": {
    "note_on": true,
    "note_off": true,
    "pitch_bend": true,
    "control_change": true
  }
}
```

---

### 2.3 Connect to MIDI Device
**Endpoint:** `POST /devices/{device_id}/connect`

**Description:** Connect to a MIDI device for lesson playback

**Response:**
```json
{
  "device_id": 1,
  "name": "USB MIDI Keyboard",
  "connected": true,
  "message": "Connected successfully"
}
```

---

### 2.4 Disconnect from MIDI Device
**Endpoint:** `POST /devices/{device_id}/disconnect`

**Description:** Disconnect from a MIDI device

**Response:**
```json
{
  "device_id": 1,
  "connected": false,
  "message": "Disconnected successfully"
}
```

---

## 3. Settings API

### 3.1 Get User Settings
**Endpoint:** `GET /settings`

**Description:** Retrieve current user settings

**Response:**
```json
{
  "difficulty": "medium",
  "chord_tolerance_ms": 150,
  "incorrect_note_behavior": "wait",
  "note_naming_system": "western",
  "default_device_id": 1,
  "auto_advance": false,
  "show_hand_notation": true
}
```

---

### 3.2 Update Settings
**Endpoint:** `PUT /settings`

**Description:** Update user settings

**Request Body:**
```json
{
  "difficulty": "hard",
  "incorrect_note_behavior": "skip",
  "note_naming_system": "solfege"
}
```

**Response:**
```json
{
  "message": "Settings updated successfully",
  "settings": {
    "difficulty": "hard",
    "chord_tolerance_ms": 50,
    "incorrect_note_behavior": "skip",
    "note_naming_system": "solfege",
    "default_device_id": 1,
    "auto_advance": false,
    "show_hand_notation": true
  }
}
```

---

### 3.3 Reset Settings to Default
**Endpoint:** `POST /settings/reset`

**Description:** Reset all settings to default values

**Response:**
```json
{
  "message": "Settings reset to defaults",
  "settings": {
    "difficulty": "medium",
    "chord_tolerance_ms": 150,
    "incorrect_note_behavior": "wait",
    "note_naming_system": "western",
    "default_device_id": null,
    "auto_advance": false,
    "show_hand_notation": true
  }
}
```

---

## 4. Lesson Session API

### 4.1 Start Lesson Session
**Endpoint:** `POST /sessions`

**Description:** Start a new lesson session

**Request Body:**
```json
{
  "lesson_id": "two_hand_chords",
  "device_id": 1,
  "note_naming_system": "western"
}
```

**Response:**
```json
{
  "session_id": "sess_abc123",
  "lesson_id": "two_hand_chords",
  "lesson_name": "Two Hand Chord Practice",
  "device_id": 1,
  "device_name": "USB MIDI Keyboard",
  "total_events": 8,
  "current_index": 0,
  "status": "active",
  "started_at": "2026-01-24T10:30:00Z"
}
```

---

### 4.2 Get Session Status
**Endpoint:** `GET /sessions/{session_id}`

**Description:** Get current status of a lesson session

**Response:**
```json
{
  "session_id": "sess_abc123",
  "lesson_id": "two_hand_chords",
  "lesson_name": "Two Hand Chord Practice",
  "device_id": 1,
  "total_events": 8,
  "current_index": 3,
  "progress_percent": 37,
  "status": "active",
  "current_expected_event": {
    "type": "chord",
    "notes": [65, 69, 72],
    "note_names": ["F4", "A4", "C5"],
    "chord_name": "F Major",
    "hand": "both",
    "duration_ms": 800
  },
  "statistics": {
    "correct_notes": 3,
    "incorrect_notes": 1,
    "accuracy_percent": 75,
    "elapsed_time_seconds": 45
  }
}
```

---

### 4.3 Submit MIDI Event
**Endpoint:** `POST /sessions/{session_id}/events`

**Description:** Submit a MIDI event (note press/release) for validation

**Request Body:**
```json
{
  "event_type": "note_on",
  "midi_number": 60,
  "velocity": 80,
  "timestamp": "2026-01-24T10:30:05Z"
}
```

**Response:**
```json
{
  "is_correct": true,
  "expected_event": {
    "type": "single",
    "note": 60,
    "note_name": "C4",
    "duration_ms": null
  },
  "played_notes": [60],
  "progress_percent": 12,
  "current_index": 1,
  "feedback_message": "Correct! Well done.",
  "should_advance": true,
  "chord_timing_ms": null
}
```

**For Chord Response:**
```json
{
  "is_correct": false,
  "expected_event": {
    "type": "chord",
    "notes": [60, 64, 67],
    "note_names": ["C4", "E4", "G4"],
    "chord_name": "C Major",
    "duration_ms": 800
  },
  "played_notes": [60, 64],
  "progress_percent": 25,
  "current_index": 2,
  "feedback_message": "Missing notes: G4",
  "should_advance": false,
  "chord_timing_ms": 120,
  "missing_notes": [67],
  "extra_notes": []
}
```

---

### 4.4 Reset Session Progress
**Endpoint:** `POST /sessions/{session_id}/reset`

**Description:** Reset session to beginning

**Response:**
```json
{
  "session_id": "sess_abc123",
  "current_index": 0,
  "progress_percent": 0,
  "message": "Session reset to beginning"
}
```

---

### 4.5 End Session
**Endpoint:** `DELETE /sessions/{session_id}`

**Description:** End a lesson session

**Response:**
```json
{
  "session_id": "sess_abc123",
  "status": "completed",
  "final_statistics": {
    "total_events": 8,
    "correct_notes": 7,
    "incorrect_notes": 3,
    "accuracy_percent": 70,
    "total_time_seconds": 180,
    "completion_percent": 100
  },
  "message": "Session ended"
}
```

---

### 4.6 List Active Sessions
**Endpoint:** `GET /sessions`

**Description:** Get all active lesson sessions

**Response:**
```json
{
  "sessions": [
    {
      "session_id": "sess_abc123",
      "lesson_id": "two_hand_chords",
      "lesson_name": "Two Hand Chord Practice",
      "progress_percent": 37,
      "status": "active",
      "started_at": "2026-01-24T10:30:00Z"
    }
  ]
}
```

---

## 5. Chord Library API

### 5.1 List All Standard Chords
**Endpoint:** `GET /chords`

**Description:** Get all pre-defined chords in the library

**Query Parameters:**
- `type` (optional) - Filter by type: "major", "minor", "seventh", "diminished"
- `note_format` (optional) - "western" or "solfege"

**Response:**
```json
{
  "chords": [
    {
      "name": "C Major",
      "root_note": "C",
      "type": "major",
      "midi_numbers": [60, 64, 67],
      "note_names": ["C4", "E4", "G4"],
      "interval_structure": [0, 4, 7]
    },
    {
      "name": "F Minor",
      "root_note": "F",
      "type": "minor",
      "midi_numbers": [65, 68, 72],
      "note_names": ["F4", "G#4", "C5"],
      "interval_structure": [0, 3, 7]
    }
  ],
  "total": 20
}
```

---

### 5.2 Get Specific Chord
**Endpoint:** `GET /chords/{chord_name}`

**Description:** Get details of a specific chord

**Path Parameters:**
- `chord_name` (string) - URL-encoded chord name (e.g., "C%20Major")

**Response:**
```json
{
  "name": "C Major",
  "root_note": "C",
  "type": "major",
  "midi_numbers": [60, 64, 67],
  "note_names": ["C4", "E4", "G4"],
  "interval_structure": [0, 4, 7],
  "inversions": [
    {
      "name": "Root position",
      "midi_numbers": [60, 64, 67]
    },
    {
      "name": "First inversion",
      "midi_numbers": [64, 67, 72]
    },
    {
      "name": "Second inversion",
      "midi_numbers": [67, 72, 76]
    }
  ]
}
```

---

### 5.3 Identify Chord from Notes
**Endpoint:** `POST /chords/identify`

**Description:** Identify what chord matches the given MIDI notes

**Request Body:**
```json
{
  "midi_numbers": [60, 64, 67]
}
```

**Response:**
```json
{
  "matches": [
    {
      "name": "C Major",
      "confidence": 100,
      "type": "major",
      "root_note": "C",
      "inversion": "root"
    }
  ],
  "note_names": ["C4", "E4", "G4"]
}
```

---

## 6. Progress & Statistics API

### 6.1 Get User Progress Summary
**Endpoint:** `GET /progress`

**Description:** Get overall user progress across all lessons

**Response:**
```json
{
  "total_lessons": 5,
  "completed_lessons": 2,
  "in_progress_lessons": 1,
  "total_practice_time_seconds": 3600,
  "overall_accuracy_percent": 82,
  "lessons": [
    {
      "lesson_id": "alphabet",
      "lesson_name": "Alphabet Song",
      "status": "completed",
      "best_accuracy": 95,
      "attempts": 3,
      "last_played": "2026-01-20T15:30:00Z"
    },
    {
      "lesson_id": "two_hand_chords",
      "lesson_name": "Two Hand Chord Practice",
      "status": "in_progress",
      "best_accuracy": 70,
      "attempts": 5,
      "last_played": "2026-01-24T10:30:00Z"
    }
  ]
}
```

---

### 6.2 Get Lesson-Specific Progress
**Endpoint:** `GET /progress/lessons/{lesson_id}`

**Description:** Get detailed progress for a specific lesson

**Response:**
```json
{
  "lesson_id": "two_hand_chords",
  "lesson_name": "Two Hand Chord Practice",
  "total_attempts": 5,
  "completed_attempts": 2,
  "best_accuracy": 95,
  "average_accuracy": 75,
  "total_time_seconds": 900,
  "attempts_history": [
    {
      "attempt_number": 1,
      "date": "2026-01-20T10:00:00Z",
      "accuracy": 60,
      "time_seconds": 200,
      "completed": false
    },
    {
      "attempt_number": 2,
      "date": "2026-01-21T14:00:00Z",
      "accuracy": 95,
      "time_seconds": 150,
      "completed": true
    }
  ],
  "difficult_sections": [
    {
      "event_index": 3,
      "event_description": "F Major chord",
      "error_count": 8,
      "average_attempts": 3
    }
  ]
}
```

---

## 7. Real-time WebSocket API

### 7.1 WebSocket Connection
**Endpoint:** `WS /ws/sessions/{session_id}`

**Description:** Real-time bidirectional communication for lesson playback

#### Client → Server Messages

**1. MIDI Event**
```json
{
  "type": "midi_event",
  "event": {
    "event_type": "note_on",
    "midi_number": 60,
    "velocity": 80,
    "timestamp": "2026-01-24T10:30:05Z"
  }
}
```

**2. Request Progress**
```json
{
  "type": "get_progress"
}
```

**3. Pause Session**
```json
{
  "type": "pause"
}
```

**4. Resume Session**
```json
{
  "type": "resume"
}
```

#### Server → Client Messages

**1. Progress Update**
```json
{
  "type": "progress_update",
  "current_index": 3,
  "total_events": 8,
  "progress_percent": 37,
  "current_expected_event": {
    "type": "chord",
    "notes": [60, 64, 67],
    "note_names": ["C4", "E4", "G4"],
    "chord_name": "C Major",
    "duration_ms": 800
  }
}
```

**2. Feedback**
```json
{
  "type": "feedback",
  "is_correct": true,
  "message": "Excellent! Perfect timing.",
  "should_advance": true,
  "played_notes": [60, 64, 67],
  "chord_timing_ms": 95
}
```

**3. Session Complete**
```json
{
  "type": "session_complete",
  "statistics": {
    "total_events": 8,
    "correct_notes": 7,
    "accuracy_percent": 87,
    "total_time_seconds": 120
  }
}
```

**4. Error**
```json
{
  "type": "error",
  "message": "MIDI device disconnected",
  "error_code": "DEVICE_DISCONNECTED"
}
```

---

## 8. Health & System API

### 8.1 Health Check
**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 3600
}
```

---

### 8.2 System Information
**Endpoint:** `GET /system/info`

**Response:**
```json
{
  "version": "1.0.0",
  "rust_version": "1.75.0",
  "available_lessons": 5,
  "connected_devices": 1,
  "active_sessions": 2,
  "supported_note_formats": ["western", "solfege"],
  "supported_difficulties": ["easy", "medium", "hard"]
}
```

---

## Data Models Reference

### Note Event Types
```typescript
type NoteEvent = SingleNote | ChordNote

interface SingleNote {
  type: "single"
  note: number              // MIDI number (0-127)
  note_name: string         // "C4", "D#5", etc.
  hand?: "left" | "right"
  midi_number: number
  duration_ms?: number      // Expected duration in milliseconds (null = no duration requirement)
}

interface ChordNote {
  type: "chord"
  notes: number[]           // Array of MIDI numbers
  note_names: string[]      // Array of note names
  chord_name: string        // "C Major", "F Minor", etc.
  hand: "left" | "right" | "both"
  midi_numbers: number[]
  duration_ms?: number      // Expected duration in milliseconds (null = no duration requirement)
}
```

### Difficulty Levels
- `easy`: 300ms chord tolerance
- `medium`: 150ms chord tolerance
- `hard`: 50ms chord tolerance

### Incorrect Note Behavior
- `wait`: Wait for correct note before advancing
- `skip`: Allow user to skip after incorrect attempt

### Note Naming Systems
- `western`: C, C#, D, D#, E, F, F#, G, G#, A, A#, B
- `solfege`: Do, Do#, Re, Re#, Mi, Fa, Fa#, Sol, Sol#, La, La#, Ti

---

## Authentication (Future Enhancement)
Currently not implemented. All endpoints are public.

**Recommended for production:**
- JWT-based authentication
- User accounts with saved progress
- Rate limiting per user
- API key for client applications

---

## Rate Limiting
**Recommended limits:**
- `GET` endpoints: 100 requests/minute
- `POST/PUT/DELETE` endpoints: 30 requests/minute
- WebSocket connections: 5 concurrent per IP

---

## Error Response Format
All errors follow this structure:

```json
{
  "error": {
    "code": "LESSON_NOT_FOUND",
    "message": "Lesson 'invalid-lesson' not found",
    "details": {
      "lesson_id": "invalid-lesson",
      "available_lessons": ["alphabet", "happy_birthday"]
    }
  }
}
```

### Common Error Codes
- `LESSON_NOT_FOUND` (404)
- `DEVICE_NOT_FOUND` (404)
- `SESSION_NOT_FOUND` (404)
- `DEVICE_ALREADY_CONNECTED` (409)
- `INVALID_MIDI_EVENT` (400)
- `VALIDATION_ERROR` (422)
- `INTERNAL_SERVER_ERROR` (500)

---

## Technology Stack Recommendations

### Backend Framework Options
1. **Axum** (Recommended) - Modern, fast, type-safe
2. **Actix-web** - High performance, mature
3. **Rocket** - Developer-friendly, good documentation

### Additional Libraries
- `tokio` - Async runtime
- `tower` - Middleware
- `tower-http` - CORS, tracing
- `serde_json` - JSON serialization
- `sqlx` or `diesel` - Database (for progress tracking)
- `redis` - Session management
- `tokio-tungstenite` - WebSocket support

---

## Next Steps for Implementation

1. **Create new crate:** `piano-api` (web server)
2. **Choose framework:** Axum recommended
3. **Implement REST endpoints** (phases 1-6)
4. **Add WebSocket support** (phase 7)
5. **Add persistence layer** (SQLite or PostgreSQL for progress)
6. **Add authentication** (JWT)
7. **Create API documentation** (OpenAPI/Swagger)
8. **Build example UI client** (React/Vue/Svelte)

Would you like me to implement this API? I can start with the REST endpoints using Axum.
