Project Specification: Desktop Music Learning App

Version: 1.9
Language: Rust (Tauri v2) + Leptos (Frontend)
Architecture: Local Monolith

1. General Description & Requirements

1.1 Project Goal

Create a desktop application for piano learning that runs locally, features zero-latency performance, and provides interactive feedback via a MIDI keyboard.

1.2 Tech Stack

Core (Backend): Rust (Tauri v2). Responsible for MIDI, file system access, Database, and Audio.

UI (Frontend): Leptos (Rust -> WebAssembly). Responsible for component rendering and UI state management.

Database: SQLite (sqlx library). Local storage of progress.

MIDI: midir library (Native thread).

1.3 Functional Requirements

Note Rendering: Render the "Grand Staff" (Treble + Bass clefs) supporting chords, rests, and accidentals.

MIDI Input: Real-time recognition of key presses.

Smart Chord Logic: Ability to group individual MIDI events occurring within a short timeframe (e.g., 50ms) into a single "Chord" event to account for human imperfection.

Advanced Evaluation: Comparison of input note vs. expected note (Hit/Miss), plus Timing Analysis (Early/Late) and Duration Analysis (Short/Long).

Hand Independence: System must distinguish between Left and Right hand inputs (via Split Point logic) to support separate hand practice modes.

Progress: Load lessons from YAML files and save session statistics to SQLite.

Visual Feedback: Note highlighting, duration indicators, and playback cursor.

1.4 Non-Functional Requirements

Offline-first: Works without an internet connection.

Performance: Scene rendering < 16ms (60 FPS).

Latency: Key press response < 20ms.

1.5 Lesson Types & Game Modes

The application must support various learning scenarios, from note introduction to final performance.

A. "Drill" Mode (Note Identification)

Goal: Learn note positions on the staff without specific song context.

Logic: Static screen. A random note (or series) is displayed. User must press it.

Timing: None.

Transition Condition: The note changes only after the correct key is pressed.

B. "Waiting" Mode (Step-by-Step)

Goal: Learn the note sequence of a song and build muscle memory without speed stress.

Logic: Song loads. Cursor sits on the first note/chord.

Timing: Time stops. The cursor does not move forward until the user presses the correct keys.

Errors: If a wrong note is pressed, it highlights red; the cursor remains stationary.

C. "Tempo" Mode (Rhythm Performance)

Goal: Practice rhythm and speed.

Logic: Cursor moves at a set BPM (metronome).

Timing: Strict. User must hit the note within a "Time Window" (e.g., +/- 200ms from the perfect moment).

Variations (Hand Splitting):

Right Hand Only (RH): Program ignores (or auto-plays) the left hand part. Only notes with staff: 0 are evaluated.

Left Hand Only (LH): Only notes with staff: 1 are evaluated.

Full Performance (Both Hands): Everything is evaluated.

1.6 Navigation System & Playhead (Cursor)

The Playhead is a vertical line indicating the current position in the score.

Visual Requirements:

Appearance: Thin vertical line (1-2px) crossing both staves (Grand Staff).

Color: High contrast (e.g., bright blue or orange).

Marker: Optional small triangle or circle at the top/bottom of the staff for better visibility.

Movement Behavior:

Discrete Movement (Waiting Mode): Cursor "snaps" from one note to the next only after a correct action.

Smooth Movement (Tempo Mode): Cursor moves smoothly (interpolated) between notes according to the BPM. It does not stop at notes but passes through them.

Scrolling Logic (Page Turning):

Since scores can be long, a page-turning system is required.

"Page Flip" Strategy (MVP): Cursor moves left-to-right. When it reaches the right edge (e.g., 90% width), the page instantly "flips"—the next set of measures is displayed, and the cursor jumps back to the left start edge.

"Smooth Scroll" Strategy (Future): Cursor remains centered, and the staff moves smoothly to the left (conveyor belt style).

1.7 Performance Feedback Indicators

