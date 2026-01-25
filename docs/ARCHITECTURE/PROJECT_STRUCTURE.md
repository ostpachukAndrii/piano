# 📁 Project Structure Guide

**Last Updated:** January 24, 2026  
**Status:** ✅ Current  
**Related:** [DDD Architecture](DDD_ARCHITECTURE.md) | [Architecture Diagram](ARCHITECTURE_DIAGRAM.md)

---

## Directory Overview

```
g:\Rust run\roland\
├── 📄 README.md                    ← Main project entry point
├── 📄 COPILOT_INSTRUCTIONS.md      ← Instructions for documentation
├── 📄 Cargo.toml                   ← Workspace configuration
├── 📄 Cargo.lock                   ← Dependency lock
├── 📁 src/                         ← Root library (legacy)
├── 📁 crates/                      ← Main application crates
├── 📁 docs/                        ← All documentation
├── 📁 target/                      ← Build output (git ignored)
└── 📁 .git/                        ← Version control
```

---

## Crates Structure

### Overview
The project uses a **Rust workspace** with 7 crates organized by **Domain-Driven Design** principles:

```
workspace (root)
├── piano-domain         (Pure domain logic - no I/O)
├── piano-lessons        (Configuration loading)
├── piano-midi           (MIDI device infrastructure)
├── piano-app            (Application logic & use cases)
├── piano-cli            (Presentation & UI)
├── lesson               (Legacy - kept for compatibility)
└── roland_piano_reader  (Root crate - legacy)
```

---

## Detailed Crate Structure

### 1. 🎮 **piano-domain** - Pure Domain Logic

**Location:** `crates/piano-domain/`

**Purpose:** Core business logic with ZERO I/O. Testable in isolation.

**Files:**
```
piano-domain/
├── Cargo.toml
└── src/
    ├── lib.rs              ← Public API exports
    ├── lesson.rs           ← Lesson trait & ConcreteLesson
    ├── note.rs             ← Note value object
    ├── progress.rs         ← Progress tracking (immutable)
    └── note_name.rs        ← NoteName enum (Western/Solfege)
```

**Key Concepts:**
- `Lesson` trait - abstract lesson interface
- `Note` - MIDI note value object
- `Progress` - immutable progress tracking
- `NoteName` - note naming system selector

**Dependencies:** None (pure Rust)

---

### 2. 📂 **piano-lessons** - Lesson Configuration

**Location:** `crates/piano-lessons/`

**Purpose:** Load lessons from YAML configuration files.

**Files:**
```
piano-lessons/
├── Cargo.toml
├── src/
│   ├── lib.rs              ← Public API
│   ├── yaml_loader.rs      ← Load .yaml → Lesson
│   ├── lesson_config.rs    ← YAML structure
│   └── repository.rs       ← Repository pattern
└── lessons/                ← YAML lesson files
    ├── alphabet.yaml       ← Alphabet Song
    └── happy_birthday.yaml ← Happy Birthday melody
```

**Key Concepts:**
- `YamlLessonLoader` - parses YAML files
- `LessonConfig` - structure of YAML file
- `Repository` - lesson discovery & loading
- Universal config format (easy to edit)

**Dependencies:** serde, serde_yaml, piano-domain

**How to add a lesson:**
```bash
# Create YAML file
cat > crates/lesson/lessons/my_song.yaml << EOF
name: "My Song"
description: "Description"
notes:
  - 60  # C
  - 62  # D
EOF

# Restart app - lesson automatically discovered!
```

---

### 3. 🎹 **piano-midi** - MIDI Infrastructure

**Location:** `crates/piano-midi/`

**Purpose:** Hardware interaction - MIDI device management and event parsing.

**Files:**
```
piano-midi/
├── Cargo.toml
└── src/
    ├── lib.rs              ← Public API
    ├── device.rs           ← Device management & connection
    ├── event.rs            ← MIDI event types & parsing
    └── error.rs            ← Error handling
```

**Key Concepts:**
- `MidiDeviceManager` - list and connect to devices
- `ConnectedMidiDevice` - active connection with event channel
- `MidiEvent` - types (NoteOn, NoteOff, ControlChange, etc.)
- Channel-based event handling (non-blocking)

