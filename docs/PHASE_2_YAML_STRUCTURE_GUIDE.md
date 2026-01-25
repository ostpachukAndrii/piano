# Phase 2: YAML Structure & Data Models Guide

## Overview
Phase 2 focuses on defining the lesson data structures and implementing YAML parsing for lessons. This guide documents the YAML format and the corresponding Rust data models.

## YAML Lesson Format

### Basic Structure
Each lesson is a YAML file with the following root-level fields:

```yaml
title: String            # Required: Lesson title
description: String      # Optional: Lesson description
settings:               # Required: Global lesson settings
  tempo: u32            # BPM (beats per minute)
  time_signature: String # e.g., "4/4", "3/4"
  key_signature: String  # e.g., "C major", "G major"
measures:              # Required: List of measures
  - notes: [...]        # Notes in this measure
```

### Notes in a Measure

A measure contains a list of notes/chords/rests. Each can be one of three types:

#### Single Note
```yaml
- midi: 60                 # MIDI note number (0-127)
  duration: 1.0            # Duration in beats
  hand: right              # Optional: "left" or "right" (defaults to "right")
  accidental: sharp        # Optional: "sharp", "flat", "natural"
```

#### Chord (Multiple Notes)
```yaml
- midi: [60, 64, 67]       # Array of MIDI numbers (C major chord)
  duration: 1.0            # Duration in beats
  hand: right              # Optional: "left" or "right"
  chord: C Major           # Optional: Chord name for display
```

#### Rest
```yaml
- rest: 1.0                # Duration in beats (rest is the key, not midi)
```

## Rust Data Models

### Measure Structure
```rust
pub struct Measure {
    pub number: u32,      // Measure number (starts at 1)
    pub notes: Vec<Note>, // All notes in this measure
}
```

### Note Enum (Using Serde `untagged`)
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Note {
    Single {
        midi: u8,
        duration_beats: f32,
        #[serde(default = "default_hand")]
        hand: String,
        #[serde(default)]
        accidental: Option<String>,
    },
    Chord {
        midi_set: Vec<u8>,
        duration_beats: f32,
        #[serde(default = "default_hand")]
        hand: String,
        #[serde(default)]
        chord_name: Option<String>,
    },
    Rest {
        duration_beats: f32,
    },
}
```

### GlobalSettings Structure
```rust
pub struct GlobalSettings {
    pub tempo: u32,            // BPM
    pub time_signature: String,
    pub key_signature: String,
}
```

### YamlLesson Structure (Parser)
```rust
pub struct YamlLesson {
    pub title: String,
    pub description: Option<String>,
    pub settings: GlobalSettings,
    pub measures: Vec<Measure>,
}

impl YamlLesson {
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self, String>;
    pub fn from_str(yaml_content: &str) -> Result<Self, String>;
    pub fn total_beats(&self) -> f32;
    pub fn total_seconds(&self) -> f32;
}
```

## YAML Examples

### Example 1: Simple Melody
```yaml
title: Happy Birthday
description: The classic birthday song
settings:
  tempo: 120
  time_signature: "3/4"
  key_signature: "C major"
measures:
  - notes:
      - midi: 60
        duration: 0.5
      - midi: 60
        duration: 0.5
  - notes:
      - midi: 62
        duration: 1.0
```

### Example 2: With Chords
```yaml
title: C Major Chord Study
settings:
  tempo: 100
  time_signature: "4/4"
  key_signature: "C major"
measures:
  - notes:
      - midi: [60, 64, 67]  # C Major chord
        duration: 2.0
        chord: C Major
      - rest: 2.0
  - notes:
      - midi: [62, 66, 71]  # D Minor chord
        duration: 2.0
        chord: D Minor
      - rest: 2.0
```

### Example 3: Two Hands
```yaml
title: Two Hand Piece
settings:
  tempo: 90
  time_signature: "4/4"
  key_signature: "C major"
measures:
  - notes:
      - midi: 60
        duration: 1.0
        hand: left
      - midi: 72
        duration: 1.0
        hand: right
      - midi: 64
        duration: 1.0
        hand: left
      - midi: 76
        duration: 1.0
        hand: right
```

## File Locations

### Rust Implementation Files
- **measure.rs**: Measure, Note, GlobalSettings structs
  - Location: `src-tauri/src/models/measure.rs`
  - Contains all data model definitions
  - Includes helper methods on Note enum

- **lesson_parser.rs**: YAML parsing logic
  - Location: `src-tauri/src/lesson_parser.rs`
  - YamlLesson struct with parsing methods
  - Tests for parsing various YAML formats

- **models/mod.rs**: Module exports
  - Location: `src-tauri/src/models/mod.rs`
  - Exports Measure, Note, GlobalSettings

### Lesson Files
- **lessons/**: Directory containing YAML lesson files
  - alphabet.yaml
  - example_features.yaml
  - happy_birthday.yaml
  - simple_chords.yaml
  - two_hand_chords.yaml

## Key Features

### Note Type Discrimination
The `Note` enum uses `#[serde(untagged)]` to automatically determine the note type during deserialization:
- If `rest` field is present → Rest variant
- If `midi` is an array → Chord variant
- If `midi` is a single number → Single variant

### Default Values
- `hand` defaults to "right" if not specified
- `accidental` and `chord_name` are optional

### Duration Methods
The Note enum provides these utility methods:
- `duration_beats()` → Returns duration for any note type
- `hand()` → Returns hand for note/chord types
- `is_rest()` → Checks if note is a rest
- `midi_notes()` → Gets MIDI note numbers (vec for chords)

## Validation Rules

1. **Required Fields**:
   - Each lesson must have: title, settings, measures
   - Settings must have: tempo, time_signature, key_signature
   - Each measure must have: notes (non-empty list)

2. **MIDI Values**:
   - Must be 0-127 (valid MIDI range)
   - 60 = Middle C

3. **Duration Values**:
   - Must be positive floats
   - Represent beats in the time signature

4. **Hand Values**:
   - Must be "left" or "right" (case-sensitive)

## Testing

Unit tests are included in both modules:

### measure.rs Tests
- `test_single_note_duration()`
- `test_chord_duration()`
- `test_rest()`

### lesson_parser.rs Tests
- `test_parse_simple_lesson()`
- `test_parse_chord()`
- `test_parse_rest()`
- `test_total_duration()`

## Common MIDI Note Numbers

```
C4:  60    (Middle C)
C#4: 61
D4:  62
D#4: 63
E4:  64
F4:  65
F#4: 66
G4:  67
G#4: 68
A4:  69
A#4: 70
B4:  71
C5:  72
```

## Next Steps (Phase 2)

1. **2.2 Migrate Existing Lessons**
   - Update all YAML files to new structure
   - Validate with parser

2. **2.3 Create Tauri Command**
   - Implement `load_lesson` command
   - Expose YamlLesson via Tauri IPC

3. **2.4 Frontend Integration**
   - Receive parsed lessons in Angular UI
   - Display lesson structure

## Migration Checklist

- [ ] Update alphabet.yaml to new format
- [ ] Update example_features.yaml
- [ ] Update happy_birthday.yaml
- [ ] Update simple_chords.yaml
- [ ] Update two_hand_chords.yaml
- [ ] Test each lesson file with parser
- [ ] Create load_lesson command in Tauri
- [ ] Test command from frontend