To improve student precision, visual feedback must go beyond simple Hit/Miss.

A. Note Duration Indicator (The "Hold" Gauge)

Concept: A visual bar or ring (e.g., around the active note) that fills up as the user holds the key.

Logic:

Fills while KeyIsPressed.

Yellow: Released too early (Staccato where not intended).

Green: Released within tolerance of target duration (Perfect sustain).

Red: Held too long (Over-held/Legato overlap where not intended).

B. Streak & Combo System

Logic: Tracks consecutive "Perfect" hits (Correct Pitch + Correct Timing + Correct Duration).

Feedback:

5 Perfect Notes: Small sparkle/glow animation on the 5th note.

Streak Counter: A counter (e.g., "x10") appears near the staff.

Break: Any mistake resets the counter to 0 and shakes the screen slightly.

1.8 Hand Separation & Visuals

To support effective hand practice, the UI and Logic must treat hands as distinct entities.

Visual Distinction:

Color Coding: Option to color-code notes by hand (e.g., Left Hand = Blue, Right Hand = Orange) or keep them standard Black.

Stem Direction: Strict adherence to rules (Left Hand stems usually down, Right Hand up) unless voiced otherwise.

Input Logic:

Split Point: A configurable MIDI note (Default: Middle C / 60) that divides the keyboard.

Notes < Split Point -> Assigned to Left Hand stream.

Notes >= Split Point -> Assigned to Right Hand stream.

Overriding: The lesson file can explicitly define which hand plays which note, overriding the automatic Split Point logic.

2. Implementation Roadmap (Phased)

We use a "bottom-up" approach: first build the "dumb" bricks (components), then assemble them into walls (layout), and finally add electricity (logic & MIDI).

PHASE 1: Visual Foundation (Atomic Components)

Goal: Teach the app to draw static music. No game logic, just pure rendering.

1.1 Environment Setup

Initialize Tauri v2 + Leptos project.

Setup Tailwind CSS.

1.2 Atomic Components (Atoms)

Create "Dumb" SVG Components. They accept props and simply draw themselves.

NoteHead: Oval shape.

Hollow: For Whole and Half notes.

Filled: For Quarter, Eighth, Sixteenth notes.

Stem: Vertical line of specific height.

Clef: SVG icons for Treble and Bass clefs.

StaffLines: 5 horizontal lines.

Playhead: Vertical line with a marker.

1.3 Molecular Components (Molecules)

Note: Composes NoteHead + Stem based on duration rules.

Whole Note: Hollow Head, NO Stem.

Half Note: Hollow Head, WITH Stem.

Quarter Note: Filled Head, WITH Stem.

DurationOverlay: A progress component overlaying the note to show hold duration (Yellow/Green/Red).

Rest: Rest component.

1.4 Organisms

Measure: Container that draws bar lines and places notes inside.

GrandStaff: Draws two staves connected by a brace.

Phase 1 Success Criteria: We can hardcode an array of notes (C, E, G) in the code, and they render correctly on screen as a static image.

PHASE 2: Data Logic & Parsing (Core Logic)

Goal: Convert the YAML lesson file into data structures the UI understands.

2.1 Data Models (Rust Structs)

Define Lesson, Measure, Note structs in Rust matching the YAML schema.

Add lesson_type (Drill, Song) and hand mode metadata.

Add Serde for deserialization.

2.2 YAML Parser

Implement reading lesson.yaml and converting it to Rust objects.

2.3 Layout Engine (CRITICAL)

Coordinate Inversion Logic:

Computer screens: Y=0 is TOP, Y=Max is BOTTOM.

Music Staff: Low Pitch is BOTTOM, High Pitch is TOP.

Formula: Y_Position = Base_Y - (Steps_From_Base * Step_Height).

Developer Warning:

In music: G4 (2nd line) is HIGHER than E4 (1st line).

On screen: Y=0 is TOP. Higher Y means LOWER on screen.