**Dependencies:** midir (MIDI library), piano-domain

**Usage Pattern:**
```rust
// Create manager
let mut manager = MidiDeviceManager::new()?;

// List devices
let devices = manager.list_devices()?;

// Connect
let mut device = manager.connect(device_idx)?;

// Receive events (non-blocking)
while let Some(event) = device.try_recv() {
    // Handle MIDI event
}
```

---

### 4. 📱 **piano-app** - Application Logic

**Location:** `crates/piano-app/`

**Purpose:** Business logic, use cases, orchestration.

**Files:**
```
piano-app/
├── Cargo.toml
└── src/
    ├── lib.rs              ← Public API
    ├── play_lesson.rs      ← PlayLessonUseCase (orchestrator)
    ├── lesson_player.rs    ← MIDI + progress coordinator
    ├── lesson_runner.rs    ← Game loop ✅ MOVED HERE
    └── error.rs            ← Error types
```

**Key Concepts:**
- `PlayLessonUseCase` - main use case, orchestrates all layers
- `LessonPlayer` - coordinates lesson, progress, MIDI
- `lesson_runner::run_lesson()` - game loop implementation
- Combines domain + infrastructure

**Dependencies:** piano-domain, piano-lessons, piano-midi

**Layer in Architecture:**
```
piano-app (Application Layer)
    ├─→ piano-domain (Domain logic)
    ├─→ piano-lessons (Configuration)
    └─→ piano-midi (Infrastructure)
```

---

### 5. 🎨 **piano-cli** - Presentation Layer

**Location:** `crates/piano-cli/`

**Purpose:** User interface, menus, terminal interaction.

**Files:**
```
piano-cli/
├── Cargo.toml
├── src/
│   ├── main.rs             ← Binary entry point
│   ├── lib.rs              ← CLI logic
│   └── menu.rs             ← Menu UI components
└── src/main.rs → calls → piano_cli::run()
```

**Responsibilities:**
- Display menus
- Get user input
- Delegate to piano-app for logic
- Handle terminal output

**Key Functions:**
- `run()` - main CLI loop
- `run_lesson()` - menu handler (delegates to piano-app)
- `list_lessons()` - display available lessons
- `show_main_menu()` - UI component

**Dependencies:** piano-app, piano-domain, piano-midi

**Important:** Does NOT contain business logic. Delegates to piano-app.

---

### 6. 📚 **lesson** - Legacy Compatibility

**Location:** `crates/lesson/`

**Purpose:** Legacy crate, kept for compatibility and reference.

**Files:**
```
lesson/
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── loader.rs           ← YAML loading (similar to piano-lessons)
│   └── note_name.rs        ← Note naming (similar to piano-domain)
├── lessons/                ← YAML lesson files
│   ├── alphabet.yaml
│   └── happy_birthday.yaml
└── examples/               ← (empty, old examples removed)
```

**Note:** This crate is kept for reference and testing compatibility. New development uses the DDD crates instead.

---

### 7. 🌊 **roland_piano_reader** - Root Crate

**Location:** `src/`

**Purpose:** Legacy library, root of workspace. Kept for reference.

**Status:** Superseded by DDD crates.

---

## Documentation Structure

```
docs/
├── INDEX.md                    ← Navigation hub
├── ARCHITECTURE/
│   ├── DDD_ARCHITECTURE.md
│   ├── PROJECT_STRUCTURE.md    ← This file
│   └── ARCHITECTURE_DIAGRAM.md
├── GUIDES/
│   ├── LESSON_SYSTEM.md
│   ├── LESSON_USAGE.md
│   └── AUTO_SELECT.md
├── REFERENCE/
│   ├── TESTING.md
│   └── IMPLEMENTATION_COMPLETE.md
└── CHANGES/
    └── PROJECT_CLEANUP_JAN2026.md
```

---

## Build Output

```
target/
├── debug/              ← Development builds
│   ├── deps/          ← Compiled dependencies
│   ├── piano.exe      ← Main binary
│   └── ...
└── release/           ← Release builds (when compiled with --release)
```

