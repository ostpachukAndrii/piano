# 🎯 Responsibility Separation: Tauri Backend vs Leptos Frontend

**Purpose:** Crystal clear boundaries between Rust backend and WASM frontend  
**Version:** 1.0  
**Date:** January 25, 2026

---

## 🏗️ The Fundamental Rule

```
BACKEND (Tauri/Rust)          ←→ COMMUNICATION ←→           FRONTEND (Leptos/WASM)
├─ LOGIC                      Tauri Commands                ├─ RENDERING
├─ COMPUTATION                + Type-Safe IPC                ├─ STATE DISPLAY
├─ PERSISTENCE                                              ├─ USER INTERACTION
├─ DEVICE ACCESS                                            └─ ANIMATIONS
└─ HEAVY LIFTING                                             
```

---

## 📋 Backend Responsibilities (What Rust Does)

### 1️⃣ **MIDI Device Management** ⚙️
**Why Backend Only?** Web WASM cannot access system hardware directly.

```rust
// Backend only can do this
use midir::MidiInput;

fn get_midi_devices() -> Vec<MidiDevice> {
    let midi_in = MidiInput::new("Roland Piano")?;
    midi_in.ports()  // ← System MIDI API
        .map(|port| /* ... */)
        .collect()
}

fn listen_to_midi() {
    // Real-time raw MIDI events from keyboard
    // Never goes to frontend raw
    // Gets processed → sent as evaluated data
}
```

**Backend handles:**
- Device enumeration (what keyboards are connected?)
- MIDI connection/disconnection
- Raw MIDI byte stream processing
- Chord grouping (50ms window)
- Note debouncing

**Frontend never sees:** Raw MIDI bytes, device handles, system APIs

---

### 2️⃣ **File I/O & Persistence** 💾
**Why Backend Only?** Web WASM sandboxing restricts filesystem access.

```rust
// Backend only can do this
use std::fs;
use serde_yaml;

fn load_lesson(filename: &str) -> Result<Lesson> {
    let yaml_content = fs::read_to_string(
        format!("lessons/{}", filename)
    )?;
    let lesson: Lesson = serde_yaml::from_str(&yaml_content)?;
    Ok(lesson)
}

fn save_session_stats(stats: SessionStats) {
    // Write to SQLite database
    db.insert_stats(stats)?;
}
```

**Backend handles:**
- Reading YAML lesson files from disk
- Parsing YAML → Rust structs
- SQLite database operations (score history, settings)
- File validation and error handling

**Frontend never sees:** Filesystem paths, raw file content, database queries

---

### 3️⃣ **Evaluation & Scoring** 🎯
**Why Backend?** Complex logic, must be consistent, must be performant.

```rust
// Backend only - this is the "brains"
pub struct EvaluationService;

impl EvaluationService {
    pub fn evaluate_note(
        played: NoteEvent,           // What user played
        expected: &Note,             // What lesson expects
        playback_state: &PlaybackState,
    ) -> EvaluationResult {
        
        // Check 1: Pitch Correctness
        let pitch_correct = played.midi == expected.midi;
        
        // Check 2: Timing Accuracy
        let timing_offset = played.timestamp - expected.timestamp;
        let timing_correct = timing_offset.abs() < TIMING_TOLERANCE;
        
        // Check 3: Duration Checking
        let held_duration = played.release_time - played.timestamp;
        let expected_duration = duration_to_ms(expected.duration);
        let duration_status = classify_duration(
            held_duration,
            expected_duration,
            DURATION_TOLERANCE,
        );
        
        // Generate Feedback
        EvaluationResult {
            correct: pitch_correct && timing_correct,
            feedback: generate_feedback(...),
            score: calculate_score(...),
        }
    }
}
```

**Backend handles:**
- Pitch checking (MIDI number comparison)
- Timing validation (±tolerance window)
- Duration checking (note held for correct length)
- Hand independence checking
- Score calculation
- Feedback generation (text, color, sound)

**Frontend never sees:** Comparison logic, scoring algorithms, MIDI validation

---

### 4️⃣ **Playback State Management** ⏱️
**Why Backend?** Must be source of truth, coordinate complex timing.

```rust
// Backend manages playback authoritative state
pub struct PlaybackService {
    pub fn seek_to(time_ms: u64) -> PlaybackState {
        // Authoritative: where are we in the lesson?
        // What note should be showing?
        // What's the next chord?
        
        let current_measure = self.find_measure_at(time_ms);
        let current_notes = self.get_notes_at(time_ms);
        let next_notes = self.peek_ahead(time_ms);
        
        PlaybackState {
            time_ms,
            current_measure,
            current_notes,
            next_notes,
            page_number,
        }
    }
    
    pub fn move_playhead(direction: PlayheadMove) -> PlaybackState {
        // For Waiting mode: step-by-step
        // For Tempo mode: continuous
        // For Drill mode: discrete jumps
    }
}
```

