# 🏗️ Leptos + Tauri Folder Structure for Piano Learning App

**Status:** Planning Phase  
**Version:** 1.0  
**Based on:** Project_Specification_and_Plan_EN.md (v1.4)  
**Tech Stack:** Leptos (Frontend/WASM) + Tauri v2 (Backend/Core) + midir (MIDI)  
**Architecture:** Dumb Components (Atoms) → Molecules → Organisms → Smart Containers  

---

## 📋 Requirements from Specification v1.4

### Frontend (Leptos - Rust to WebAssembly):

**Phase 1 (Visual):**
- Grand Staff rendering (Treble + Bass clefs)
- Staff lines, note heads, stems, accidentals
- Playhead cursor with movement
- Clef symbols and bar lines

**Phase 2 (Data & Layout):**
- YAML lesson parsing
- Layout engine (Y-coordinate calculation)
- Stem direction logic based on note position

**Phase 3 (MIDI Integration):**
- Real-time keyboard input via midir (Tauri backend)
- Chord grouping (50ms window)
- Hand assignment (split point at MIDI 60)

**Phase 4 (Game Logic):**
- Drill mode (random notes)
- Waiting mode (step-by-step)
- Tempo mode (rhythm/metronome)
- Evaluation strategies (pitch, timing, duration)

### Backend (Tauri + Rust):

- MIDI device access (midir library)
- Lesson file management
- Real-time note event streaming
- Tauri Commands for frontend ↔ backend communication

### Music Notation (from Music_Notation_Guide.md):

**Treble Staff (Right Hand):**
- Lines: E4, G4, B4, D5, F5 | Spaces: F4, A4, C5, E5
- Range: C4 (1 ledger below) to F5 (top line)

**Bass Staff (Left Hand):**
- Lines: G2, B2, D3, F3, A3 | Spaces: A2, C3, E3, G3
- Range: G2 (bottom line) to C4 (1 ledger above)

---

## 🎯 Folder Structure

### Root Workspace Layout