Therefore: Y-coordinate of C4 (Middle C) must be the LARGEST (lowest on screen). Y-coordinate of G4 (Sol) must be SMALLER (higher on screen). If C4 appears at the top of the screen, you forgot to invert the Y calculation.

Implement Stem Direction logic (Automata Rule): if note is above middle line -> stem down.

2.3.1 Measure & Bar Line Logic (Horizontal Spacing)

Measure Capacity: Assuming 4/4 time signature, a measure holds exactly 4 beats.

Layout Rule: Iterate through notes adding up their duration.

Current_Measure_Duration += Note.Duration

IF Current_Measure_Duration >= 4.0:

Insert Bar Line (Vertical Line).

Reset Current_Measure_Duration = 0.

Chord Exception: Notes played simultaneously (Chords) share the same timestamp. They DO NOT add extra duration.

Example: C (Quarter) + E (Quarter) at time 0.0 = 1 Beat total, NOT 2 beats.

Logic: Next_Position = Max(Current_Note_Duration).

2.4 UI Integration

Pass parsed lesson from Rust (Backend) to Leptos (Frontend) via Tauri Command.

Render a real lesson using Phase 1 components.

Phase 2 Success Criteria: App launches, reads lesson.yaml, and dynamically draws a correct score. Note C4 appears at the visual bottom, not top. Bar lines appear correctly every 4 beats.

PHASE 3: Hardware Integration (MIDI & Events)

Goal: Make the app interactive. Press a key -> See a reaction.

3.1 Native MIDI Thread

Start a dedicated thread in Rust using midir.

Implement available device listing.

3.2 Input Normalization (Chords & Hands)

Chord Window (Debouncing): When NoteOn is received, wait 50ms. Collect all other events. Dispatch as ChordEvent.

Hand Assignment: For each note in the chord, assign a hand tag based on the Split Point (e.g., note: 48 -> hand: left).

Dispatch: Send NormalizedInputEvent to UI containing pitch, velocity, and inferred hand.

3.3 Event System

Setup NoteOn / NoteOff event transmission from Rust thread to UI (Webview) via window.emit().

Create an active_note Signal in Leptos that updates upon receiving events.

3.3 Input Visualization

Add a virtual keyboard or highlight notes on the staff when the user presses them.

Phase 3 Success Criteria: Pressing a chord (C-E-G) physically registers as a single chord on screen, with correct hand assignment.

PHASE 4: Game Loop & Modes

Goal: Implement learning logic for different modes (Waiting, Tempo).

4.1 Evaluation Engine

Implement Strategy Pattern for evaluation:

WaitStrategy: Ignores time, waits for NoteOn == Target.

TempoStrategy: Checks NoteOn within time window [TargetTime - delta, TargetTime + delta].

Duration Check: On NoteOff, calculate held_duration. Set status to Short (Yellow), Perfect (Green), or Long (Red).

4.2 Hand Independent Evaluation

Logic: The engine must filter input events based on the active lesson mode.

Right Hand Mode: If Input.hand == Left, ignore the event (or treat as background noise). Only evaluate inputs where Input.hand == Right.

Both Hands Mode: Evaluate inputs against their respective targets. A mistake in LH does not cancel a correct hit in RH (unless strict mode is on).

4.3 Playhead Implementation

Rendering Optimization: Cursor must be on a separate SVG layer over the staff to avoid full staff repaints/reflows during movement.

Animation: Use requestAnimationFrame for smooth X-position updates in Tempo mode.

Page Logic: If cursor.x > screen.width * 0.9, load next set of Measures and reset cursor.x to start.

4.4 Error Handling

Visualize "ghost notes" if the user played incorrectly.

Phase 4 Success Criteria: User receives detailed feedback on Timing (Early/Late) and Duration (Short/Long).

PHASE 5: Persistence & Polish

Goal: Turn prototype into product.

5.1 Database (SQLite)