**Backend handles:**
- Current playhead position (authoritative)
- Note timing lookup
- Page/measure boundaries
- Playhead movement strategy
- Duration of each note (when to advance)

**Frontend never sees:** Timing calculations, measure lookup, page logic

---

### 5️⃣ **Statistics & History** 📊
**Why Backend?** Must be persistent, reliable, auditable.

```rust
// Backend tracks everything
pub struct StatisticsService {
    pub fn record_note_played(
        lesson_id: &str,
        note_event: NoteEvent,
        evaluation: EvaluationResult,
        timestamp: u64,
    ) -> Result<()> {
        // Store in SQLite
        db.insert_note_event(
            lesson_id,
            note_event,
            evaluation,
            timestamp,
        )?;
        
        // Calculate session stats in real-time
        let current_stats = self.calculate_stats(lesson_id)?;
        
        // Emit to frontend
        emit_event("stats_updated", current_stats);
    }
}
```

**Backend handles:**
- Recording every note played (with timestamp)
- Calculating accuracy, streak, speed
- Session history (SQLite)
- User progress (database)
- Leaderboards, achievements (if added)

**Frontend never sees:** Database operations, history queries, calculation logic

---

## 🎨 Frontend Responsibilities (What Leptos Does)

### 1️⃣ **SVG Rendering** 🎼
**Why Frontend?** Real-time visual updates, browser native.

```rust
// Frontend renders the staff visually
#[component]
pub fn GrandStaff(score: Score, playhead: RwSignal<f32>) -> impl IntoView {
    view! {
        <svg viewBox="0 0 1000 600">
            // Render treble staff
            <g transform="translate(0, 50)">
                <StaffLines count=5 />
                <Clef clef_type="treble" />
                <For each=move || score.measures
                    key=|m| m.id
                    children=move |measure| {
                        view! { <Measure measure=measure /> }
                    }
                />
            </g>
            
            // Render bass staff
            <g transform="translate(0, 300)">
                <StaffLines count=5 />
                <Clef clef_type="bass" />
                <For each=move || score.measures
                    key=|m| m.id
                    children=move |measure| {
                        view! { <Measure measure=measure /> }
                    }
                />
            </g>
            
            // Playhead cursor
            <Playhead x=playhead.get() />
        </svg>
    }
}
```

**Frontend handles:**
- SVG path generation (staves, clefs, notes)
- Coordinate calculations (MIDI → Y position)
- Visual updates on every signal change
- Rendering performance (batching, memoization)

**Backend never sees:** Canvas pixels, SVG paths, rendering logic

---

### 2️⃣ **User Interaction & Input** 🎹
**Why Frontend?** Real-time responsiveness, DOM events.

```rust
// Frontend captures user actions
#[component]
pub fn LessonStage() -> impl IntoView {
    let on_key_press = move |event: web_sys::KeyboardEvent| {
        // User pressed a key
        // Send to backend for evaluation
        invoke("check_note", json!({
            "midi": key_to_midi(event.key()),
        }));
    };
    
    let on_midi_press = move |event: MidiEvent| {
        // User played note on MIDI keyboard
        // Backend already processed it
        // Frontend just displays it
    };
    
    let on_click_lesson = move |lesson_id: &str| {
        // User clicked lesson
        // Request lesson data from backend
        invoke("load_lesson", json!({ "id": lesson_id }));
    };
    
    view! {
        <div on:keydown=on_key_press>
            <div on:click=on_click_lesson>
                {/* Lesson list */}
            </div>
            {/* UI elements */}
        </div>
    }
}
```

**Frontend handles:**
- Mouse clicks, keyboard presses
- Touch input (mobile)
- Web Keyboard fallback (when MIDI unavailable)
- Event propagation and bubbling
- Form input validation

**Backend never sees:** DOM events, click coordinates, keyboard state

---

### 3️⃣ **State Display & Signals** 📊
**Why Frontend?** Real-time UI updates, Leptos Signals.

```rust
// Frontend maintains what to show RIGHT NOW
#[component]
pub fn LessonStage() -> impl IntoView {
    // Display state (what user sees)
    let current_playhead = create_rw_signal(0.0);
    let active_notes = create_rw_signal(vec![]);
    let feedback_message = create_rw_signal("".to_string());
    let accuracy_percentage = create_rw_signal(0);
    let current_streak = create_rw_signal(0);
    
    // Subscribe to backend events
    use_effect(move || {
        listen_to_event("playhead_moved", |data| {
            current_playhead.set(data.x);
        });
    });
    
    use_effect(move || {
        listen_to_event("note_evaluated", |data| {
            feedback_message.set(data.message);
            accuracy_percentage.set(data.accuracy);
            current_streak.set(data.streak);
        });
    });
    
    view! {
        <div class="lesson-display">
            <GrandStaff playhead=current_playhead />
            <FeedbackBadge message=feedback_message />
            <PerformanceStats accuracy=accuracy_percentage streak=current_streak />
        </div>
    }
}
```