```
project-root/
├── Cargo.toml                          (Workspace root)
├── Cargo.lock
│
├── src-tauri/                          ⚙️ BACKEND (Tauri v2 + Core Logic)
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs                     (Tauri app entry, window setup)
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── lesson.rs               (Load/parse lessons)
│   │   │   ├── playback.rs             (Playhead, timing)
│   │   │   ├── evaluation.rs           (Score notes)
│   │   │   └── midi.rs                 (Device selection, stream status)
│   │   │
│   │   ├── services/
│   │   │   ├── mod.rs
│   │   │   ├── midi_input.rs           (midir integration)
│   │   │   ├── lesson_parser.rs        (YAML → data structures)
│   │   │   ├── evaluation.rs           (Pitch/timing/duration check)
│   │   │   ├── playback.rs             (Playhead movement, page turning)
│   │   │   └── statistics.rs           (Session tracking)
│   │   │
│   │   ├── models/
│   │   │   ├── mod.rs
│   │   │   ├── note.rs                 (MIDI number, duration, accidental)
│   │   │   ├── chord.rs                (Multiple notes, timestamp)
│   │   │   ├── lesson.rs               (Measures, metadata)
│   │   │   ├── score.rs                (Full lesson structure)
│   │   │   ├── evaluation.rs           (Feedback, correctness, score)
│   │   │   └── midi_event.rs           (Real-time input events)
│   │   │
│   │   ├── utils/
│   │   │   ├── mod.rs
│   │   │   ├── staff_position.rs       (MIDI → Y position logic)
│   │   │   ├── note_naming.rs          (MIDI ↔ note names)
│   │   │   ├── timing.rs               (Offset calculations)
│   │   │   └── duration.rs             (Duration classification)
│   │   │
│   │   └── config.rs                   (Constants, settings)
│   │
│   └── icons/                          (App icons)
│
├── src-leptos/                         🎨 FRONTEND (Leptos + WASM)
│   ├── Cargo.toml
│   ├── src/
│   │   ├── main.rs                     (Leptos app entry)
│   │   ├── app.rs                      (Root component)
│   │   │
│   │   ├── components/
│   │   │   ├── mod.rs
│   │   │   │
│   │   │   ├── atoms/                  [12 components]
│   │   │   │   ├── mod.rs
│   │   │   │   ├── notehead.rs         (Circle/oval note head)
│   │   │   │   ├── stem.rs             (Vertical line)
│   │   │   │   ├── accidental.rs       (♯ ♭ ♮ symbols)
│   │   │   │   ├── clef.rs             (Treble/Bass clef symbol)
│   │   │   │   ├── staff_lines.rs      (5 horizontal lines)
│   │   │   │   ├── playhead.rs         (Cursor line with marker)
│   │   │   │   ├── rest.rs             (Rest symbols)
│   │   │   │   ├── ledger_line.rs      (Extended range lines)
│   │   │   │   ├── bar_line.rs         (Measure dividers)
│   │   │   │   ├── time_signature.rs   (4/4, 3/4 etc)
│   │   │   │   ├── key_signature.rs    (Key indication)
│   │   │   │   └── beam.rs             (Eighth/sixteenth note flags)
│   │   │   │
│   │   │   ├── molecules/              [8 components]
│   │   │   │   ├── mod.rs
│   │   │   │   ├── note.rs             (Notehead + stem + accidental)
│   │   │   │   ├── duration_indicator.rs (Yellow/Green/Red feedback)
│   │   │   │   ├── measure.rs          (Bar lines + notes)
│   │   │   │   ├── feedback_badge.rs   (Timing/accuracy feedback)
│   │   │   │   ├── streak_counter.rs   (Success counter)
│   │   │   │   ├── virtual_keyboard.rs (Interactive keyboard display)
│   │   │   │   └── metronome_display.rs (Tempo/bpm indicator)
│   │   │   │
│   │   │   ├── organisms/              [6 components]
│   │   │   │   ├── mod.rs
│   │   │   │   ├── staff.rs            (Treble or Bass staff)
│   │   │   │   ├── grand_staff.rs      (Both staves + brace)
│   │   │   │   ├── timeline_viewer.rs  (Scrollable note list)
│   │   │   │   ├── performance_stats.rs (Real-time stats)
│   │   │   │   └── midi_input_display.rs (Active chord display)
│   │   │   │
│   │   │   └── containers/             [4 components - Smart]
│   │   │       ├── mod.rs
│   │   │       ├── lesson_stage.rs     (Main game container)
│   │   │       ├── lesson_select.rs    (Lesson picker)
│   │   │       ├── results_view.rs     (Session summary)
│   │   │       └── practice_mode.rs    (Drill/Waiting/Tempo)
│   │   │
│   │   ├── hooks/                      (Leptos custom hooks)
│   │   │   ├── mod.rs
│   │   │   ├── use_midi.rs             (MIDI event subscription)
│   │   │   ├── use_lesson.rs           (Load + manage lesson)
│   │   │   ├── use_playback.rs         (Playhead movement)
│   │   │   ├── use_evaluation.rs       (Score checking)
│   │   │   ├── use_statistics.rs       (Session tracking)
│   │   │   └── use_keyboard.rs         (Web keyboard fallback)
│   │   │
│   │   ├── models/                     (Frontend data structures)
│   │   │   ├── mod.rs
│   │   │   ├── note.rs                 (MIDI number, duration, hand)
│   │   │   ├── chord.rs                (Multiple notes at same time)
│   │   │   ├── lesson.rs               (Full lesson data)
│   │   │   ├── evaluation.rs           (Feedback types)
│   │   │   └── playback.rs             (Playback state)
│   │   │
│   │   ├── utils/                      (Leptos-specific utilities)
│   │   │   ├── mod.rs
│   │   │   ├── staff_position.rs       (MIDI → SVG Y position)
│   │   │   ├── note_naming.rs          (MIDI ↔ notenames)
│   │   │   ├── timing.rs               (Offset calculations)
│   │   │   ├── css.rs                  (Dynamic styling helpers)
│   │   │   └── svg_helpers.rs          (SVG generation utilities)
│   │   │
│   │   ├── styles/
│   │   │   ├── main.scss               (Global styles)
│   │   │   ├── components.scss         (Component overrides)
│   │   │   ├── atoms.scss              (Atom-specific)
│   │   │   ├── molecules.scss          (Molecule-specific)
│   │   │   └── organisms.scss          (Organism-specific)
│   │   │
│   │   ├── tauri/                      (Tauri command wrappers)
│   │   │   ├── mod.rs
│   │   │   ├── commands.rs             (invoke() wrappers)
│   │   │   ├── events.rs               (Backend event listeners)
│   │   │   └── types.rs                (Serializable types)
│   │   │
│   │   └── config.rs                   (Frontend constants)
│   │
│   └── index.html                      (Entry point)
│
├── lessons/                            (YAML lesson files)
│   ├── README.md
│   ├── example_features.yaml
│   ├── simple_chords.yaml
│   ├── happy_birthday.yaml
│   ├── two_hand_chords.yaml
│   └── alphabet.yaml
│
├── docs/                               (Project documentation)
│   ├── ARCHITECTURE_ANALYSIS.md
│   ├── MUSIC_NOTATION_GUIDE.md
│   ├── PROJECT_SPECIFICATION_AND_PLAN_EN.md (v1.4)
│   ├── LEPTOS_TUTORIAL.md
│   └── TAURI_INTEGRATION.md
│
└── target/                             (Build artifacts)
    ├── debug/
    └── release/
```

