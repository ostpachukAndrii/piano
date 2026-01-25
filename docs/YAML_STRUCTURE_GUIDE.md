# YAML Lesson Structure Guide

**Date:** January 25, 2026  
**Status:** Phase 2 - YAML Structure & Data Models

## Current Format Analysis

### Metadata Structure
```yaml
name: String                    # Required: Human-readable lesson name
description: String             # Optional: What the lesson teaches
composer: String                # Optional: Who created the melody
difficulty: "beginner" | "intermediate" | "advanced"  # Optional
tempo: u32                      # BPM (beats per minute)
time_signature: String          # "4/4", "3/4", etc.
key_signature: String           # "C major", "G major", etc.
```

### Current Note Format Issues
- Uses `pitch` (MIDI number) directly
- Uses `duration` in beats (0.5 = eighth note, 1.0 = quarter, etc.)
- Some files use `chord` (string reference) instead of pitches
- Some files have `hand` (left/right) annotations
- Some files have `rest: true` for silence
- Inconsistent: pitches vs chord vs pitches array

### Existing Lesson Files

| File | Type | Notes | Hands |
|------|------|-------|-------|
| alphabet.yaml | Single notes | Simple ascending sequence | Right only |
| simple_chords.yaml | Mixed notes & chords | Chord progressions with names | Both |
| two_hand_chords.yaml | Left/right chords | Chord pairs in different octaves | Both |
| happy_birthday.yaml | Melody | Famous song melody | Right only |
| example_features.yaml | Features demo | Includes rests, mixed durations | Right only |

---

## New Standardized Format

### Design Goals
1. **Clarity:** Single representation for all note types
2. **Consistency:** All notes use same structure
3. **Flexibility:** Support single notes, chords, rests, accidentals
4. **Compatibility:** Easy to parse and render
5. **Extensibility:** Room for future features (dynamics, articulation)

### New Structure

```yaml
# Lesson metadata
id: alphabet                           # Required: Unique identifier (filename)
metadata:
  name: "Alphabet Song"                # Human-readable name
  description: "Learn the alphabet"    # What it teaches
  composer: "Unknown"                  # Optional composer
  difficulty: "beginner"               # beginner|intermediate|advanced
  
# Global settings for all measures
settings:
  tempo: 100                           # BPM
  time_signature: "4/4"               # Beats per measure
  key_signature: "C major"            # Starting key
  
# Musical content
measures:
  - number: 1                          # Measure number (for reference)
    notes:
      # Single note (right hand default)
      - midi: 60                       # C4 (MIDI number)
        duration_beats: 0.5            # Duration in quarter note beats
        hand: "right"                  # left|right (default: right)
        accidental: null               # null|sharp|flat|natural
        
      # Alternative: explicit chord
      - midi_set: [60, 64, 67]         # C major triad (C, E, G)
        duration_beats: 2.0
        hand: "right"
        chord_name: "C Major"          # Optional: for display
        
      # Rest / silence
      - rest: true
        duration_beats: 1.0

  - number: 2
    notes:
      - midi: 62                       # D4
        duration_beats: 1.0
        hand: "right"
```

### Rust Representation

```rust
// Lesson structure
pub struct Lesson {
    pub id: String,
    pub metadata: LessonMetadata,
    pub settings: GlobalSettings,
    pub measures: Vec<Measure>,
}

pub struct LessonMetadata {
    pub name: String,
    pub description: Option<String>,
    pub composer: Option<String>,
    pub difficulty: Difficulty,  // enum: Beginner|Intermediate|Advanced
}

pub struct GlobalSettings {
    pub tempo: u32,              // BPM
    pub time_signature: String,  // "4/4"
    pub key_signature: String,   // "C major"
}

pub struct Measure {
    pub number: u32,
    pub notes: Vec<Note>,
}

pub enum Note {
    Single {
        midi: u8,
        duration_beats: f32,
        hand: Hand,                // enum: Left|Right
        accidental: Option<Accidental>,  // enum: Sharp|Flat|Natural
    },
    Chord {
        midi_set: Vec<u8>,         // Multiple MIDI numbers
        duration_beats: f32,
        hand: Hand,
        chord_name: Option<String>,
    },
    Rest {
        duration_beats: f32,
    },
}
```

