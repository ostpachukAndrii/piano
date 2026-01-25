Piano Staff Notation Guide (Treble + Bass) — Practical UI Reference & Test Plan

This document explains how notes look on the staff, how pitch is placed for treble and bass clefs, what sharps/flats/naturals are, and how notes are grouped into rhythms and chords.

Target audience: Developers building a music-notation UI (sheet music rendering) & QA Engineers.

Part 1: Notation Reference

1) The Staff (Stave)

A staff is 5 horizontal lines with 4 spaces between them.

Notes can be placed on a line or in a space.

Higher pitch = higher on the staff.

Lower pitch = lower on the staff.

Ledger Lines

If a note is higher or lower than the staff range, it uses ledger lines:

Ledger lines are short horizontal lines drawn through/near the notehead.

They continue the line/space pattern beyond the staff.

2) The Grand Staff (Piano Staff)

Piano music is typically written on the grand staff:

Top staff: Treble clef (right hand)

Bottom staff: Bass clef (left hand)

Connected by a brace on the left and usually a vertical line.

3) Clefs: Treble vs Bass

3.1 Treble Clef (G Clef) — Right Hand

The treble clef curls around the line that is G4.

Treble staff lines (bottom → top):

Line 1: E4

Line 2: G4

Line 3: B4

Line 4: D5

Line 5: F5

Treble staff spaces (bottom → top):

Space 1: F4

Space 2: A4

Space 3: C5

Space 4: E5

Common anchor note: Middle C (C4) is one ledger line below the treble staff.

3.2 Bass Clef (F Clef) — Left Hand

The bass clef dots surround the line that is F3.

Bass staff lines (bottom → top):

Line 1: G2

Line 2: B2

Line 3: D3

Line 4: F3

Line 5: A3

Bass staff spaces (bottom → top):

Space 1: A2

Space 2: C3

Space 3: E3

Space 4: G3

Common anchor note: Middle C (C4) is one ledger line above the bass staff.

4) Notes: Anatomy & Duration

A note symbol is usually made of:

Notehead (oval shape)

Stem (vertical line)

Flag (curvy hook) or Beam (thick line connecting stems)

Note Name (US)

Note Name (UK)

Head

Stem

Flag/Beam

Whole Note

Semibreve

Hollow

No

No

Half Note

Minim

Hollow

Yes

No

Quarter Note

Crotchet

Filled

Yes

No

Eighth Note

Quaver

Filled

Yes

1

Sixteenth Note

Semiquaver

Filled

Yes

2

5) Rests (Silence)

Rests represent silence.

Whole Rest: Hangs below the 4th line (looks like a hole).

Half Rest: Sits on top of the 3rd line (looks like a hat).

Quarter Rest: Squiggly line.

6) Stem Direction Rules

For readability:

Notes below the middle line (Line 3): Stem goes UP (on the right side).

Notes on/above the middle line: Stem goes DOWN (on the left side).

7) Accidentals: Sharp, Flat, Natural

Accidentals are drawn just to the left of the notehead.

Sharp (♯): Raises pitch 1 semitone.

Flat (♭): Lowers pitch 1 semitone.

Natural (♮): Cancels previous accidentals.

Scope Rule: An accidental applies to that specific pitch for the remainder of the measure.

8) Key Signatures

Placed immediately after the clef. Defines the "default" sharps/flats for the piece.

Example: If F# is in the key signature, all Fs are played as F# unless marked natural.

9) Time Signatures

Format: Top Number / Bottom Number (e.g., 4/4).

Top: Beats per measure.

Bottom: Which note value gets the beat (4 = quarter).

10) Chords

Multiple noteheads stacked vertically on one stem.

Rule: If notes are adjacent (intervals of a second), noteheads are offset horizontally to avoid collision.

11) Advanced UI Rendering Logic

11.1 Beaming

Notes (Eighth/Sixteenth) within the same beat are usually connected by beams instead of individual flags.

Slope: The beam usually follows the general direction of the notes (ascending or descending).

11.2 Articulations

Staccato: Dot centered above/below notehead.

Accent: > mark above/below staff.

Fermata: Semicircle with dot.

11.3 Dynamics

Placed below the staff in bold italic serif font.

p (piano - soft)

f (forte - loud)

Crescendo: < hairpin shape.

11.4 Spacing (The Engraver's Challenge)

Music spacing is not linear.

Rule: A Whole note takes more space than a Quarter note, but not 4x more.

Justification: Measures must stretch to fill the container width.

12) Piano-Specific Notation (Hand Mechanics)

