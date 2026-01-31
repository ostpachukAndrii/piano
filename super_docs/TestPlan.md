QA Test Plan: Piano Learning App (Core Engine)

Version: 1.4
Focus: Player Input Registration & Visual Notation Rendering
Scope: Core Gameplay Loop (Input -> Processing -> Visual Feedback)

1. Input Registration (The Listening Engine)

Objective: Ensure the application correctly identifies pitch, duration, and timing from various input sources.

1.1 MIDI Input (Digital Connection)

ID

Test Case

Steps

Expected Result

Priority

IN-01

Device Recognition

1. Launch App.



2. Plug in MIDI keyboard via USB/Bluetooth.



3. Check Settings/Status indicator.

App displays "MIDI Device Connected" toast or icon status updates immediately.

Critical

IN-02

Single Note Latency

1. Press Middle C (MIDI 60).



2. Measure time to UI feedback.

Visual feedback appears in < 20ms. Log shows correct MIDI Note Number (60).

Critical

IN-03

Velocity Sensitivity

1. Play a note with Velocity 10 (ppp).



2. Play with Velocity 120 (fff).

App registers input regardless of volume. (Note: Learning apps often normalize velocity for detection purposes, ensuring quiet notes aren't "missed").

High

IN-04

Simultaneous Polyphony

1. Mash a 10-note chord (use forearm if needed).

All notes register simultaneously. No dropped notes due to buffer limits.

High

IN-05

Repeated Notes (Trill)

1. Alternate C4 and D4 rapidly (16th notes @ 120BPM).

Distinct On/Off events for each strike. No "stuck" notes or merged durations.

High

1.2 Audio/Microphone Input (Acoustic Detection)

Crucial for users with acoustic pianos.
| ID | Test Case | Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- |
| MIC-01 | Silence Threshold | 1. Sit in a quiet room.



2. Enable Mic mode.



3. Do not play. | Input meter shows low noise floor. No "phantom" notes triggered by ambient noise (AC, traffic). | Critical |
| MIC-02 | Fundamental Freq Detection | 1. Play A4 (440Hz). | App identifies A4. Logic filters out the first harmonic (E5) often present in piano timbre. | Critical |
| MIC-03 | Low Register Detection | 1. Play A0 (Lowest note). | App detects pitch despite low frequency muddiness. | High |
| MIC-04 | Background Noise Rejection | 1. Play C4 while talking or having TV on in background. | App prioritizes the transient piano attack over voice frequencies. | Medium |

2. Visual Rendering (The Notation Engine)

Objective: Verify that music XML/MIDI data is converted into accurate, readable sheet music.

2.1 The Grand Staff

ID

Test Case

Steps

Expected Result

Priority

VIS-01

Clef Positioning

1. Load standard dual-hand song.

Treble Clef (G-clef) on top staff; Bass Clef (F-clef) on bottom. Brace connects them.

Critical

VIS-02

Key Signature Rendering

1. Load song in D Major (2 Sharps).

F# and C# symbols appear immediately after clefs on correct lines/spaces.

Critical

VIS-03

Time Signature

1. Load 4/4 song.



2. Load 3/4 song.

"4/4" or "3/4" numerals render after key signature. Spacing does not overlap notes.

High

2.2 Notes & Accidentals

ID

Test Case

Steps

Expected Result

Priority

NOTE-01

Pitch Y-Axis Accuracy

1. Generate scale C4 to C5.

Note heads climb stepwise: Line, Space, Line, Space. No overlaps.

Critical

NOTE-02

Stem Direction Rules

1. Render High C (Treble).



2. Render Low E (Treble).

High C: Stem points down (left side of head).



Low E: Stem points up (right side of head).

Medium

NOTE-03

Ledger Lines

1. Play C6 (High C, two lines above staff).

Note head renders with two crisp horizontal lines through/under it.

High

NOTE-04

Accidentals Handling

1. Render a measure with F#, then F natural.

Sharp symbol appears before first F. Natural symbol appears before second F. Symbols do not collide with note head.

High

2.3 Rests & Duration

ID

Test Case

Steps

Expected Result

Priority

REST-01

Rest Symbology

1. Display Quarter, Eighth, Whole rests.

Correct distinct symbols used. Whole rest hangs from line 4; Half rest sits on line 3.

High

REST-02

Grouping/Beaming

1. Render four 8th notes in 4/4 time.

Notes are connected by a heavy beam, not separate flags.

Medium

2.4 Measure Layout & Capacity

Testing the "container" logic of the bars.
| ID | Test Case | Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- |
| BAR-01 | Bar Line Separation | 1. Render 4 measures of music. | Thin vertical lines clearly separate each measure. Final measure has a double bar line (thick + thin). | High |
| BAR-02 | 4/4 Capacity Enforcement | 1. Attempt to add 5 Quarter notes to a 4/4 bar (via editor or import). | The 5th note is either rejected or automatically pushed to the next measure. A bar cannot contain 5 beats in 4/4. | Critical |
| BAR-03 | Proportional Spacing | 1. Measure A: 4 Quarter notes.



2. Measure B: 2 Half notes. | Notes in Measure A are spaced evenly (25% width each). Notes in Measure B are spaced evenly (50% width each). | Medium |
| BAR-04 | Rest Auto-Fill | 1. Place one Quarter note at the start of a 4/4 bar. | System automatically displays rests for the remaining 3 beats (e.g., Quarter Note -> Quarter Rest -> Half Rest). | High |
| BAR-05 | Measure Overflow | 1. Change Time Signature from 4/4 to 3/4 on an existing track. | Measures re-calculate. Notes that no longer fit in Bar 1 flow into Bar 2. | Low |

3. The Gameplay Loop (Interaction)

Objective: Test the synchronization between the scrolling staff, the cursor, and user input.

3.1 The "Wait" Mode (Stop-and-Go)

Common in Simply Piano where the music pauses if you don't play.
| ID | Test Case | Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- |
| GAME-01 | Cursor Freeze | 1. Start song.



2. Do not play the first note. | Cursor reaches the note and stops. Backing track fades/pauses. | Critical |
| GAME-02 | Resume on Input | 1. While frozen on C4, press C4. | Note lights up green. Cursor resumes moving. Backing track resumes. | Critical |
| GAME-03 | Wrong Note Behavior | 1. While frozen on C4, press D4. | Note D4 visualizer appears (red/ghost note) to show user error. Cursor remains frozen. | High |

3.2 Continuous Scrolling Mode

ID

Test Case

Steps

Expected Result

Priority

GAME-04

The Timing Window

1. Play note 50ms early.



2. Play note 50ms late.

Both register as "Hit" (Green).

Critical

GAME-05

Late Miss

1. Let cursor pass note completely.



2. Play note.

Note turns gray/red (Miss). Playing after the window does not trigger a "Hit".

High

GAME-06

Octave Error Feedback

1. Target is C4.



2. User plays C5.

App clearly indicates "Too High" or shows visual marker at C5 to guide user down.

Medium

4. Visual Specification Reference (The "Truth")

This section defines the rendering rules that developers must implement and QA must verify.

4.1 Note Anatomy (How they look)

Note Type

Note Head

Stem

Flag/Beam

Visual Check

Whole Note (4 beats)

Hollow Oval. Often tilted slightly (axis at 2 o'clock).

None. No stick attached.

None.

Must look like an "O" or tilted ellipse.

Half Note (2 beats)

Hollow Oval. Same head as Whole note.

Yes. A vertical stick.

None.

Like a "d" (if stem up) or "p" (if stem down) but with a hollow head.

Quarter Note (1 beat)

Filled (Solid) Oval. Black.

Yes. A vertical stick.

None.

Like a "d" or "p" with a solid black head.

Eighth Note (1/2 beat)

Filled (Solid) Oval.

Yes.

1 Flag (if alone) or 1 Beam (if grouped).

Flag looks like a curly tail on the right side of the stem.

Sixteenth Note (1/4 beat)

Filled (Solid) Oval.

Yes.

2 Flags (if alone) or 2 Beams (if grouped).

Two curly tails or two thick bars connecting notes.

4.2 Clef & Note Placement (Lines and Spaces)

A. The Staff

The staff consists of 5 horizontal lines and 4 spaces. We count from the bottom up (Line 1 is the bottom line).

B. Treble Clef (G Clef)

Symbol Placement:

The Anchor: The inner spiral of the symbol MUST center exactly on Line 2.

The Shape: The tail curls around Line 2 (defining it as G). The top of the clef extends above the staff; the bottom hook sits near Space 1.

Note Placement:

Lines (Bottom to Top): E - G - B - D - F

Mnemonic: Every Good Boy Does Fine.

Spaces (Bottom to Top): F - A - C - E

Mnemonic: FACE.

C. Bass Clef (F Clef)

Symbol Placement:

The Anchor: The solid black dot (the start of the curve) MUST be centered exactly on Line 4.

The Dots: The two small "colon" dots must float in Space 4 and Space 3, visually straddling Line 4 (defining it as F).

Note Placement:

Lines (Bottom to Top): G - B - D - F - A

Mnemonic: Good Boys Do Fine Always.

Spaces (Bottom to Top): A - C - E - G

Mnemonic: All Cows Eat Grass.

D. Ledger Lines

Middle C (C4): sits on the first ledger line BELOW the Treble Staff or the first ledger line ABOVE the Bass Staff.

A5 (High A): sits on the first ledger line ABOVE the Treble Staff.

4.3 Note Grouping (How we combine them)

Stem Direction Rule

To keep sheet music neat, the direction of the "stick" (stem) changes based on pitch.

Below the Middle Line (3rd Line): Stem goes UP. Attached to the Right side of the note head.

Above the Middle Line: Stem goes DOWN. Attached to the Left side of the note head.

Beaming

8th Notes: Two 8th notes are connected by one thick bar across their stems.

16th Notes: Two 16th notes are connected by two thick bars.

4.4 Rests (The Sound of Silence)

Whole Rest: A small filled rectangle hanging BELOW the 4th line.

Half Rest: A small filled rectangle sitting ON TOP of the 3rd line.

Quarter Rest: A squiggly symbol (bird/lightning bolt). Center aligned vertically.

Eighth Rest: A stem with one flag curving to the left (looks like a fancy '7').

4.5 Measures (Bars) & Capacity

A Measure (or Bar) is the container that holds a specific number of beats.

Bar Lines: Thin vertical lines that separate measures visually.

Time Signature: Defines the capacity of the container. The most common is 4/4.

Top Number (4): There are 4 beats in one measure.

Bottom Number (4): The Quarter Note counts as one beat.

Capacity Rules (for 4/4 Time):
The total value of notes + rests in a bar MUST equal 4.

1 Whole Note = 4 beats (Full)

2 Half Notes = 2 + 2 = 4 beats (Full)

4 Quarter Notes = 1 + 1 + 1 + 1 = 4 beats (Full)

1 Half + 1 Quarter + 2 Eighths = 2 + 1 + 0.5 + 0.5 = 4 beats (Full)

4.6 Horizontal Spacing (The Timeline)

Notes are not fixed-width graphics; they are placed based on Time.

Proportional Spacing: A measure is like a ruler.

Beat 1 starts at 0% width.

Beat 2 starts at 25% width.

Beat 3 starts at 50% width.

Beat 4 starts at 75% width.

Whole Note: Visually centered or left-aligned, but no other note can exist in that measure because it takes up 100% of the time capacity.

The "Rest" Logic: If you write a Quarter Note on Beat 1 and a Quarter Note on Beat 4, the space in between (Beats 2 and 3) MUST be filled with Rests (specifically a Half Rest) to account for the silence. You cannot have "empty" space in a measure; it must be accounted for by notes or rests.

4.7 Key Signatures (Sharps vs Flats)

Music is written in "Keys" which dictate which notes are always sharp (#) or flat (b). There are two families.

A. Sharp Keys (#)

When a song is in a Sharp key, the sharps appear at the very beginning of the staff in a specific order.
The Order of Sharps: F, C, G, D, A, E, B (Mnemonic: Father Charles Goes Down And Ends Battle).

Visual Placement (Fixed Vertical Positions):
The sharp symbol in the key signature MUST sit on these exact lines/spaces:

Treble Clef: High F (Line 5) -> High C (Space 3) -> High G (Space Above Line 5) -> High D (Line 4) -> Low A (Space 2) -> High E (Space 4) -> Middle B (Line 3).

Bass Clef: Middle F (Line 4) -> Middle C (Space 2) -> High G (Space 4) -> Middle D (Line 3) -> Low A (Line 1) -> Middle E (Space 3) -> Low B (Line 2).

B. Flat Keys (b)

When a song is in a Flat key, the flats appear in this order.
The Order of Flats: B, E, A, D, G, C, F (Mnemonic: Battle Ends And Down Goes Charles' Father).

Visual Placement (Fixed Vertical Positions):

Treble Clef: Middle B (Line 3) -> High E (Space 4) -> Middle A (Space 2) -> High D (Line 4) -> Middle G (Line 2) -> High C (Space 3) -> Low F (Space 1).

Bass Clef: Low B (Line 2) -> Middle E (Space 3) -> Low A (Line 1) -> Middle D (Line 3) -> Low G (Line 1) -> Middle C (Space 2) -> Low F (Space Below Line 1).

4.8 Accidental Rendering (Individual Notes)

When a sharp, flat, or natural occurs next to a note (not in the key signature), specific rules apply:

Alignment: The "belly" (center) of the symbol (# or b) must be on the exact same vertical coordinate (line or space) as the note head it modifies.

Placement: The symbol goes to the Left of the note head.

Spacing: If playing a chord (e.g., C and Eb together), the accidentals must not collide. They should be staggered horizontally if necessary, but the Eb symbol must still align vertically with the E note.