---

## 🧬 Component Layer Details

### 📦 ATOMS (Pure SVG Elements)

**Characteristics:**
- Zero business logic
- Pure Leptos functional components
- Accept `#[prop]` inputs only
- Render SVG primitives
- No hooks that access state

**Example Structure:**

```rust
// src-leptos/src/components/atoms/notehead.rs
use leptos::*;

#[component]
pub fn Notehead(
    #[prop] x: f32,
    #[prop] y: f32,
    #[prop] filled: bool,
    #[prop] radius: f32,
    #[prop(optional)] color: String,
) -> impl IntoView {
    let fill = if filled { "black" } else { "white" };
    
    view! {
        <ellipse
            cx={x.to_string()}
            cy={y.to_string()}
            rx={radius.to_string()}
            ry={(radius * 0.8).to_string()}
            fill={fill}
            stroke="black"
            stroke-width="1"
        />
    }
}
```

**List (12 atoms):**
1. `notehead.rs` - Circle/oval shape
2. `stem.rs` - Vertical line with optional width
3. `accidental.rs` - ♯ ♭ ♮ symbols
4. `clef.rs` - Treble (G) or Bass (F) symbol
5. `staff_lines.rs` - 5 horizontal lines
6. `playhead.rs` - Vertical cursor + triangle marker
7. `rest.rs` - Whole/half/quarter rest symbols
8. `ledger_line.rs` - Single extended range line
9. `bar_line.rs` - Single/double/final bar divider
10. `time_signature.rs` - 4/4, 3/4, etc
11. `key_signature.rs` - Sharp/flat count indicator
12. `beam.rs` - Flag for eighth/sixteenth notes

---

### 🧬 MOLECULES (Simple Compositions)

**Characteristics:**
- Combine 2-3 atoms
- Light calculations (formatting)
- Still mostly presentational
- May use simple signals

**Example:**

```rust
// src-leptos/src/components/molecules/note.rs
use leptos::*;
use crate::models::{Note, NoteDuration};
use crate::utils::staff_position;

#[component]
pub fn Note(
    #[prop] note: Note,
    #[prop] stem_direction: String, // "up" | "down"
    #[prop(optional)] status: String, // "normal" | "correct" | "wrong"
) -> impl IntoView {
    let y = staff_position::midi_to_y(note.midi, "treble");
    let has_stem = note.duration != NoteDuration::Whole;
    let is_filled = note.duration == NoteDuration::Quarter;
    
    view! {
        <g class={format!("note note-{}", status)}>
            <Notehead x=100.0 y=y filled=is_filled radius=8.0 />
            {has_stem.then(|| view! {
                <Stem x=108.0 y=y height=35.0 direction=stem_direction />
            })}
        </g>
    }
}
```

**List (8 molecules):**
1. `note.rs` - Notehead + stem + accidental
2. `duration_indicator.rs` - Yellow/Green/Red progress bar
3. `measure.rs` - Notes + bar lines in container
4. `feedback_badge.rs` - Timing/accuracy popup
5. `streak_counter.rs` - Success counter with animation
6. `virtual_keyboard.rs` - 52 white + 36 black keys
7. `metronome_display.rs` - BPM counter + beat indicator
8. `chord_tooltip.rs` - Chord name display (C-E-G)