12.1 Fingering (The Numbers)

Small numbers (1-5) placed near the notehead indicate which finger to use.

1: Thumb

5: Pinky

Placement: Usually above the staff for Right Hand (Treble) and below the staff for Left Hand (Bass). If there are multiple voices, fingering goes close to the notehead.

12.2 Pedaling (Sustain)

Instructions for the foot pedal appear below the bottom staff.

Ped. symbol: Press pedal down.

Asterisk (*): Release pedal.

Line notation: |_______^_______| (Solid line indicates hold, carrot ^ indicates a quick "change" of pedal).

12.3 Cross-Staff Beaming

Sometimes a musical line flows from the left hand to the right hand seamlessly.

Visual: The beam connects stems that start in the Bass staff and end in the Treble staff.

UI Challenge: The stem length must be calculated dynamically to bridge the gap between staves.

Part 2: QA Test Plan (Component Level)

Objective: Verify that the Music Notation UI renders correctly, adheres to music theory, and is responsive.

1. Visual Rendering Tests (Static)

ID

Test Case

Description

Expected Outcome

VR-01

Empty Staff

Render 5 lines.

Lines are equidistant, sharp, and span width.

VR-02

Clef Placement

Render Treble & Bass.

Treble spirals on G4; Bass dots surround F3.

VR-03

Ledger Lines

Input Middle C (C4).

Notehead has a line through it.

VR-04

Key Signature

Input G Major (1 Sharp).

Sharp symbol appears on the F line/space at the start.

VR-05

Chord Alignment

Input C Major chord.

Noteheads are perfectly stacked vertically.

VR-06

Secundal Chord

Input C and D together.

Noteheads are offset (diagonal touching) to prevent overlap.

2. Logic & Rule Tests

ID

Test Case

Description

Expected Outcome

LR-01

Stem Direction Up

Input low A (Treble).

Stem points UP, attached to right of notehead.

LR-02

Stem Direction Down

Input high C (Treble).

Stem points DOWN, attached to left of notehead.

LR-03

Accidental Scope

Measure 1: F# -> F.

Second F has NO symbol (remains sharp from first F).

LR-04

Bar Reset

Meas 1: F#

Meas 2: F.

LR-05

Beaming

Input 4 eighth notes.

Connected by one solid beam.

LR-06

Dotted Rhythm

Input Dotted Half note.

Dot appears in the space to the right of notehead.

3. Spacing & Layout Tests

ID

Test Case

Description

Expected Outcome

SL-01

Measure Width

Compare Whole note measure vs 16th note measure.

16th note measure is wider; Whole note measure is narrower but not collapsed.

SL-02

Collision

High note in Bass clef vs Low note in Treble clef.

Notes should not overlap visually between staves.

SL-03

Lyrics/Text

Add lyrics below notes.

Staff spacing increases to accommodate text.

4. Edge Cases (Stress Testing)

ID

Test Case

Description

Expected Outcome

EC-01

Extreme Range

Input C8 (Top of piano).

Multiple ledger lines drawn correctly.

EC-02

Complex Cluster

Chord with C, C#, D, D#.

Accidentals should stack to the left without colliding.

EC-03

Clef Change

Change clef mid-measure.

Smaller clef drawn; subsequent notes shift vertical position.

5. Instrument Specific Tests (Piano)

ID

Test Case

Description

Expected Outcome

PN-01

Fingering - Top

Add finger "5" to a high note (Treble).

Number "5" appears centered above the note/staff.

PN-02

Fingering - Bottom

Add finger "1" to a low note (Bass).

Number "1" appears centered below the note/staff.

PN-03

Split Point Logic

Auto-import MIDI scale C3 to C5.

Notes < C4 go to Bass clef. Notes >= C4 go to Treble clef.

PN-04

Pedal Marking

Add pedal sustain for 2 measures.

Line or "Ped." symbol appears under the bottom staff and extends correctly.

PN-05

Grand Staff Brace

Render system.

A curly brace connects Treble and Bass staves on the far left.

Part 3: Testing Implementation Roadmap

This roadmap outlines the phases for implementing the Test Plan, moving from basic logic verification to complex visual automation.

Phase 1: Core Logic & Unit Testing (No UI)

Goal: Verify that the "brain" of the music engine (pitch calculation, rhythm math) works before drawing anything.
Tools: Jest / Vitest

Step 1.1 - Note Parsing: Test function that converts "C#4" to an integer/frequency and correct staff position index.

