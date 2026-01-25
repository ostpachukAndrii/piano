# Note Timing API Feature

## Overview
The API now provides **duration timing information** for all notes and chords, enabling clients to implement features like visual progress indicators, timing-based feedback, and educational purposes.

## Implementation Status

### ✅ Domain Layer (Complete)
The `NoteEvent` struct in [piano-domain/src/note.rs](../crates/piano-domain/src/note.rs) already supports timing:

```rust
pub enum NoteEvent {
    Single {
        note: Note,
        duration_ms: Option<u64>,  // ✅ Timing support
    },
    Chord {
        notes: Vec<Note>,
        name: Option<String>,
        hand: Option<Hand>,
        duration_ms: Option<u64>,  // ✅ Timing support
    },
}
```

### ✅ Helper Methods Available
The `NoteEvent` struct provides convenience constructors for timing:

```rust
// Create a single note with duration
NoteEvent::single_with_duration(60, 1000)  // 1 second

// Create a chord with duration
NoteEvent::chord_with_duration(
    vec![60, 64, 67],
    Some("C Major".to_string()),
    800  // 800ms
)

// Create a chord with hand and duration
NoteEvent::chord_with_hand_and_duration(
    vec![60, 64, 67],
    Some("C Major".to_string()),
    Hand::Both,
    800
)

// Get duration from any event
let duration = note_event.duration_ms();  // Returns Option<u64>
```

### ✅ API Documentation Updated
All API endpoints in [API_DESIGN.md](API_DESIGN.md) now document the `duration_ms` field:

1. **GET /lessons/{lesson_id}** - Returns all notes with timing
2. **GET /sessions/{session_id}** - Includes timing in current_expected_event
3. **POST /sessions/{session_id}/events** - Returns timing in expected_event
4. **WS /ws/sessions/{session_id}** - Progress updates include timing

### Data Model Examples

#### Single Note with Timing
```json
{
  "type": "single",
  "note": 60,
  "note_name": "C4",
  "duration_ms": 500
}
```

#### Chord with Timing
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

#### Notes Without Duration Requirement
```json
{
  "type": "single",
  "note": 60,
  "note_name": "C4",
  "duration_ms": null
}
```

## Usage in YAML Lessons

Timing can be specified in lesson YAML files and will be automatically loaded:

```yaml
events:
  - type: single
    midi_number: 60
    duration_ms: 500
  
  - type: chord
    midi_numbers: [60, 64, 67]
    chord_name: "C Major"
    hand: both
    duration_ms: 800
```

## Client Integration Points

### 1. Visual Feedback
Display expected duration to users so they know how long to hold notes:
- Progress bars showing note duration
- Countdown timers
- Highlight when duration requirement is met

### 2. Accuracy Metrics
Use timing information for more granular feedback:
- Was note held long enough?
- Was it held too long?
- Timing tolerance relative to difficulty settings

### 3. Educational Features
- Show users if they need to improve timing consistency
- Create exercises focused on rhythm and duration
- Generate reports on timing accuracy

### 4. Playback Control
- Respect duration timing when implementing automatic playback
- Create accompaniment tracks that follow expected timings
- Implement tempo-relative duration calculations

## Next Implementation Steps

When building the REST API server (recommended: Axum framework), ensure:

1. **Serialization** - NoteEvent already derives `Serialize`, just ensure serde is configured
2. **Response Formatting** - Map NoteEvent to API response models that include duration_ms
3. **YAML Loading** - piano-lessons crate should parse duration_ms from lesson files
4. **Validation** - Validate that provided timings are reasonable (0-30000ms range)
5. **Documentation** - Keep OpenAPI/Swagger specs in sync with timing information

## Related Files

- [crates/piano-domain/src/note.rs](../crates/piano-domain/src/note.rs) - Domain model
- [docs/API_DESIGN.md](API_DESIGN.md) - API specification (updated)
- [crates/piano-lessons/src/yaml_loader.rs](../crates/piano-lessons/src/yaml_loader.rs) - YAML parsing
- [crates/piano-lessons/src/lesson_config.rs](../crates/piano-lessons/src/lesson_config.rs) - Lesson structure

## Questions?

This feature is fully designed and the domain layer is ready. The next step is implementing the REST API server that will serialize this timing information in responses.
