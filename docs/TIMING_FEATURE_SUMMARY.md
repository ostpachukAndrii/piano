# API Timing Feature - Implementation Summary

## ✅ What Was Done

Modified the API to **provide timing (duration) information for all notes and chords**.

### Changes Made

#### 1. API Documentation Updated ([API_DESIGN.md](API_DESIGN.md))

Added `duration_ms` field to all note event responses:

**Endpoint 1.2: GET /lessons/{lesson_id}**
- Single notes now include `"duration_ms": null` or a specific duration value
- Chords now include `"duration_ms": 800` (or appropriate timing)

**Endpoint 4.2: GET /sessions/{session_id}**
- Current expected event now includes `"duration_ms": 800`

**Endpoint 4.3: POST /sessions/{session_id}/events**
- Expected event responses now include timing
- Both single notes and chords show duration

**WebSocket 7.1: WS /ws/sessions/{session_id}**
- Progress update messages include timing in `current_expected_event`

#### 2. Data Model Documentation Updated

Enhanced TypeScript interface definitions to document timing:

```typescript
interface SingleNote {
  type: "single"
  note: number
  note_name: string
  hand?: "left" | "right"
  midi_number: number
  duration_ms?: number      // ← NEW: Expected duration in milliseconds
}

interface ChordNote {
  type: "chord"
  notes: number[]
  note_names: string[]
  chord_name: string
  hand: "left" | "right" | "both"
  midi_numbers: number[]
  duration_ms?: number      // ← NEW: Expected duration in milliseconds
}
```

### ✅ Already Implemented in Domain Layer

The Rust domain model already had full support:

**File:** [crates/piano-domain/src/note.rs](../crates/piano-domain/src/note.rs)

```rust
pub enum NoteEvent {
    Single {
        note: Note,
        duration_ms: Option<u64>,  // ✅ Ready to use
    },
    Chord {
        notes: Vec<Note>,
        name: Option<String>,
        hand: Option<Hand>,
        duration_ms: Option<u64>,  // ✅ Ready to use
    },
}
```

**Available Constructors:**
- `NoteEvent::single_with_duration(midi_number, duration_ms)`
- `NoteEvent::chord_with_duration(notes, name, duration_ms)`
- `NoteEvent::chord_with_hand_and_duration(notes, name, hand, duration_ms)`
- `note_event.duration_ms()` - getter method

## 📋 How It Works

### Without Duration Requirement
```json
{
  "type": "single",
  "note": 60,
  "note_name": "C4",
  "duration_ms": null
}
```

### With Duration Requirement (e.g., whole note = 4 beats)
```json
{
  "type": "single",
  "note": 60,
  "note_name": "C4",
  "duration_ms": 2000
}
```

### Chord with Timing
```json
{
  "type": "chord",
  "notes": [60, 64, 67],
  "note_names": ["C4", "E4", "G4"],
  "chord_name": "C Major",
  "hand": "both",
  "duration_ms": 800
}
```

## 🚀 Next Steps for Implementation

When building the REST API server (recommend using Axum):

1. **Ensure Serialization Works**
   - NoteEvent already derives `Serialize`
   - Serde will automatically include `duration_ms` in JSON output

2. **Create API Response Models**
   - Map NoteEvent to API response types
   - Include duration_ms in all serialized responses

3. **Update YAML Lesson Loader**
   - Parse `duration_ms` from YAML lesson files
   - [crates/piano-lessons/src/yaml_loader.rs](../crates/piano-lessons/src/yaml_loader.rs)

4. **Add Validation**
   - Validate timing ranges (suggest 0-30000ms)
   - Handle None values appropriately

## 📁 Related Documentation

- **Comprehensive Feature Guide:** [docs/TIMING_API_FEATURE.md](TIMING_API_FEATURE.md)
- **API Specification:** [docs/API_DESIGN.md](API_DESIGN.md) (Updated)
- **Domain Model:** [crates/piano-domain/src/note.rs](../crates/piano-domain/src/note.rs)
- **YAML Lesson Format:** [crates/piano-lessons/src/lesson_config.rs](../crates/piano-lessons/src/lesson_config.rs)

## Summary

✅ **Domain layer:** Full timing support already implemented  
✅ **API specification:** Updated with duration_ms field  
✅ **Documentation:** Complete with examples  
⏳ **REST API server:** Ready for implementation when needed

The API is now fully designed to provide timing information for all notes and chords, enabling rich client-side features like visual progress indicators, timing validation, and educational metrics.
