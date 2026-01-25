# Architecture Analysis & Understanding - January 2026

**Status:** 📊 ANALYSIS COMPLETE  
**Date:** January 24, 2026  
**Focus:** Understanding current design, extensibility, and dead code review

---

## 1. Clear Architecture Understanding

### Current Flow: Song → Lesson Runner → User Configuration

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW DIAGRAM                           │
└─────────────────────────────────────────────────────────────────────┘

USER INTERFACE LAYER (piano-cli)
    ↓ (main.rs / show_settings())
    ├─ Loads Settings
    │  └─ IncorrectNoteBehavior (Wait vs Skip)
    │  └─ Note Naming System (Western vs Solfege)
    ├─ Gets Lesson Directory
    └─ Calls PlayLessonUseCase
           ↓
APPLICATION LAYER (piano-app)
    ├─ PlayLessonUseCase::execute()
    │  ├─ Loads Lesson via LessonRepository
    │  ├─ Gets MIDI Device via MidiDeviceManager
    │  └─ Creates LessonPlayer
    │      └─ Stores: Song, Progress, NoteNaming
    │
    └─ run_lesson (lesson_runner.rs)
       ├─ Main game loop
       ├─ Displays current note
       ├─ Receives MIDI input
       └─ Handles incorrect notes based on:
          ├─ Settings.incorrect_note_behavior
          ├─ LessonPlayer.current_note()
          ├─ LessonPlayer.progress()
          └─ LessonPlayer.handle_midi_event()
           ↓
DOMAIN LAYER (piano-domain)
    ├─ Lesson (trait)
    │  ├─ id()
    │  ├─ name()
    │  ├─ description()
    │  └─ notes() → Vec<Note>
    │
    ├─ Note
    │  ├─ midi_number (0-127)
    │  └─ octave info
    │
    ├─ NoteName (enum)
    │  ├─ Western (C, D, E, F, G, A, B)
    │  └─ Solfege (Do, Re, Mi, Fa, Sol, La, Ti)
    │
    ├─ Progress
    │  ├─ current_index
    │  └─ percentage()
    │
    └─ LessonId
           ↓
INFRASTRUCTURE LAYER
    ├─ MIDI (piano-midi)
    │  ├─ MidiDeviceManager
    │  ├─ MidiEvent (from keyboard)
    │  └─ ConnectedMidiDevice
    │
    ├─ Lessons (piano-lessons)
    │  ├─ LessonRepository
    │  ├─ LessonConfig (from YAML)
    │  └─ YamlLessonLoader
    │
    └─ Piano Reader (roland_piano_reader)
       └─ Low-level MIDI reading
```

### Configuration Points

**Three levels of configuration:**

1. **User Settings** (`settings.rs`)
   - Where: `%APPDATA%\PianoLesson\settings.json`
   - What: `IncorrectNoteBehavior` (Wait vs Skip)
   - Used by: `run_lesson()` in lesson_runner.rs
   - Applied to: Each note evaluation

2. **Per-Session Choices**
   - Note Naming: Western vs Solfege
   - Lesson: Selected from available songs
   - MIDI Device: Auto-selected or chosen
   - Not persistent (reset each session)

3. **Song Definition** (`*.yaml` files)
   - Where: `crates/lesson/lessons/`
   - What: Name, description, note sequence
   - Loaded by: LessonRepository
   - Used by: LessonPlayer

---

## 2. Current Architecture Assessment

### ✅ Good Design Decisions

| Aspect | What | Why It Works |
|--------|------|-------------|
| **Separation of Concerns** | 5 distinct crates | Each layer has single responsibility |
| **Trait-Based Design** | Lesson trait | Easy to add new lesson types |
| **Configuration-Driven** | YAML lessons | No recompilation needed for new songs |
| **Settings Persistence** | JSON storage | User preferences survive restart |
| **Domain Layer** | Pure Rust logic | No dependencies on I/O |
| **Use Cases** | PlayLessonUseCase | Orchestrates complex workflows |

### 🤔 Extensibility Readiness for Future Features

Current structure **IS flexible** for planned features:

#### Feature: Timing Control (Planned)
```rust
// Add to Settings struct
pub struct Settings {
    pub incorrect_note_behavior: IncorrectNoteBehavior,
    pub timing_mode: TimingMode,  // NEW
}

pub enum TimingMode {
    WaitIndefinitely,  // Current: Wait
    AutoAdvanceAfter(Duration),  // NEW: Auto-advance after X ms
    StrictTiming(Tempo),  // NEW: Enforce rhythm
}

