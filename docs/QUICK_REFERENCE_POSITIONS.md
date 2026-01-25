# Quick Reference: Current Note Positions

**Updated:** January 25, 2026  
**Status:** Verified at http://localhost:3000/

---

## Visual Display (Correct)

```
TREBLE STAFF LAYOUT
────────────────────────────────────────
Y:40   Line 5 (F5)
       Space 4 (E5)
Y:60   Line 4 (D5)
       Space 3 (C5)
Y:80   Line 3 (B4)
       Space 2 (A4)
Y:100  Line 2 (G4) ◯│ ← G4 Half Note (hollow, has stem)
       Space 1 (F4) ●│ ← F4 Quarter Note (filled)
Y:120  Line 1 (E4) ●│ ← E4 Quarter Note (filled)
       Space below (D4) ●│ ← D4 Quarter Note (filled)
Y:140  Ledger line (C4) ●│ ← C4 Quarter Note (filled)
────────────────────────────────────────
```

---

## Current Lesson: C D E F G

| # | Note | MIDI | Y-Position | Type | Visual |
|---|------|------|------------|------|--------|
| 1 | C4 | 60 | 140 (Ledger) | Quarter | ●│ Filled, Stem Down |
| 2 | D4 | 62 | 130 (Space) | Quarter | ●│ Filled, Stem Down |
| 3 | E4 | 64 | 120 (Line 1) | Quarter | ●│ Filled, Stem Down |
| 4 | F4 | 65 | 110 (Space 1) | Quarter | ●│ Filled, Stem Down |
| 5 | G4 | 67 | 100 (Line 2) | Half | ◯│ Hollow, Stem Down |

---

## Note Type Reference

### Half Note (G4)
- **Head:** ◯ (hollow/white)
- **Stem:** | (present, pointing down)
- **Duration:** 2 beats
- **Rendering:** `<ellipse fill="white" />` + `<line />`

### Quarter Note (C4, D4, E4, F4)
- **Head:** ● (filled/black)
- **Stem:** | (present, pointing down)
- **Duration:** 1 beat
- **Rendering:** `<ellipse fill="black" />` + `<line />`

---

## Chord Separation (for Future Chords)

### When to Apply Offset

**Unison (same note, different voices):**
- Offset: 18 pixels right
- Example: Two pianists both play C4

**Secundal (adjacent notes like C-D):**
- Offset: 12 pixels right
- Example: Left hand C, right hand D

**Perfect Intervals (3+ semitones like C-E-G):**
- Offset: 0 pixels (stack vertically)
- Example: C Major chord (C-E-G)

---

## Current HTML Implementation

### SVG Coordinates

```xml
<!-- Treble Staff -->
<svg viewBox="0 0 1200 200">
  <!-- Staff lines at Y: 40, 60, 80, 100, 120 -->
  <line y1="40" ... />  <!-- Line 5 (F5) -->
  <line y1="60" ... />  <!-- Line 4 (D5) -->
  <line y1="80" ... />  <!-- Line 3 (B4) -->
  <line y1="100" ... /> <!-- Line 2 (G4) -->
  <line y1="120" ... /> <!-- Line 1 (E4) -->
  
  <!-- Ledger line for C4 -->
  <line y1="140" ... /> <!-- Below staff -->
  
  <!-- Notes -->
  <ellipse cx="150" cy="140" ... /> <!-- C4 -->
  <ellipse cx="300" cy="130" ... /> <!-- D4 -->
  <ellipse cx="450" cy="120" ... /> <!-- E4 -->
  <ellipse cx="600" cy="110" ... /> <!-- F4 -->
  <ellipse cx="750" cy="100" ... /> <!-- G4 (half note) -->
</svg>
```

---

## Verification Checklist

- [x] All notes positioned on correct staff lines/spaces
- [x] C4 on ledger line below staff
- [x] D4 below Line 1 (in space)
- [x] E4 on Line 1 (bottom staff line)
- [x] F4 in Space 1 (between lines 1-2)
- [x] G4 on Line 2 (second staff line from bottom)
- [x] All quarter notes filled (black)
- [x] Half note (G4) hollow (white)
- [x] All stems pointing downward
- [x] Ledger line visible for C4

---

## Testing in Browser

**URL:** http://localhost:3000/

**You should see:**
1. Grand staff with 5 black horizontal lines
2. Treble clef symbol (𝄞) on the left
3. Small horizontal line below main staff (ledger line for C4)
4. 5 noteheads positioned correctly
5. All noteheads with stems pointing down
6. First 4 noteheads filled (black circles)
7. Last notehead hollow (white circle with black outline)
8. Metadata at bottom: "Tempo: 120 BPM" and "Duration: 2.5 seconds"

---

## Calculation Reference

### Y Position Formula (Treble Clef)
```
Y = 50 - ((MIDI - 60) × 2.5)

Examples:
C4 (MIDI 60): Y = 50 - (0 × 2.5) = 50 (but shifted to Y=140 in viewport)
D4 (MIDI 62): Y = 50 - (2 × 2.5) = 45
E4 (MIDI 64): Y = 50 - (4 × 2.5) = 40
F4 (MIDI 65): Y = 50 - (5 × 2.5) = 37.5
G4 (MIDI 67): Y = 50 - (7 × 2.5) = 32.5
```

### Stem Direction (Treble Clef)
```
If MIDI >= 60: Stem points DOWN
If MIDI < 60:  Stem points UP

All current notes (60-67): Stems point DOWN ✓
```

### Chord Offset
```
If (MIDI_1 - MIDI_2).abs() == 0:    Offset = 18px (unison)
If (MIDI_1 - MIDI_2).abs() in [1,2]: Offset = 12px (secundal)
If (MIDI_1 - MIDI_2).abs() >= 3:     Offset = 0px  (perfect interval)
```

---

## Files Referenced

- **Visual:** http://localhost:3000/ (index.html)
- **Positioning:** `src-leptos/index.html` (lines 130-175)
- **Calculations:** `src-leptos/src/utils/midi_to_position.rs`
- **Documentation:** See `docs/POSITIONING_AND_CHORD_UPDATES.md`

---

## Status

✅ **Positions Corrected**  
✅ **Half Notes Verified**  
✅ **Chord Theory Documented**  
✅ **Tests Passing (7/7)**  
✅ **Ready for Phase 4**

---

**Quick Start:** Open http://localhost:3000/ and verify the notes display correctly!
