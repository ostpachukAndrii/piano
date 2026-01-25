# ✅ Project Setup Checklist

**Date:** January 25, 2026  
**Project:** Piano Learning App (Leptos + Tauri)  
**Status:** Documentation Complete → Ready for Phase 1

---

## 📋 What's Been Done

### Documentation
- [x] **DEVELOPMENT_PLAN.md** - 7-phase plan with detailed tasks (20 pages)
- [x] **Project_Specification.md** - Complete requirements & features
- [x] **RESPONSIBILITY_SEPARATION.md** - Clear Backend/Frontend boundaries
- [x] **LEPTOS_FOLDER_STRUCTURE.md** - Complete component hierarchy (30 components)
- [x] **ARCHITECTURE_UNDERSTANDING_SUMMARY.md** - System design & data flows
- [x] **API_DESIGN.md** - All 10 Tauri Commands + 5 events (updated)
- [x] **Music_Notation_Guide.md** - Music theory reference
- [x] **DOCUMENTATION_INDEX.md** - Navigation guide
- [x] **PROJECT_STATUS_SUMMARY.md** - Status overview
- [x] **DOCUMENTATION_ALIGNMENT_AUDIT.md** - Alignment assessment
- [x] **DELETED_ANGULAR_DOCS_REPLACEMENT_PLAN.md** - Migration guide

### Cleanup
- [x] Delete ANGULAR_UI_COMPLETE.md
- [x] Delete ANGULAR_UI_QUICK_REFERENCE.md
- [x] Delete ANGULAR_UI_SETUP.md

### Updates
- [x] Update API_DESIGN.md (REST → Tauri Commands)
- [x] Update ARCHITECTURE_UNDERSTANDING_SUMMARY.md (Angular → Leptos+Tauri)

---

## 🚀 PHASE 1: Architecture Review & Setup

### 1.1 Audit Current Architecture
- [ ] **Read existing crates** (piano-app, piano-cli, piano-domain, piano-lessons, piano-midi)
- [ ] **Document findings** (reusable models, logic, dead code)
- [ ] **Create CURRENT_ARCHITECTURE_ANALYSIS.md**

### 1.2 Create Workspace
- [ ] Create `src-tauri/` directory
- [ ] Create `src-tauri/Cargo.toml` with workspace root
- [ ] Create `src-leptos/` directory
- [ ] Create `src-leptos/Cargo.toml` with Leptos dependencies
- [ ] Set up workspace members in root `Cargo.toml`

### 1.3 Backend Dependencies
- [ ] Add tauri v2.0
- [ ] Add serde + serde_yaml (YAML parsing)
- [ ] Add serde_json
- [ ] Add sqlx + sqlite (database)
- [ ] Add tokio (async runtime)
- [ ] Add midir (MIDI)
- [ ] Add thiserror (error handling)
- [ ] Add uuid (IDs)
- [ ] Add tracing (logging)

### 1.4 Frontend Dependencies
- [ ] Add leptos v0.6
- [ ] Add leptos_meta, leptos_router
- [ ] Add serde + serde_json
- [ ] Add wasm-bindgen
- [ ] Add web-sys (DOM access)
- [ ] Add tauri-sys (Tauri WASM bindings)

### 1.5 Create Directory Structure
- [ ] Create `src-tauri/src/` with commands/, services/, models/, utils/
- [ ] Create `src-leptos/src/` with components/, hooks/, models/, utils/, tauri/
- [ ] Create stub files for all modules

### 1.6 Verification
- [ ] `cargo check` in src-tauri/ ✅
- [ ] `cargo build --target wasm32-unknown-unknown` in src-leptos/ ✅
- [ ] No compilation errors
- [ ] Document any issues

---

## 🟡 PHASE 2: YAML Structure & Data Models

### 2.1 Design YAML Format
- [ ] Review current lesson YAML files (5 files)
- [ ] Define new structure (with hand, accidentals, measures)
- [ ] Document in YAML_STRUCTURE_GUIDE.md
- [ ] Get approval from user

### 2.2 Create Rust Models
- [ ] `models/note.rs` - Note struct with duration, hand, accidental
- [ ] `models/chord.rs` - Chord struct with multiple notes
- [ ] `models/lesson.rs` - Lesson struct with metadata and measures
- [ ] `models/measure.rs` - Measure with bar number and notes
- [ ] Implement Serialize/Deserialize for all
- [ ] Write unit tests for serialization

### 2.3 Migrate Lessons
- [ ] Update `lessons/alphabet.yaml`
- [ ] Update `lessons/simple_chords.yaml`
- [ ] Update `lessons/two_hand_chords.yaml`
- [ ] Update `lessons/happy_birthday.yaml`
- [ ] Update `lessons/example_features.yaml`
- [ ] Validate all files parse correctly