Step 1.2 - Rhythm Math: Test that 4 quarters = 1 whole. Test tuplets (3 triplets = 1 beat).

Step 1.3 - Automata Rules: Implement unit tests for stem direction logic (Input: "B4" -> Output: "Down").

Step 1.4 - Split Point Logic: Test MIDI import logic (e.g., Note 60 is C4 -> Treble, Note 59 is B3 -> Bass).

Phase 2: Component Rendering (Visual Unit Tests)

Goal: Ensure isolated symbols draw correctly on HTML5 Canvas or SVG.
Tools: Storybook / Cypress Component Testing

Step 2.1 - Atomic Glyphs: Create stories for individual Clefs, Noteheads, Flags.

Step 2.2 - Accidental Placement: Verify visually that Sharps/Flats don't overlap the notehead.

Step 2.3 - Beaming Engine: Feed various 8th-note patterns and verify beam angle (flat, up, down).

Phase 3: Integration & Layout Engine

Goal: Test how measures flow together and spacing rules.
Tools: Playwright / Puppeteer

Step 3.1 - Measure Justification: Feed a JSON score with 100 notes. Verify it breaks into lines (staves) correctly without running off-screen.

Step 3.2 - Collision Detection: Force scenarios with lyrics and low notes. Check bounding boxes for overlaps.

Phase 4: End-to-End (E2E) & User Interaction

Goal: Simulate a real user composing music.

Step 4.1 - Input Events: Simulate mouse click on Line 2 -> Check if "G4" is added to state.

Step 4.2 - Playback: Trigger "Play". Verify the cursor moves across the screen in time.

Phase 5: Automated Visual Regression (The "Safety Net")

Goal: Catch unintended UI changes in updates.
Tools: Percy / Chromatic / Playwright Snapshots

Strategy: Maintain a "Golden Master" set of complex scores (e.g., a page of Chopin).

Pipeline: On every Git push, render the Golden Master and compare pixel-by-pixel. Fail if >1% pixel difference.

Part 4: Data Schema Requirements (YAML/JSON Structure)

To support the rendering features described above (Part 1) and pass the tests (Part 2), the data input format must be robust.

Recommended "Ideal" YAML Structure

name: "Alphabet Song & Chords"
time_signature: "4/4"
key_signature: "C major"
# Global formatting settings
layout:
  staves: 2  # 0: Treble, 1: Bass

measures:
  - number: 1
    # Example: Simple melody (8th notes beamed together)
    notes:
      - pitch: 60      # MIDI Pitch (Required)
        spelling: "C4" # Visual Spelling (Crucial for accidentals: C# vs Db)
        duration: 0.5  # Mathematical duration
        type: "eighth" # Visual shape
        staff: 0       # 0 = Treble
        fingering: 1   # Thumb
        beam: "begin"  # Starts the beam group
        articulation: "staccato"

      - pitch: 60
        spelling: "C4"
        duration: 0.5
        type: "eighth"
        staff: 0
        beam: "end"    # Ends the beam group

      - pitch: 67
        spelling: "G4"
        duration: 1.0
        type: "quarter"
        staff: 0
        beam: "none"

  - number: 2
    # Example: Two-Hand Chord (C Major)
    # Notes at the same timestamp are grouped in the UI
    notes:
      # Left Hand Part (C3-G3)
      - pitch: 48
        spelling: "C3"
        duration: 2.0
        type: "half"
        staff: 1       # 1 = Bass
        fingering: 5   # Pinky
        beam: "none"
      
      - pitch: 55
        spelling: "G3"
        duration: 2.0
        type: "half"
        staff: 1
        fingering: 1   # Thumb
        beam: "none"

      # Right Hand Part (C4-E4-G4) played simultaneously
      - pitch: 60
        spelling: "C4"
        duration: 2.0
        type: "half"
        staff: 0       # 0 = Treble
        fingering: 1
        beam: "none"
        
      - pitch: 64
        spelling: "E4"
        duration: 2.0
        type: "half"
        staff: 0
        fingering: 3
        beam: "none"

      - pitch: 67
        spelling: "G4"
        duration: 2.0
        type: "half"
        staff: 0
        fingering: 5
        beam: "none"


Part 5: Detailed User Workflows (E2E Scenarios)

These detailed scenarios simulate real-world usage to guide end-to-end testing.

Scenario A: The "First Note" Flow (Beginner)

Context: User is a student learning notation.

Given the editor is empty (blank measures).

When the user clicks on the 3rd line of the Treble staff.

Then a Quarter Note (B4) should appear.

Stem should point DOWN.

