# Chord Support in Piano Lessons

**Status:** ✅ **Chord Lesson Format Available**  
**Date:** January 24, 2026

---

## Overview

The YAML lesson system now supports chord notation in the data structure. Here's how to work with chords effectively.

---

## Current Implementation

### Chord Format (Available Now)
```yaml
measures:
  - number: 1
    notes:
      - pitches: [60, 64, 67]  # All chord pitches
        name: "C major"         # Chord name
        duration: 2.0
```

### How Chords Are Currently Handled

**When extracting notes for progression:**
- Only the **first pitch (root note)** is used for checking
- C major chord `[60, 64, 67]` → requires playing pitch 60

**Why?**
- MIDI checking is per-note
- Chords need simultaneous note detection
- Lesson progression is sequential

---

## Recommended Practice Now

### For Chord Learning (Current)

Use **root notes** directly and label them as chords:

```yaml
name: "Simple Chords"
measures:
  # C major - play the root note (Do)
  - number: 1
    notes:
      - pitch: 60      # Root of C major
        duration: 2.0
      
  # F major - play the root note (Fa)
  - number: 2
    notes:
      - pitch: 65      # Root of F major
        duration: 2.0
      
  # G major - play the root note (Sol)
  - number: 3
    notes:
      - pitch: 67      # Root of G major
        duration: 2.0
```

### For Single Notes (Already Tested)
```yaml
measures:
  - number: 1
    notes:
      - pitch: 60
        duration: 1.0
      - pitch: 62
        duration: 1.0
```

---

## Common Chord Root Notes

### Major Triads
| Chord | Root Note | MIDI # |
|-------|-----------|--------|
| C major | Do (C) | 60 |
| D major | Re (D) | 62 |
| E major | Mi (E) | 64 |
| F major | Fa (F) | 65 |
| G major | Sol (G) | 67 |
| A major | La (A) | 69 |
| B major | Ti (B) | 71 |

### Minor Triads
| Chord | Root Note | MIDI # |
|-------|-----------|--------|
| C minor | Do (C) | 60 |
| D minor | Re (D) | 62 |
| E minor | Mi (E) | 64 |
| F minor | Fa (F) | 65 |
| G minor | Sol (G) | 67 |
| A minor | La (A) | 69 |
| B minor | Ti (B) | 71 |

---

## Using Full Chord Notation (Future)

The system **parses** full chord notation:

```yaml
measures:
  - number: 1
    notes:
      - pitches: [60, 64, 67]
        name: "C major"
        duration: 2.0
```

This is stored for **future use** when we implement:
- ✅ Chord recognition mode
- ✅ Multi-note validation (all 3 notes required)
- ✅ Flexible voicing (accept any octave)
- ✅ Score bonus for full chords

---

## Lessons Available

### Current Examples

1. **alphabet.yaml** - Single notes (proven)
2. **happy_birthday.yaml** - Single notes (proven)
3. **example_features.yaml** - Single notes + rests (proven)
4. **simple_chords.yaml** - NEW: Chord progression (root notes) ⭐

---

## How to Create a Chord Lesson

### Step 1: Create YAML File
```yaml
name: "My Chord Progression"
description: "Learn to play chord progressions"
tempo: 100
time_signature: "4/4"

measures:
  - number: 1
    notes:
      - pitch: 60        # C major root
        duration: 2.0
  
  - number: 2
    notes:
      - pitch: 65        # F major root
        duration: 2.0
  
  - number: 3
    notes:
      - pitch: 67        # G major root
        duration: 2.0
```

### Step 2: Save to `crates/lesson/lessons/my_chords.yaml`

### Step 3: Run App
```bash
cargo run
```

### Step 4: Select Your Lesson
- Choose "1. Start Interactive Lesson"
- Pick your chord lesson
- Play the root note for each chord

---

## Future Enhancements

### Phase 1: Flexible Root Note Matching
- Accept root note in any octave
- Example: Play C3, C4, or C5 (all count)

### Phase 2: Multi-Note Validation
- Detect when all 3 chord notes pressed
- Accept any voicing (C-E-G or E-G-C or G-C-E)
- Award bonus points for full chords

### Phase 3: Chord Recognition Game
- Show chord symbol (C major)
- Player must play the chord
- Accept any voicing
- Progress to next chord

---

## Testing Your Chords

Run the `simple_chords.yaml` lesson:

```
1. cargo run
2. Select "1. Start Interactive Lesson"
3. Choose "simple_chords"
4. Select note naming system (Solfege recommended)
5. Play these root notes in order:
   Do (60)
   Fa (65)
   Sol (67)
   Do (60)
   Do (60) + Fa (65)
   Sol (67) + Do (60)
```

Expected output:
```
✅ Correct! Do
✅ Correct! Fa
✅ Correct! Sol
✅ Correct! Do
✅ Correct! Do
✅ Correct! Fa
```

---

## Summary

✅ **Chord structure available** in YAML  
✅ **Root note matching works** (verified)  
✅ **Simple chord lessons possible** now  
⏳ **Full chord recognition** - future feature

**Start with root notes!** They work perfectly and teach the harmonic foundation of chords.