---

### 🦑 ORGANISMS (Complex Sections)

**Characteristics:**
- Compose molecules into major features
- Layout responsibilities
- Coordinate multiple components
- May have signals for local state

**Example:**

```rust
// src-leptos/src/components/organisms/grand_staff.rs
use leptos::*;
use crate::models::Score;
use super::super::organisms::Staff;

#[component]
pub fn GrandStaff(
    #[prop] score: Score,
    #[prop(optional)] playhead_x: RwSignal<f32>,
) -> impl IntoView {
    view! {
        <svg viewBox="0 0 1000 600" class="grand-staff">
            {/* Decorative brace */}
            <path d="..." class="brace" />
            
            {/* Treble staff (top) */}
            <g transform="translate(0, 50)">
                <Staff clef="treble" measures=score.measures clone />
            </g>
            
            {/* Bass staff (bottom) */}
            <g transform="translate(0, 300)">
                <Staff clef="bass" measures=score.measures clone />
            </g>
            
            {/* Playhead */}
            <Playhead x=playhead_x y=50.0 height=250.0 />
        </svg>
    }
}
```

**List (6 organisms):**
1. `staff.rs` - Single staff (treble or bass)
2. `grand_staff.rs` - Both staves + connecting brace
3. `timeline_viewer.rs` - Scrollable note list
4. `performance_stats.rs` - Real-time accuracy/streak/time
5. `midi_input_display.rs` - Shows currently pressed keys
6. `measure_group.rs` - Multiple measures for page layout

---

### 🧠 CONTAINERS (Smart Components)

**Characteristics:**
- Business logic and state management
- Use Signals and Resources
- Call Tauri commands
- Orchestrate organisms

**Example:**

```rust
// src-leptos/src/components/containers/lesson_stage.rs
use leptos::*;
use crate::hooks::{use_lesson, use_midi, use_evaluation};
use crate::models::{Lesson, PlaybackState};

#[component]
pub fn LessonStage() -> impl IntoView {
    let lesson = use_lesson();
    let playback = create_rw_signal(PlaybackState::default());
    let midi_events = use_midi(playback);
    let evaluation = use_evaluation(midi_events.clone(), lesson.clone());
    
    view! {
        <div class="lesson-container">
            <GrandStaff score=lesson.score playhead_x=playback.x />
            <TimelineViewer events=lesson.notes />
            <PerformanceStats stats=evaluation.stats />
            <MidiInputDisplay active=midi_events.active_notes />
        </div>
    }
}
```

**List (4 smart containers):**
1. `lesson_stage.rs` - Main game (150+ lines, all logic)
2. `lesson_select.rs` - Lesson picker from backend
3. `results_view.rs` - Session summary
4. `practice_mode.rs` - Drill/Waiting/Tempo modes

---

## ⚙️ Backend (Tauri) Structure

### Commands

```rust
// src-tauri/src/commands/mod.rs
pub mod lesson;       // load_lesson, list_lessons
pub mod playback;     // seek, get_playhead_position
pub mod evaluation;   // check_note, get_feedback
pub mod midi;         // get_devices, start_listening
```

### Services

```rust
// src-tauri/src/services/
├── midi_input.rs      // midir integration, chord grouping
├── lesson_parser.rs   // YAML → data structures
├── evaluation.rs      // Pitch/timing/duration checking
├── playback.rs        // Playhead management
└── statistics.rs      // Session tracking
```

### Models

```rust
// src-tauri/src/models/
├── note.rs            // #[derive(Serialize, Deserialize)]
├── chord.rs           // Multiple notes + timestamp
├── lesson.rs          // Full lesson data
├── evaluation.rs      // Feedback, score, correctness
└── midi_event.rs      // Real-time input
```

---

## 🪝 Leptos Hooks (Custom)