Create users, sessions tables.

Save lesson results (accuracy, time).

5.2 Menus & Navigation

Main menu for lesson selection.

Settings (MIDI device selection, Split Point configuration).

5.3 Audio (Optional)

Add metronome sound or synthesizer feedback using rodio in Rust.

3. Detailed Component Description for Phase 1

To start, we need to create these files.

3.1 NoteHead (Atom)

Just an oval. It doesn't know "C" or "D". It only knows coordinates and color.

Props: x, y, color, filled (bool).

Output: <ellipse cx=x cy=y rx=6 ry=5 fill=color />

3.2 Stem (Atom)

A vertical stick.

Props: x, y (start), height, direction (up/down).

Output: <line x1=x y1=y x2=x y2=(y +/- height) />

3.3 Playhead (Atom)

Progress cursor.

Props: x (absolute position within staff system), height (total height of grand staff).

Output: Group of <line> (the line itself) + <polygon> (triangle marker on top).

3.4 StaffSystem (Organism)

The background upon which everything is drawn.

Props: width, y_position.

Logic: Draws 5 lines with specific spacing (e.g., 10px).

Output: Group of <line> elements.

3.5 Note Rendering Logic (Rules Table)

Type

Duration (beats)

Head

Stem

Flag/Beam

Whole

4.0

Hollow

NO

No

Half

2.0

Hollow

YES

No

Quarter

1.0

Filled

YES

No

Eighth

0.5

Filled

YES

Flag/Beam

Sixteenth

0.25

Filled

YES

Double Flag/Beam

3.6 Reference Note Positions (Treble Clef Validation)

Use this reference to validate the Layout Engine in Phase 2.3. Note lines are counted from bottom (1) to top (5).

1. Note C4 (Middle C) | MIDI 60

Expected: Located on the first ledger line below the staff. Visually, a circle crossed by a short horizontal line, sitting separately below the main staff.

Why: The main treble staff starts at E4. C4 is two steps lower, requiring its own small line to visually extend the staff downwards.

2. Note D4 | MIDI 62

Expected: Located below the 1st line. Visually, the circle "hangs" under the bottom staff line, touching it with its top edge.

Why: This note sits in the space between the ledger line (C4) and the first main line (E4).

3. Note E4 | MIDI 64

Expected: Located exactly on the 1st (bottom) line. The staff line passes through the center of the note.

Why: This is the definition of the staff; the bottom line is E4.

4. Note F4 | MIDI 65

Expected: Located in the 1st space. The circle is wedged between the first (bottom) and second lines.

Why: In the musical alphabet, F follows E. Since E is on a line, F must be in the space above.

5. Note G4 | MIDI 67

Expected: Located exactly on the 2nd line from the bottom.

Why: This is the key note for the G Clef. The clef symbol curls around the second line, defining it as G.

3.7 Reference Note Positions (Bass Clef Validation)

Use this reference to validate the Layout Engine for the Left Hand (Bass Clef). Note lines are counted from bottom (1) to top (5).

1. Note C3 (Low C) | MIDI 48

Expected: Located in the 2nd space.

Why: The Bass Clef is an "F Clef", defining the 4th line as F3. Counting down, C3 lands in the second space.

2. Note D3 | MIDI 50

Expected: Located on the 3rd line.

Why: Directly above C3.

3. Note E3 | MIDI 52

Expected: Located in the 3rd space.

Why: In the space following the middle line.

4. Note F3 | MIDI 53

Expected: Located on the 4th line. The clef symbol has two dots flanking this line.

Why: This is the definition of the Bass Clef (F Clef).

5. Note G3 | MIDI 55

Expected: Located in the 4th space (top space).

Why: Sits between the F-line and the top line (A3).

6. Note C4 (Middle C) | MIDI 60 (In Bass Context)

Expected: Located on the first ledger line above the staff.

Why: It visually connects the Bass staff to the Treble staff above.