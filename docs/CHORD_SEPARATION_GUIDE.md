# Chord Separation and Note Positioning Guide

**Date:** January 25, 2026  
**Purpose:** Define how chords (multiple notes at same time) should be positioned

---

## 1. Chord Types & Spacing Rules

### Type 1: Unison / Same Note
**Definition:** Same note played twice (e.g., two C4s)

**Horizontal Offset:** 
- **Primary note:** X position = base
- **Secondary note:** X position = base + 18 pixels (right side)

**Visual Effect:** Notes stacked directly on top of each other, but second note slightly offset right to avoid overlap

---

### Type 2: Perfect Interval (3+ semitones apart)
**Definition:** Notes are on separate lines/spaces with gaps (e.g., C4 and E4 = 4 semitones)

**Horizontal Offset:**
- **Primary note (lower):** X position = base
- **Secondary note (upper):** X position = base (same X, no offset needed)

**Visual Effect:** Notes stacked vertically at same X position

**Example:** C Major chord (C-E-G)
```
G ─────
  │
E ─────
  │
C ─────
```

All aligned vertically (same X), but different Y positions

---

### Type 3: Secundal Chord (2-3 semitones apart)
**Definition:** Notes on adjacent lines/spaces (e.g., C4 and D4 = 2 semitones)

**Horizontal Offset:**
- **Primary note:** X position = base
- **Secondary note:** X position = base + 12 pixels (offset RIGHT)

**Visual Effect:** Notes appear diagonal, touching at corner, not overlapping

**Example:** C and D together
```
D ──(offset right)
 ╱
C ──(base position)
```

Notes are offset to prevent notehead collision

---

### Type 4: Unison with Accidentals
**Definition:** Same pitch with different accidentals (e.g., C♯ and C♮)

**Horizontal Offset:**
- **Primary note:** X position = base
- **Secondary note:** X position = base + 20 pixels (more offset for accidental clarity)

**Visual Effect:** Accidentals don't collide; both visible to left of noteheads

---

## 2. Calculation Formula

### Base Calculation
```
Semitone_Distance = abs(MIDI_1 - MIDI_2)

if Semitone_Distance == 0:
    Offset = 18 pixels  (unison)
else if Semitone_Distance == 1:
    Offset = 12 pixels  (secundal, half step)
else if Semitone_Distance == 2:
    Offset = 12 pixels  (secundal, whole step)
else if Semitone_Distance >= 3:
    Offset = 0 pixels   (perfect interval, stack vertically)
```

### Visual Positioning Rules
```rust
fn calculate_chord_x_offset(midi_1: u8, midi_2: u8, note_order: usize) -> f32 {
    let semitone_distance = (midi_1 as i32 - midi_2 as i32).abs() as u8;
    
    if note_order == 0 {
        return 0.0; // Primary note at base X
    }
    
    match semitone_distance {
        0 => 18.0,              // Unison - stack right
        1 | 2 => 12.0,          // Secundal - offset right slightly
        3.. => 0.0,             // Perfect interval - stack vertically
    }
}
```

---

## 3. Stem Handling in Chords

### Rule 1: Single Stem Per Chord
When notes are in a chord, use ONE stem for the entire chord
- **Stem attaches to:** Rightmost notehead (if stem down) OR Leftmost notehead (if stem up)
- **Stem direction:** Determined by majority of notes or highest/lowest note

### Rule 2: Stem Attachment
```
Stem Down (high notes):
    ○──
      │  (stem attached to LEFT of notehead)
    ○  (lower note in chord)

Stem Up (low notes):
    ○──│  (upper note in chord)
      ● 
        │ (stem attached to RIGHT of notehead)
```

### Rule 3: Beam Connections (for eighth+ notes)
- Beams connect all notes in a chord
- Beams drawn perpendicular to stem direction
- No beams for chords with whole/half notes

---

## 4. Current Implementation Status

### Phase 3 (Current)
**Status:** Single notes only (no chords yet)

Current lesson: C4, D4, E4, F4, G4 (all separate notes, played sequentially)

Each note has:
- [x] Correct Y position (based on MIDI)
- [x] Correct fill (quarter=filled, half=hollow, whole=hollow)
- [x] Correct stem direction
- [x] Correct stem presence (whole note has no stem, others have stem)

### Phase 4+ (Planned)
Will need to implement:
- [ ] Chord detection (notes with same start time)
- [ ] X-offset calculation based on semitone distance
- [ ] Notehead collision detection
- [ ] Single stem per chord rendering

---

## 5. Test Cases for Chord Spacing

### Test Case VR-05: Chord Alignment
**Input:** C Major chord (C4, E4, G4 played simultaneously)