---

## File Purposes

### Configuration Files
- `Cargo.toml` - Workspace and crate configuration
- `Cargo.lock` - Dependency lock (commit this)
- `.gitignore` - Files to ignore in version control

### Source Code
- `src/` - Legacy root library
- `crates/*/src/` - Individual crate source

### Documentation
- `README.md` - Main entry point
- `COPILOT_INSTRUCTIONS.md` - Documentation guidelines
- `docs/` - All detailed documentation

### Build Output
- `target/` - Compiled binaries and artifacts (git ignored)

---

## Key Directories at a Glance

| Directory | Contents | Purpose |
|-----------|----------|---------|
| `crates/piano-domain/` | Pure logic | Domain entities, no I/O |
| `crates/piano-lessons/` | YAML + loader | Lesson configuration |
| `crates/piano-midi/` | MIDI handler | Device connection |
| `crates/piano-app/` | Use cases | Business logic |
| `crates/piano-cli/` | UI | Terminal interface |
| `crates/lesson/lessons/` | .yaml files | Actual lesson content |
| `docs/` | .md files | All documentation |
| `target/` | build artifacts | Compiled output |

---

## Adding New Components

### New Crate
```bash
# Create new DDD crate
cargo new crates/my_feature --lib

# Update root Cargo.toml:
[workspace]
members = ["crates/my_feature", ...]
```

### New Lesson
```bash
# Create YAML file
cat > crates/lesson/lessons/my_lesson.yaml << EOF
name: "Lesson Name"
description: "Description"
notes:
  - 60
  - 62
EOF
# Restart app - automatically discovered!
```

### New Module in Existing Crate
```bash
# In crates/piano-app/src/
touch new_module.rs

# In lib.rs:
pub mod new_module;
pub use new_module::NewPublicType;
```

---

## Dependencies

### External Crates
- `midir` - MIDI library (for piano-midi)
- `serde` - Serialization (for YAML parsing)
- `serde_yaml` - YAML support (for piano-lessons)

### Internal Dependencies
```
piano-cli
  └─→ piano-app
      ├─→ piano-domain
      ├─→ piano-lessons
      │   └─→ piano-domain
      └─→ piano-midi
          └─→ piano-domain
```

**Principle:** Each layer only depends on layers below it. No circular dependencies.

---

## Build & Run

### Development Build
```bash
cargo build
# Binary: target/debug/piano.exe
```

### Run
```bash
cargo run
# Runs target/debug/piano.exe with CLI
```

### Release Build
```bash
cargo build --release
# Binary: target/release/piano.exe (smaller, faster)
```

### Testing
```bash
cargo test
# Runs all unit tests
```

---

## Layer Architecture

```
┌─────────────────────────────────────────┐
│ piano-cli (UI Layer)                    │
│ - Menus                                 │
│ - User input                            │
│ - Terminal output                       │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ piano-app (Application Layer)           │
│ - PlayLessonUseCase                     │
│ - lesson_runner (game loop)            │
│ - LessonPlayer (orchestration)          │
└────────────────┬────────────────────────┘
                 ↓
        ┌────────┴────────┐
        ↓                 ↓
    ┌────────┐      ┌──────────────┐
    │piano-  │      │piano-domain  │
    │lessons │      │(Pure logic)  │
    │(Config)│      └──────────────┘
    └────────┘
        ↓
    ┌──────────────────────┐
    │piano-midi            │
    │(MIDI devices)        │
    └──────────────────────┘
```

---

## Quick Navigation

**Want to...**
- Add a lesson? → See [LESSON_USAGE.md](GUIDES/LESSON_USAGE.md)
- Understand architecture? → See [DDD_ARCHITECTURE.md](ARCHITECTURE/DDD_ARCHITECTURE.md)
- Run tests? → See [TESTING.md](REFERENCE/TESTING.md)
- Understand this guide better? → See [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE/ARCHITECTURE_DIAGRAM.md)

---

**This structure ensures clean separation of concerns and maintainability.** ✨