// Modify run_lesson() to track timing
// Update lesson_runner.rs to use timing_mode
```

**Why it works:** Settings are already loaded and passed through the flow.

#### Feature: Difficulty Levels (Planned)
```rust
// Add to Song definition
yaml_difficulty: Some(Difficulty::Easy)

// LessonRepository could filter by difficulty
pub fn list_available_by_difficulty(difficulty: Difficulty) -> Vec<String>

// Or return difficulty info in list
```

**Why it works:** Each song is separate, can add metadata without breaking existing code.

#### Feature: Note Hints / Strict Mode (Planned)
```rust
// Add to Settings
pub struct Settings {
    pub show_note_names: bool,  // NEW
    pub play_sound_feedback: bool,  // NEW
}

// Modify run_lesson() to check settings before displaying names
if !settings.show_note_names {
    print!("Next note: [hidden]");
} else {
    print!("Next note: {}", expected_note);
}
```

**Why it works:** All configuration flows through settings already.

#### Feature: Scoring System (Planned)
```rust
// Add to Progress struct (piano-domain)
pub struct Progress {
    current_index: usize,
    total_notes: usize,
    correct_count: usize,  // NEW
    total_attempts: usize,  // NEW
}

impl Progress {
    pub fn accuracy(&self) -> f32 {
        self.correct_count as f32 / self.total_attempts as f32
    }
}
```

**Why it works:** Progress already tracks state, just needs more fields.

---

## 3. Suggested Structure for Future Growth

### Current: Configuration Linear Flow
```
User Choice → Settings → run_lesson → MIDI Loop
```

### Recommended: Configuration Object Pattern
```
LessonContext {
    song: Song,
    configuration: LessonConfig {
        note_naming: NoteName,
        behavior: IncorrectNoteBehavior,
        timing: TimingMode,  // Future
        difficulty: Difficulty,  // Future
        ui_settings: UiSettings,  // Future
    },
    state: LessonState {
        progress: Progress,
        last_played_note: Option<Note>,
        timing_started: Instant,  // Future
    },
}
```

This would:
- ✅ Bundle all configuration together
- ✅ Make it easy to add new config options
- ✅ Pass single object instead of multiple parameters
- ✅ Reduce function signature changes

### Current Function Signature
```rust
fn run_lesson(
    lesson_name: &str,
    note_name: NoteName,
    device_idx: usize,
    lessons_dir: &str,
)
```

### Recommended (Future)
```rust
fn run_lesson(context: &LessonContext)
```

This solves "function signature explosion" when you add timing, difficulty, scoring, etc.

---

## 4. Dead Code Analysis

### ✅ CLEAN: No Significant Dead Code Found

**Findings:**

| Crate | Status | Notes |
|-------|--------|-------|
| **piano-domain** | ✅ CLEAN | All types used (Lesson, Note, NoteName, Progress) |
| **piano-lessons** | ✅ CLEAN | All modules: LessonConfig, YamlLessonLoader, LessonRepository |
| **piano-midi** | ✅ CLEAN | All modules: device, event, error used |
| **piano-app** | ✅ CLEAN | play_lesson.rs, lesson_player.rs, lesson_runner.rs all used |
| **piano-cli** | ⚠️ MINOR | See below |

### ⚠️ Minor Issue: piano-cli/src/lib.rs

**Problem:** The `lib.rs` contains duplicate/old code

```rust
// crates/piano-cli/src/lib.rs
pub fn run() { ... }  // OLD: Line 13
fn run_lesson() { ... }  // OLD: Line 35
fn list_lessons() { ... }  // OLD: Line 120
```

**Status:** This code is NOT used - `main.rs` has updated versions

**Current `main.rs`:** Has correct versions with settings support
**lib.rs:** Has old versions without settings support

**Why kept?:** Possibly for library API (exports `show_main_menu`)

### Recommendation: Consolidate lib.rs

**Option 1: Clean lib.rs (Recommended)**
```rust
// Keep only the public API
pub mod menu;
pub mod settings;

pub use menu::show_main_menu;
pub use settings::{Settings, IncorrectNoteBehavior};