```rust
// src-leptos/src/hooks/use_midi.rs
pub fn use_midi(playback: RwSignal<PlaybackState>) 
    -> (RwSignal<Vec<u8>>, RwSignal<Vec<MidiEvent>>) {
    // Subscribe to Tauri MIDI events
    // Chunk into chords (50ms window)
    // Filter by hand (split point logic)
}

// src-leptos/src/hooks/use_evaluation.rs
pub fn use_evaluation(
    midi: RwSignal<Vec<MidiEvent>>,
    lesson: Lesson,
) -> RwSignal<EvaluationState> {
    // Check pitch, timing, duration
    // Calculate feedback
}

// src-leptos/src/hooks/use_lesson.rs
pub fn use_lesson() -> Resource<(), Lesson> {
    // Call Tauri command: invoke("load_lesson")
    // Cache result in local state
}
```

---

## 📤 Tauri Command Flow

```
Frontend (Leptos)                Backend (Tauri)
──────────────────                ──────────────

invoke("load_lesson")  ────────→  lesson::load_lesson()
                                  └─→ parser.parse(yaml)
                      ←────────    Return: Lesson struct

invoke("start_midi")   ────────→  midi::start_listening()
                                  └─→ midir connect
                      ←────────    Return: device list

(MIDI Event)           ←────────  event.emit()
                                  └─→ listener.on_event()
                                  
invoke("check_note")   ────────→  evaluation::check_note(note)
                                  └─→ compare with lesson
                      ←────────    Return: Feedback
```

---

## 🎯 Development Sequence

**Phase 1 - Visual (Weeks 1-2):**
1. Set up Leptos + Tauri workspace
2. Build all atoms (notehead, stem, clef, etc)
3. Build molecules (note combining atoms)
4. Build grand_staff organism
5. Hardcode sample score (C D E F G)
6. Verify rendering on grand staff

**Phase 2 - Data (Weeks 2-3):**
1. Implement lesson_parser (YAML → structs)
2. Create lesson data models
3. Build lesson_select container
4. Load lessons dynamically from files
5. Build timeline_viewer organism

**Phase 3 - MIDI (Weeks 3-4):**
1. Integrate midir in Tauri backend
2. Implement MIDI listening service
3. Implement chord grouping (50ms window)
4. Create use_midi hook in Leptos
5. Show active notes on virtual keyboard

**Phase 4 - Logic (Weeks 4-5):**
1. Build evaluation service (pitch, timing, duration)
2. Implement three game modes:
   - Drill (random notes, immediate feedback)
   - Waiting (step-by-step, show next note)
   - Tempo (with metronome, rhythm checking)
3. Build feedback_badge molecule
4. Build performance_stats organism
5. Build results_view container

**Phase 5 - Polish (Weeks 5+):**
1. Add SQLite persistence (Tauri)
2. Add audio feedback (Tauri)
3. Add animations (Leptos)
4. Performance optimization (<16ms render)

---

## 🔑 Key Design Decisions

**1. Atoms are presentation-only** (no hooks, just SVG)
**2. Molecules are lightweight** (minor math, single signal max)
**3. Organisms coordinate layout** (no business logic)
**4. Containers own all state** (signals, resources, effects)
**5. Hooks manage cross-cutting concerns** (MIDI, lessons, evaluation)
**6. Backend handles all heavy lifting** (MIDI, parsing, evaluation)
**7. Tauri commands = API boundary** (type-safe, async)
**8. No global state** (pass signals down, events up)

---

## 📊 Line Count Estimates

| Layer | Component | Lines | Complexity |
|-------|-----------|-------|------------|
| **Atoms** | notehead | 20 | Minimal |
| | stem | 25 | Minimal |
| | clef | 35 | Minimal |
| **Molecules** | note | 50 | Low |
| | measure | 65 | Low |
| | feedback_badge | 45 | Low |
| **Organisms** | staff | 85 | Medium |
| | grand_staff | 75 | Medium |
| | timeline_viewer | 95 | Medium |
| **Containers** | lesson_stage | 150+ | High |
| | practice_mode | 200+ | High |
| **Hooks** | use_midi | 80 | Medium |
| | use_evaluation | 100 | Medium |
| **Services** (Backend) | midi_input.rs | 120 | Medium |
| | lesson_parser.rs | 100 | Medium |
| | evaluation.rs | 150 | High |

---

**Created:** January 25, 2026  
**Purpose:** Clear folder structure for full-Rust Piano Learning App (Leptos + Tauri)  
**Next Step:** Implement Phase 1 (atoms & molecules)