**Expected Output:**
```
G ─────────  (Y: 100, X: 600, no offset)
E ─────────  (Y: 120, X: 600, no offset)
C ─────────  (Y: 140, X: 600, no offset)
───────────
```
Notes stacked vertically (all same X=600)

**Why:** 4-5 semitone intervals → stack vertically

---

### Test Case VR-06: Secundal Chord
**Input:** C and D played simultaneously

**Expected Output:**
```
D ─────(X: 612)     (offset right by 12px)
 ╱
C ─────(X: 600)     (base position)
───────────
```

Notes offset diagonally, touching at corner, not overlapping

**Why:** 2 semitone interval (C to D) → offset 12 pixels right

---

### Test Case VR-07: Unison
**Input:** C4 and C4 (two voices on same note)

**Expected Output:**
```
C ──(X: 618)    (offset right by 18px for second voice)
C ──(X: 600)    (primary voice)
─────────
```

Both noteheads visible, second offset further right

**Why:** Same note (0 semitones) → offset 18 pixels right

---

## 6. Notehead Size Reference

All noteheads use:
- **Radius X:** 8 pixels
- **Radius Y:** 6 pixels
- **Width:** ~16 pixels total
- **Height:** ~12 pixels total

For collision detection:
- **Minimum safe X offset:** 12 pixels (secundal chords)
- **Recommended X offset:** 18 pixels (unison/same position)

---

## 7. Examples in Code

### Example 1: Calculate offset for C4 and D4 chord
```rust
let midi_c4 = 60;
let midi_d4 = 62;
let distance = (midi_c4 - midi_d4).abs(); // = 2 semitones

let offset = if distance == 0 { 18.0 } else { 12.0 };
// Result: 12.0 (they're 2 semitones apart, so offset 12 pixels)

// Positions:
let x_c4 = 600.0;           // base
let x_d4 = 600.0 + 12.0;   // offset right (612.0)
```

### Example 2: Calculate offset for C4 played twice (unison)
```rust
let midi_c4_voice1 = 60;
let midi_c4_voice2 = 60;
let distance = (midi_c4_voice1 - midi_c4_voice2).abs(); // = 0 semitones

let offset = if distance == 0 { 18.0 } else { 12.0 };
// Result: 18.0 (unison notes, offset 18 pixels)

// Positions:
let x_voice1 = 600.0;           // base
let x_voice2 = 600.0 + 18.0;   // offset right (618.0)
```

### Example 3: Calculate offset for C4 and E4 chord
```rust
let midi_c4 = 60;
let midi_e4 = 64;
let distance = (midi_c4 - midi_e4).abs(); // = 4 semitones

let offset = if distance < 3 { 12.0 } else { 0.0 };
// Result: 0.0 (perfect interval, stack vertically)

// Positions:
let x_c4 = 600.0;       // base
let x_e4 = 600.0 + 0.0; // no offset (600.0)
```

---

## 8. Visual Comparison

### Wrong Positioning (Overlapping)
```
D●
C●  ← Noteheads overlap, hard to read
─
```

### Correct Positioning (Secundal, offset)
```
D●
 ╲
  C●  ← Offset prevents overlap
──────
```

### Correct Positioning (Perfect Interval, stacked)
```
E●
 │
C●  ← Stacked vertically, clear
─────
```

---

## 9. Implementation Checklist

- [ ] **Phase 4:** Add chord detection (notes with same start_time)
- [ ] **Phase 4:** Calculate semitone distance for each chord
- [ ] **Phase 4:** Apply X-offset based on distance formula
- [ ] **Phase 4:** Test with C Major chord (C-E-G)
- [ ] **Phase 4:** Test with secundal chord (C-D)
- [ ] **Phase 4:** Test with unison (C-C)
- [ ] **Phase 5:** Add accidental collision detection
- [ ] **Phase 5:** Implement beam connections for chords

---

## 10. Related Files

- **Project Specification:** super_docs/Project_Specification.md (VR-05, VR-06)
- **Music Notation Guide:** super_docs/Music_Notation_Guide.md (chord sections)
- **MIDI to Position:** src-leptos/src/utils/midi_to_position.rs (positioning logic)
- **Future Chord Handler:** (to be created in Phase 4)

---

## Summary

**Key Formula:**
```
Semitone Distance | Offset  | Purpose
─────────────────────────────────────
0 (Unison)       | 18px    | Different voices, same note
1-2 (Secundal)   | 12px    | Adjacent lines/spaces
3+ (Perfect)     | 0px     | Stack vertically
```

This ensures:
✅ No notehead overlap  
✅ Visual clarity for all chord types  
✅ Musically correct representation  
✅ Professional appearance  

---

**Status:** Documentation ready for Phase 4 implementation