Note should be selected (highlighted).

When the user presses the "Up Arrow" key.

Then the note should move to the 3rd space (C5).

Stem remains DOWN.

Playback sound "C5" should trigger briefly.

Scenario B: The "Complex Chord" Entry (Intermediate)

Context: User is composing a jazz lead sheet.

Given a measure with a G Clef.

When the user adds a C4.

When the user adds an E4 and G4 at the same timestamp.

Then the three notes should stack vertically with a single stem.

When the user adds a C#4 (Sharp) to the chord.

Then the C# notehead should shift slightly to the right/left to avoid collision with C natural, OR replaces C natural if it's the same pitch class.

Correction Logic: If the intention is C# major triad (C#, E#, G#), accidentals must align to the left of the chord without overlapping.

Scenario C: The "Responsive Reflow" (Layout)

Context: User rotates their tablet from Portrait to Landscape.

Given a score with 4 measures per line in Portrait mode.

When the viewport width changes from 768px to 1024px.

Then the layout engine should re-calculate.

It might display 6 measures per line.

Bar lines must align vertically across the grand staff.

No notes should be cut off at the right margin.

Part 6: Mobile & Touch Interaction Scenarios

Since the UI may be used on tablets (Piano learning apps), touch targets are critical.

Scenario D: Touch Accuracy

Challenge: Staff lines are close together.

Test:

User taps with a "fat finger" near the E4 line.

System calculates the distance to the nearest valid snap point (Line or Space).

System places the note on the closest snap point.

Requirement: Touch target height for a line must be at least 40px (using invisible hit-boxes), even if the visual line spacing is 10px.

Scenario E: Drag & Drop

Action: User presses and holds a notehead.

Feedback: Note enlarges slightly and floats above finger.

Move: As user drags up/down, a "ghost note" snaps to lines/spaces to show where it will land.

Release: Note drops into the new position, stem direction updates automatically.

Part 7: Error Handling & Recovery

How does the system handle "impossible" musical situations?

Scenario F: Rhythm Overflow

Given a 4/4 measure already containing 4 Quarter notes.

When the user tries to add a 5th Quarter note.

Then (Option A): The new note is rejected/disabled.

Then (Option B - Preferred): The new note creates a new measure automatically, and the note is placed there.

Scenario G: Invalid Range

When user tries to drag a note way above the staff (e.g., C9).

Then the system limits the drag to the maximum supported MIDI note (e.g., C8), OR draws extreme ledger lines correctly without crashing the renderer.

Part 8: Accessibility & Assistive Tech (A11y)

Music notation is inherently visual, but the UI must be usable by visually impaired musicians using Screen Readers (NVDA, VoiceOver, JAWS).

A11y Requirement 1: Keyboard Navigation

Tab: Move focus between measures.

Left/Right Arrows: Select individual notes within a measure.

Up/Down Arrows: Change pitch of the selected note.

Enter: Open note properties menu.

A11y Requirement 2: ARIA Labels (Speech Output)

The canvas element itself is a "black box" to screen readers. We must provide a semantic shadow DOM or ARIA Live regions.

Expected Speech Output: "Measure 1, Beat 1. C4, Quarter Note. Staccato."

Implementation: When a note is selected, update a hidden <div aria-live="polite"> with the note description.

A11y Requirement 3: High Contrast Mode

Test: Ensure staff lines and stems are visible when the user enables "High Contrast" mode in Windows/macOS. Avoid hardcoded light-gray colors.

Part 9: Performance Benchmarks

Complex scores can kill browser performance.

Benchmark A: Rendering Speed

Target: A full page of music (approx. 20 measures, 200 notes) must render in < 100ms.

Test Strategy: Create a stress-test file with 1000 notes. Measure time from data_load to canvas_draw_complete.

Benchmark B: Playback FPS (Frames Per Second)

Context: During playback, a "playhead" (vertical cursor) moves across the screen.

Target: Animation must maintain 60 FPS.

Constraint: Do not re-render the entire staff every frame. Use a layered canvas approach (Layer 1: Static Staff, Layer 2: Moving Cursor).

Part 10: Audio Engine Integration

The visual UI must sync perfectly with the sound generation (Web Audio API or Tone.js).

Scenario H: The "Karaoke" Highlight

Action: Playback is running.

Visuals: The current note turns blue (active state) exactly when the sound is heard.

Latency: Visual update lag must be < 30ms relative to audio.

Lookahead: The UI engine needs to "look ahead" into the audio buffer to trigger visual updates efficiently.