### 2.4 Implement Parser
- [ ] Create `services/lesson_parser.rs`
- [ ] Implement parse_file(path) function
- [ ] Implement validate() function
- [ ] Add error handling
- [ ] Write tests for all lessons

### 2.5 Create Load Command
- [ ] `commands/lesson.rs` - implement load_lesson()
- [ ] Return LessonDTO (serializable)
- [ ] Handle file not found errors
- [ ] Test with all 5 lessons

---

## 🟢 PHASE 3: Simple Display (Notes on Staff)

### 3.1 Build Atoms (12 components)
- [ ] `notehead.rs` - Ellipse SVG (filled/hollow)
- [ ] `stem.rs` - Line SVG (up/down)
- [ ] `clef.rs` - Treble/Bass clef symbols
- [ ] `staff_lines.rs` - 5 horizontal lines
- [ ] `playhead.rs` - Cursor line + marker
- [ ] `accidental.rs` - Sharp/flat/natural symbols
- [ ] `rest.rs` - Rest symbols
- [ ] `ledger_line.rs` - Extended range lines
- [ ] `bar_line.rs` - Measure dividers
- [ ] `time_signature.rs` - 4/4, 3/4, etc
- [ ] `key_signature.rs` - Sharp/flat count
- [ ] `beam.rs` - Eighth note flags

### 3.2 Build Molecules (8 components)
- [ ] `note.rs` - Notehead + stem + accidental
- [ ] `duration_indicator.rs` - Progress bar (colored)
- [ ] `measure.rs` - Notes + bar lines
- [ ] `feedback_badge.rs` - Timing feedback
- [ ] `streak_counter.rs` - Success counter
- [ ] `virtual_keyboard.rs` - 52 white + 36 black keys
- [ ] `metronome_display.rs` - BPM + beat
- [ ] `chord_tooltip.rs` - Chord name (C-E-G)

### 3.3 Build Organisms (6 components)
- [ ] `staff.rs` - Single staff (treble/bass)
- [ ] `grand_staff.rs` - Both staves + brace
- [ ] `timeline_viewer.rs` - Note list
- [ ] `performance_stats.rs` - Accuracy/streak/time
- [ ] `midi_input_display.rs` - Active keys
- [ ] `measure_group.rs` - Multiple measures

### 3.4 Create Container
- [ ] `containers/lesson_stage.rs` - Main game component
- [ ] Hardcode lesson: C D E F G (right hand, treble)
- [ ] Render GrandStaff

### 3.5 Test Display
- [ ] `cargo leptos watch`
- [ ] Open http://localhost:3000
- [ ] See grand staff with 5 notes
- [ ] Verify stem directions
- [ ] Screenshot for verification

---

## 🔵 PHASE 4: Data Integration (YAML → Display)

### 4.1 Backend
- [ ] load_lesson command works
- [ ] list_lessons command implemented
- [ ] Test with all 5 lessons

### 4.2 Frontend
- [ ] Create `hooks/use_lesson.rs`
- [ ] Load lesson dynamically
- [ ] Update lesson_stage.rs

### 4.3 Hand Separation
- [ ] Filter notes by hand
- [ ] Render right→treble, left→bass
- [ ] Test with two_hand_chords lesson

### 4.4 Timeline
- [ ] Implement timeline_viewer.rs
- [ ] Show all notes with progress
- [ ] Highlight current note

### 4.5 Test with All Lessons
- [ ] alphabet.yaml ✅
- [ ] simple_chords.yaml ✅
- [ ] two_hand_chords.yaml ✅
- [ ] happy_birthday.yaml ✅
- [ ] example_features.yaml ✅

---

## 🟣 PHASE 5: MIDI Integration

### 5.1 Backend MIDI
- [ ] `services/midi_input.rs` - midir integration
- [ ] Chord grouping (50ms window)
- [ ] Hand separation (split point MIDI 60)
- [ ] `commands/midi.rs` - get_midi_devices(), start/stop listening
- [ ] Emit midi_chord_detected event

### 5.2 Frontend MIDI
- [ ] Create `hooks/use_midi.rs`
- [ ] Subscribe to midi_chord_detected
- [ ] Update Notehead to show active state
- [ ] Create virtual_keyboard.rs with highlights
- [ ] Create device selection UI

### 5.3 Test MIDI
- [ ] List devices
- [ ] Connect to MIDI keyboard
- [ ] Press note, see highlight
- [ ] Disconnect gracefully

---

## 🟤 PHASE 6: Evaluation & Game Logic

### 6.1 Backend Evaluation
- [ ] `services/evaluation.rs` - pitch/timing/duration checks
- [ ] `commands/evaluation.rs` - check_note() command
- [ ] Score calculation
- [ ] Feedback generation
- [ ] Emit note_evaluated event

### 6.2 Frontend Feedback
- [ ] Create `hooks/use_evaluation.rs`
- [ ] `molecules/feedback_badge.rs` - Green/yellow/red
- [ ] `organisms/performance_stats.rs` - Track accuracy/streak/time
- [ ] Animation (fade in/out)