**Frontend handles:**
- Displaying current values (Signals)
- Listening to backend events
- Updating UI reactively
- Caching display values
- Responsive layout

**Backend never sends:** Raw MIDI bytes, filesystem paths, implementation details

---

### 4️⃣ **Animations & Transitions** ✨
**Why Frontend?** Smooth UX, browser-native performance.

```rust
// Frontend animates visual feedback
#[component]
pub fn FeedbackBadge(message: RwSignal<String>, status: RwSignal<String>) -> impl IntoView {
    let fade_in = move || {
        animate! {
            from: opacity = 0;
            to: opacity = 1;
            duration: 200ms;
        }
    };
    
    let fade_out = move || {
        animate! {
            from: opacity = 1;
            to: opacity = 0;
            duration: 500ms;
        }
    };
    
    view! {
        <div 
            class={move || format!("badge badge-{}", status.get())}
            style="animation: fadeIn 200ms"
        >
            {move || message.get()}
        </div>
    }
}
```

**Frontend handles:**
- CSS animations (fade, slide, bounce)
- Playhead smoothing (visual only)
- Streak counter animations
- Color transitions (correct/wrong feedback)

**Backend never concerns:** Visual effects, animations, styling

---

### 5️⃣ **Page Layout & Styling** 🎨
**Why Frontend?** Responsive design, CSS cascade.

```rust
// Frontend handles responsive layout
#[component]
pub fn LessonStage() -> impl IntoView {
    view! {
        <div class="lesson-container">
            <section class="main-content">
                <GrandStaff />
                <TimelineViewer />
            </section>
            
            <aside class="sidebar">
                <PerformanceStats />
                <VirtualKeyboard />
                <MidiInputDisplay />
            </aside>
        </div>
    }
}

// SCSS
.lesson-container {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 20px;
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
}
```

**Frontend handles:**
- Layout grids/flexbox
- Responsive breakpoints
- Colors and fonts
- Spacing and padding
- Dark/light themes

**Backend never touches:** CSS, styling, responsive logic

---

## 🔀 Communication Layer (Tauri Commands)

```
Frontend Invoke         →      Backend Executes        →      Frontend Listen
────────────────────────────────────────────────────────────────────────────

invoke("load_lesson")   →      Commands::lesson::load   →     Resource resolves
  ↓                             ↓                              ↓
{lesson_id: "abc"}             lesson_parser.parse()        Score rendered
                               db.load_lesson()
                               
invoke("start_midi")    →      Services::midi::start     →     event: "midi_started"
  ↓                             ↓                              ↓
{}                              midir::connect()             Virtual keyboard lights up
                               start listening
                               
invoke("check_note")    →      Services::evaluation::eval →    event: "note_evaluated"
  ↓                             ↓                              ↓
{midi: 60, held_ms: 500}       compare with expected         Feedback badge shows
                               calculate score
                               
(no invoke needed)      ←      event: "playhead_moved"   ←     listen_to_event()
                               ↓                              ↓
                               periodic updates              Playhead cursor moves
                               from backend timer
```

### Command Signature Pattern

```rust
// src-tauri/src/commands/lesson.rs
#[tauri::command]
pub async fn load_lesson(
    lesson_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<LessonDTO, String> {
    // 1. Load from file/database
    let lesson = state.lesson_service.load(&lesson_id)?;
    
    // 2. Transform to DTO (serializable)
    let dto = LessonDTO {
        id: lesson.id,
        name: lesson.name,
        measures: lesson.measures.into(),
        // ... all fields must be Serializable
    };
    
    // 3. Return to frontend
    Ok(dto)
}

// src-leptos/src/tauri/commands.rs
pub async fn load_lesson(lesson_id: String) -> Result<LessonDTO> {
    invoke("load_lesson", json!({
        "lesson_id": lesson_id
    }))
    .await
}
```

---

## ✅ Decision Matrix: "Who Does This?"