---

## Migration Plan

### Step 1: Standardize Existing Files

For each YAML file:

1. **alphabet.yaml:**
   - No chords, all single notes ✓
   - Add `id: "alphabet"`
   - Wrap metadata in `metadata:` section
   - Add `settings:` section
   - Rename `pitch` → `midi`
   - Add `duration_beats` (already correct)
   - Add `hand: "right"` to all notes

2. **simple_chords.yaml:**
   - Has mixed chords and notes
   - Replace chord strings with `midi_set` arrays
   - C Major = [60, 64, 67]
   - F Major = [65, 69, 72]
   - G Major = [67, 71, 74]
   - A Minor = [57, 60, 64]

3. **two_hand_chords.yaml:**
   - Already has hand annotations ✓
   - Merge `pitches` arrays into `midi_set`
   - Add `chord_name` field

4. **happy_birthday.yaml:**
   - Simple melody, no changes needed
   - Just reformat to new structure

5. **example_features.yaml:**
   - Already has rests ✓
   - Add Rest variant
   - Reformat to new structure

### Step 2: Implement Rust Models

Files to create:
- `src-tauri/src/models/lesson.rs` - Lesson struct
- `src-tauri/src/models/measure.rs` - Measure struct
- `src-tauri/src/models/note.rs` - Note enum

### Step 3: Create Parser

- `src-tauri/src/services/lesson_parser.rs`
- Parse YAML using serde_yaml
- Validate structure
- Return Lesson struct

### Step 4: Create Tauri Command

- `src-tauri/src/commands/lesson.rs`
- `load_lesson(lesson_id: String) -> Result<Lesson>`
- `list_lessons() -> Result<Vec<LessonMetadata>>`

---

## Duration Mapping Reference

Musical durations relative to quarter note = 1 beat:

| Duration | Beats | Name |
|----------|-------|------|
| 0.25 | Sixteenth note | 1/4 beat |
| 0.5 | Eighth note | 1/2 beat |
| 1.0 | Quarter note | 1 beat |
| 2.0 | Half note | 2 beats |
| 4.0 | Whole note | 4 beats |

In tempo, beats map to time:
- Tempo 100 BPM = 100 beats/minute = 600ms per beat
- 1.0 beats = 600ms at 100 BPM
- 0.5 beats = 300ms at 100 BPM

---

## MIDI Note Reference

Mapping to piano keys:

| MIDI | Note | Octave | Key |
|------|------|--------|-----|
| 48 | C | 3 | C3 |
| 60 | C | 4 | C4 (middle C) |
| 62 | D | 4 | D4 |
| 64 | E | 4 | E4 |
| 65 | F | 4 | F4 |
| 67 | G | 4 | G4 |
| 69 | A | 4 | A4 |
| 71 | B | 4 | B4 |
| 72 | C | 5 | C5 |

**Two-hand split:** MIDI 60 (C4) is typically the boundary
- Left hand: MIDI < 60
- Right hand: MIDI >= 60

---

## Validation Rules

When loading a YAML lesson, validate:

1. ✓ Required fields present: id, metadata.name, settings.tempo, measures
2. ✓ MIDI values in valid range: 0-127
3. ✓ Duration beats > 0
4. ✓ Measure numbers sequential
5. ✓ No duplicate measure numbers
6. ✓ At least one note/rest per measure
7. ✓ Time signature format valid ("4/4", "3/4", etc.)

---

## Implementation Timeline

| Task | Time | Status |
|------|------|--------|
| Design YAML format | ✅ Done | This document |
| Create Rust models | 1-2 hrs | Phase 2.1 |
| Migrate YAML files | 1-2 hrs | Phase 2.2 |
| Implement parser | 2-3 hrs | Phase 2.3 |
| Test with all lessons | 1 hr | Phase 2.4 |
| **Total Phase 2** | **5-8 hrs** | Estimated |

---

**Next:** Implement Rust models in src-tauri/src/models/