// Remove: Old run_lesson(), run(), list_lessons()
```

**Option 2: Update lib.rs**
If you want lib.rs to be usable, update it to match main.rs

### Impact: **NONE** - This is a library export issue, not runtime dead code

The binary (main.rs) is being used correctly. The lib.rs duplication doesn't affect:
- ✅ Performance
- ✅ Compilation
- ✅ Runtime behavior
- ⚠️ Code clarity (small impact)

---

## 5. Code Quality Summary

### Build Status
```bash
$ cargo build --release
✅ No errors
✅ No warnings
✅ All dependencies resolved
```

### Architecture Quality
```
✅ Clean layering (5 crates, proper separation)
✅ DDD principles followed
✅ Trait-based extensibility
✅ YAML-driven configuration
✅ Settings persistence
✅ Proper error handling
```

### Extensibility Score: 8/10

**Why not 10/10?**
- Missing context object pattern (add when you have many config options)
- Could document extension points better

**To reach 10/10:**
- [ ] Create `LessonContext` struct
- [ ] Document extension guide
- [ ] Add "hooks" for custom note processors

---

## 6. Recommended Refactoring (Optional, Future Work)

### Current: Multiple Parameters
```rust
fn run_lesson(
    lesson_name: &str,
    note_name: NoteName,
    device_idx: usize,
    lessons_dir: &str,
    behavior: IncorrectNoteBehavior,
) {
    // Implementation
}
```

### Proposed: Context Object (When Adding 5+ Config Options)
```rust
pub struct LessonContext {
    pub lesson: Lesson,
    pub config: LessonConfig,
    pub state: LessonState,
}

pub struct LessonConfig {
    pub note_naming: NoteName,
    pub incorrect_behavior: IncorrectNoteBehavior,
    pub timing_mode: TimingMode,  // Future
    pub difficulty: Difficulty,  // Future
    pub show_hints: bool,  // Future
}

fn run_lesson(context: &mut LessonContext) {
    // Implementation
}
```

**Benefits:**
- ✅ No function signature changes when adding config
- ✅ Easier to serialize/save as JSON
- ✅ Single source of truth for lesson state
- ✅ Cleaner parameter passing

**When to do this:** When you've added 3-5 more configuration options

---

## 7. Future Features - Architecture Impact

### Feature: Timing & Tempo
**Impact:** Medium  
**Action:** Add `timing_mode` to Settings, track `Instant` in run_lesson loop

### Feature: Note Hints / Blind Mode
**Impact:** Low  
**Action:** Add `show_note_names` to Settings, conditionally print in loop

### Feature: Difficulty Levels
**Impact:** Low  
**Action:** Add metadata to YAML, filter in LessonRepository::list_available()

### Feature: Scoring & Stats
**Impact:** Medium  
**Action:** Enhance Progress struct, save results to JSON

### Feature: Custom Note Processors
**Impact:** High  
**Action:** Add plugin pattern or strategies

### Feature: Multiplayer / Network
**Impact:** High  
**Action:** Might need to refactor state management

---

## 8. Clear Separation: Song vs Configuration vs Runner

### Song Definition (`*.yaml`)
```yaml
name: "Happy Birthday"
description: "Classic birthday melody"
notes: [60, 62, 64, 65, 67, ...]  # Immutable
```
- **Responsibility:** Define what to play
- **Changes:** Very rarely (add new songs)
- **Format:** YAML (user-editable)

### Runner Configuration (`settings.json`)
```json
{
  "incorrect_note_behavior": "Wait"
}
```
- **Responsibility:** How to handle user errors
- **Changes:** Per user preference
- **Format:** JSON (persistent)

### Per-Session Configuration (Runtime)
```
note_naming: NoteName::Solfege
device: 0  // Roland Piano
```
- **Responsibility:** This session's choices
- **Changes:** Every session
- **Format:** In-memory only

### Lesson Runner (`lesson_runner.rs`)
```rust
fn run_lesson(/* config */) {
    loop {
        display_current_note();
        wait_for_midi();
        check_answer();
        apply_configuration();  // ← Uses all 3 levels
    }
}
```
- **Responsibility:** Execute the lesson
- **Uses:** All three configuration levels
- **Logic:** Note checking, progress tracking

---

## Summary

### ✅ Architecture is Sound
The current design is **well-structured** for planned features:
- Clean separation of concerns
- Trait-based extensibility
- Configuration-driven songs
- Persistent user settings

### 🚀 Ready for Future Features
Adding timing, difficulty, hints, or scoring requires:
- Small additions to Settings/LessonConfig
- Minimal changes to run_lesson loop
- No fundamental restructuring needed

### 📋 No Dead Code Issues
- All crates are used
- All modules are referenced
- Minor lib.rs duplication (cosmetic only)
- Build has zero warnings

### 🎯 Recommended Next Step
When you have 3+ new configuration options planned:
- Introduce `LessonContext` struct
- Group related configs together
- Document extension points

The current architecture is **extensible and maintainable** ✅