| Task | Backend | Frontend | Reason |
|------|---------|----------|--------|
| Connect to MIDI keyboard | ✅ | ❌ | System hardware access |
| Read YAML lesson file | ✅ | ❌ | Filesystem access |
| Check if note is correct | ✅ | ❌ | Complex logic, must be consistent |
| Display note on staff | ❌ | ✅ | SVG rendering, real-time updates |
| Calculate accuracy % | ✅ | ❌ | Data belongs in backend |
| Show accuracy in UI | ❌ | ✅ | Display is frontend's job |
| Store score in database | ✅ | ❌ | Persistence, reliability |
| Animate streak counter | ❌ | ✅ | CSS/Leptos animation |
| Process MIDI chord (50ms) | ✅ | ❌ | Real-time processing, system |
| Display chord name | ❌ | ✅ | Just rendering backend data |
| Manage playback position | ✅ | ❌ | Authoritative timing |
| Move playhead cursor | ❌ | ✅ | Visual update |
| Calculate next note to show | ✅ | ❌ | Complex timeline logic |
| Render next note | ❌ | ✅ | SVG drawing |
| Count user streak | ✅ | ❌ | Must track all notes (persistent) |
| Flash green/yellow/red | ❌ | ✅ | Visual feedback animation |

---

## 🔄 Example Data Flow: User Plays a Note

```
1. User presses middle C on MIDI keyboard
   ↓
2. [BACKEND] midir receives raw MIDI event
   ├─ Decode: 0x90 0x3C 0x64 → Note On, MIDI 60, velocity 100
   ├─ Timestamp: 1705123456789 ms
   ├─ Check: Is this in a chord? (50ms window)
   └─ Result: Chord { [60], timestamp }
   ↓
3. [BACKEND] Evaluation Service checks note
   ├─ Expected: MIDI 60 (C4) with 500ms duration
   ├─ Actual: MIDI 60 with 520ms duration
   ├─ Pitch correct? YES ✓
   ├─ Timing correct? YES ✓
   ├─ Duration status? "PERFECT" (within tolerance)
   └─ Score: +100 points
   ↓
4. [BACKEND] emit event "note_evaluated"
   {
     "is_correct": true,
     "feedback": "Perfect!",
     "score_delta": 100,
     "accuracy": 98,
     "streak": 5,
     "next_midi": 62
   }
   ↓
5. [FRONTEND] Receive event in component
   ├─ Update: feedback_message.set("Perfect!")
   ├─ Update: accuracy_percentage.set(98)
   ├─ Update: current_streak.set(5)
   └─ Show next_midi on timeline_viewer
   ↓
6. [FRONTEND] SVG updates reactively
   ├─ Feedback badge animates (green)
   ├─ Streak counter increments with sparkle
   ├─ Next note highlights on timeline
   └─ User sees immediate visual response
```

---

## 🚫 Anti-Patterns (Don't Do This)

| ❌ WRONG | ✅ CORRECT |
|---------|-----------|
| Frontend calls MIDI directly | Backend calls MIDI, emits events to frontend |
| Frontend reads lesson YAML | Backend reads YAML, sends data to frontend |
| Frontend evaluates if note is correct | Backend evaluates, sends result to frontend |
| Backend stores CSS colors | Frontend stores CSS, backend sends semantic data |
| Frontend calculates accuracy | Backend calculates, frontend displays |
| Backend sends raw MIDI bytes | Backend sends processed NoteEvent |
| Frontend manages playback timer | Backend manages, frontend displays position |
| Backend renders SVG paths | Backend sends data, frontend renders |

---

## 🎯 Summary Table

```
┌─────────────────────────┬──────────────────┬──────────────────┐
│ Responsibility Area     │ Backend (Tauri)  │ Frontend (Leptos)│
├─────────────────────────┼──────────────────┼──────────────────┤
│ MIDI Hardware           │ ✅ All           │ ❌ None          │
│ File I/O & Database     │ ✅ All           │ ❌ None          │
│ Evaluation Logic        │ ✅ All           │ ❌ None          │
│ Timing & Playback       │ ✅ Source truth  │ ⚠️ Display only |
│ Statistics              │ ✅ Record        │ ⚠️ Display only |
│ SVG Rendering           │ ❌ None          │ ✅ All           │
│ User Input Handling     │ ❌ None          │ ✅ All           │
│ Animations              │ ❌ None          │ ✅ All           │
│ Layout & Styling        │ ❌ None          │ ✅ All           │
│ Real-time Display State │ ❌ None          │ ✅ Signals       │
├─────────────────────────┼──────────────────┼──────────────────┤
│ Communication Protocol  │ Tauri Commands (Type-Safe JSON over IPC) │
└─────────────────────────┴──────────────────┴──────────────────┘
```

---

## 🔑 The Golden Rule

```
┌─────────────────────────────────────────────────────────┐
│ BACKEND: Responsible for WHAT (Data, Logic, State)    │
│ FRONTEND: Responsible for WHERE & HOW (Display, UX)   │
└─────────────────────────────────────────────────────────┘

Backend answer: "Is the note correct?" → YES/NO
Frontend answer: "How should we show it?" → Animate badge
```

---

**Created:** January 25, 2026  
**Purpose:** Clear responsibility boundaries for maintainability and performance