### 6.3 Game Modes
- [ ] **Waiting Mode** - Step-by-step, show next note
- [ ] **Drill Mode** - Random notes, fast-paced
- [ ] **Tempo Mode** - Metronome, rhythm focus
- [ ] Test all three modes

### 6.4 Test Evaluation
- [ ] Play correct note → Green badge "Perfect!"
- [ ] Play wrong note → Red badge "Wrong"
- [ ] Play late → Yellow badge "Late"
- [ ] Track streak, accuracy, time

---

## 🟠 PHASE 7: Polish & Optimization

### 7.1 Database
- [ ] Create database schema
- [ ] Implement SQLite migrations
- [ ] `services/statistics.rs` - Record sessions
- [ ] Save to database
- [ ] `commands` for history retrieval

### 7.2 Animations
- [ ] Feedback badge fade animation
- [ ] Streak counter sparkle on milestone
- [ ] Playhead smooth movement
- [ ] CSS @keyframes for all

### 7.3 Performance
- [ ] Profile rendering (target: <16ms)
- [ ] Profile MIDI latency (target: <20ms)
- [ ] Optimize bottlenecks
- [ ] Verify targets met

### 7.4 Testing
- [ ] Test all 5 lessons
- [ ] Test all 3 game modes
- [ ] Test all MIDI devices
- [ ] Edge cases (fast playing, device disconnect)
- [ ] Error handling (file not found, MIDI error)

### 7.5 Documentation
- [ ] LEPTOS_SETUP_GUIDE.md
- [ ] TAURI_SETUP_GUIDE.md
- [ ] USER_GUIDE.md
- [ ] API_REFERENCE.md (finalize)

---

## 🎯 Key Milestones

### Milestone 1: First Build (Phase 1)
✅ Both crates compile without errors

### Milestone 2: First Visual (Phase 3)
✅ See notes on screen (C D E F G on treble staff)

### Milestone 3: Dynamic Loading (Phase 4)
✅ Load lessons from YAML, render all 5

### Milestone 4: MIDI Integration (Phase 5)
✅ Press keys on MIDI keyboard, see them light up

### Milestone 5: Game Works (Phase 6)
✅ Play lesson, get feedback, track score

### Milestone 6: Complete (Phase 7)
✅ All features working, database saving, performance optimized

---

## 📊 Effort Estimate

| Phase | Duration | Priority | Effort |
|-------|----------|----------|--------|
| 1. Setup | 3-4 days | 🔴 CRITICAL | Low |
| 2. YAML | 3-4 days | 🔴 CRITICAL | Low |
| 3. Display | 5-6 days | 🟠 IMPORTANT | Medium |
| 4. Integration | 4-5 days | 🟠 IMPORTANT | Medium |
| 5. MIDI | 4-5 days | 🟠 IMPORTANT | Medium |
| 6. Evaluation | 5-6 days | 🟠 IMPORTANT | Medium |
| 7. Polish | 3-4 days | 🟡 NICE-TO-HAVE | Low |

**Total:** 5-6 weeks (27-31 days)  
**Target:** February 28, 2026

---

## 🎓 Learning Path

1. **Read** DEVELOPMENT_PLAN.md (Phase 1 section)
2. **Understand** RESPONSIBILITY_SEPARATION.md
3. **Review** LEPTOS_FOLDER_STRUCTURE.md
4. **Check** API_DESIGN.md (commands you'll need)
5. **Start** Phase 1 tasks (create workspace)
6. **Verify** both crates compile
7. **Move** to Phase 2

---

## ✨ Success Criteria

### Final Product
- ✅ Desktop app (Tauri)
- ✅ Beautiful UI (Leptos + SVG)
- ✅ Real-time MIDI (midir)
- ✅ Multiple lessons (YAML)
- ✅ Three game modes
- ✅ Statistics tracking
- ✅ Database persistence
- ✅ Performance targets (<16ms, <20ms)

### Code Quality
- ✅ Type-safe (Rust throughout)
- ✅ Well-documented
- ✅ Component architecture (atoms→molecules→organisms→containers)
- ✅ Clear responsibility separation
- ✅ No unwanted dependencies
- ✅ Error handling complete

### User Experience
- ✅ Instant visual feedback
- ✅ Smooth animations
- ✅ Clear feedback messages
- ✅ No crashes or errors
- ✅ Works offline
- ✅ Responsive design

---

## 🚀 Ready to Start?

**Next Step:** Read DEVELOPMENT_PLAN.md Phase 1

**Then:** Create src-tauri/ and src-leptos/ workspace

**Goal:** Verify both crates compile by end of day

---

**Created:** January 25, 2026  
**Status:** ✅ READY TO BEGIN DEVELOPMENT  
**Checklist Version:** 1.0
