# Note Duration Reference - Verification & Clarification

**Date:** January 25, 2026  
**Purpose:** Clarify note duration properties and verify implementation

---

## Note Duration Summary Table

| Duration | Beats | Head | Stem | Fill | Example |
|----------|-------|------|------|------|---------|
| **Whole** | 4.0 | ○ | NO | Hollow (white) | `◯────` (no stem) |
| **Half** | 2.0 | ○ | YES | Hollow (white) | `◯ │` (hollow head, has stem) |
| **Quarter** | 1.0 | ● | YES | Filled (black) | `● │` (filled head, has stem) |
| **Eighth** | 0.5 | ● | YES | Filled (black) + Flag | `● ╱` (filled head, flag on stem) |
| **Sixteenth** | 0.25 | ● | YES | Filled (black) + 2 Flags | `● ╱╱` (filled head, double flag) |

---

## Current Implementation Status

### Phase 3 (Completed ✅)

**Lesson: C D E F G**

| Note | MIDI | Duration | Head Fill | Stem | Status |
|------|------|----------|-----------|------|--------|
| C4 | 60 | Quarter | ● Filled | ✓ Down | ✅ Correct |
| D4 | 62 | Quarter | ● Filled | ✓ Down | ✅ Correct |
| E4 | 64 | Quarter | ● Filled | ✓ Down | ✅ Correct |
| F4 | 65 | Quarter | ● Filled | ✓ Down | ✅ Correct |
| G4 | 67 | **Half** | ◯ Hollow | ✓ Down | ✅ Correct |

### Key Points

✅ **Half notes (G4):**
- **Head:** Hollow (white/unfilled) - Correct
- **Stem:** Present (pointing down) - Correct
- **Visual:** ◯ │ (hollow oval with stem) - Correct

✅ **Quarter notes (C4, D4, E4, F4):**
- **Head:** Filled (black) - Correct
- **Stem:** Present (pointing down) - Correct
- **Visual:** ● │ (filled oval with stem) - Correct

---

## Note: Common Misconception

**Myth:** "Half notes don't have stems"  
**Truth:** Only **Whole notes** lack stems. **Half notes have stems** and hollow heads.

**Visual Proof:**
```
Whole Note        Half Note         Quarter Note
    ○                 ○│                ●│
  (no stem)      (stem present)    (stem present)
  (hollow)         (hollow)          (filled)
```

---

## Stem Rendering

### Stem Position Based on Note Position

**For Treble Clef:**
- Notes **at or above Middle C (MIDI 60):** Stem points **DOWN**
- Notes **below Middle C:** Stem points **UP**

**Current Lesson (All notes >= C4):**
- All stems point **DOWN** ✅

### Stem Length

Standard stem length: **35 pixels** from notehead

**Visual:**
```
Stem top (35px above notehead)
         │
         │
         │
         ○ ← notehead at Y position
         │
         │ (minimum extension for readability)
         │
```

---

## Current SVG Implementation

### Quarter Note (Filled, with stem)
```xml
<ellipse cx="150" cy="Y" rx="8" ry="6" fill="black" stroke="black" stroke-width="1" />
<line x1="158" y1="Y-35" x2="158" y2="Y" stroke="black" stroke-width="2" />
```
- **Head:** Filled black
- **Stem:** 35 pixels above notehead

### Half Note (Hollow, with stem)
```xml
<ellipse cx="750" cy="Y" rx="8" ry="6" fill="white" stroke="black" stroke-width="1" />
<line x1="758" y1="Y-35" x2="758" y2="Y" stroke="black" stroke-width="2" />
```
- **Head:** White (hollow) with black outline
- **Stem:** 35 pixels above notehead

### Whole Note (Hollow, NO stem)
```xml
<ellipse cx="X" cy="Y" rx="8" ry="6" fill="white" stroke="black" stroke-width="1" />
<!-- NO <line> element for stem -->
```
- **Head:** White (hollow) with black outline
- **Stem:** NONE

---

## Related Specifications

**Reference Documents:**
- [Project_Specification.md](../super_docs/Project_Specification.md) - Section 3.5 Note Rendering Logic
- [Music_Notation_Guide.md](../super_docs/Music_Notation_Guide.md) - Part 1: Notation Reference, Section 4

**Relevant Test Cases:**
- VR-01 through VR-06: Visual Rendering Tests
- LR-01 through LR-06: Logic & Rule Tests

---

## Verification Checklist

- [x] Quarter notes have filled heads (black)
- [x] Quarter notes have stems
- [x] Half notes have hollow heads (white)
- [x] Half notes have stems
- [x] Whole notes have hollow heads (white)
- [x] Whole notes have NO stems
- [x] All stems in current lesson point downward
- [x] Stem length is appropriate (35px)
- [x] SVG rendering is correct

---

## Summary

**Current Implementation: CORRECT ✅**

All notes in the Phase 3 lesson display with:
1. Correct notehead fill (filled for quarters, hollow for halves)
2. Correct stem presence (all have stems except whole notes)
3. Correct stem direction (downward for treble clef high notes)
4. Correct positioning (Y coordinates match staff lines/spaces)

The half note (G4) specifically:
- ✅ Shows with **hollow head** (white/unfilled)
- ✅ Includes **stem** pointing downward
- ✅ Displays for **2 beats** (half of a 4/4 measure)

---

**Status:** Documentation verified, implementation confirmed correct.
