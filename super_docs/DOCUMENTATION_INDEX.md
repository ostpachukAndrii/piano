# 📚 Documentation Index - Piano Learning App (Leptos + Tauri)

**Last Updated:** January 25, 2026  
**Tech Stack:** Rust (Tauri v2) + Rust/WASM (Leptos)

---

## 🎯 Quick Navigation

### **Getting Started (READ FIRST)**
1. [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) ← **START HERE**
   - 7-phase plan with detailed tasks
   - Timeline: 5-6 weeks
   - What to build when

2. [Project_Specification.md](Project_Specification.md)
   - Complete requirements
   - Tech stack details
   - Game modes explained

---

### **Architecture & Design**
3. [RESPONSIBILITY_SEPARATION.md](RESPONSIBILITY_SEPARATION.md)
   - What does Backend do? (MIDI, evaluation, persistence)
   - What does Frontend do? (rendering, display, animations)
   - Clear boundaries
   - Decision matrix

4. [LEPTOS_FOLDER_STRUCTURE.md](LEPTOS_FOLDER_STRUCTURE.md)
   - Complete folder organization
   - 12 atoms, 8 molecules, 6 organisms, 4 containers
   - Line count estimates
   - Component responsibilities

5. [ARCHITECTURE_UNDERSTANDING_SUMMARY.md](ARCHITECTURE_UNDERSTANDING_SUMMARY.md)
   - High-level system design
   - Data flow diagrams
   - Tauri Commands explained
   - Event emission pattern

---

### **API Reference**
6. [API_DESIGN.md](../docs/API_DESIGN.md)
   - All 10 Tauri Commands with signatures
   - All 5 events that backend emits
   - Request/response examples
   - Error handling

---

### **Music Notation**
7. [Music_Notation_Guide.md](Music_Notation_Guide.md)
   - Grand staff anatomy (treble/bass)
   - Note positions on each staff
   - Stem direction rules
   - Duration symbols

---

### **Deleted & Replaced**
8. [DELETED_ANGULAR_DOCS_REPLACEMENT_PLAN.md](DELETED_ANGULAR_DOCS_REPLACEMENT_PLAN.md)
   - What we deleted (3 Angular docs)
   - What to create instead
   - 10 new guides needed

---

### **Alignment Audit**
9. [DOCUMENTATION_ALIGNMENT_AUDIT.md](DOCUMENTATION_ALIGNMENT_AUDIT.md)
   - Which docs need updating
   - Priority order
   - Alignment checklist

---

## 📖 Reading Order by Role

### **If you're a Backend Developer (Rust/Tauri)**
1. Project_Specification.md (requirements)
2. RESPONSIBILITY_SEPARATION.md (what you own)
3. API_DESIGN.md (commands you'll implement)
4. DEVELOPMENT_PLAN.md Phases 1-2 (setup & YAML)
5. DEVELOPMENT_PLAN.md Phases 5-6 (MIDI & evaluation)

### **If you're a Frontend Developer (Leptos/WASM)**
1. Project_Specification.md (requirements)
2. RESPONSIBILITY_SEPARATION.md (what you own)
3. LEPTOS_FOLDER_STRUCTURE.md (component hierarchy)
4. API_DESIGN.md (commands to invoke)
5. DEVELOPMENT_PLAN.md Phases 3-4 (rendering & data)
6. Music_Notation_Guide.md (staff positions)

### **If you're Project Manager/Architect**
1. DEVELOPMENT_PLAN.md (timeline & phases)
2. Project_Specification.md (requirements)
3. RESPONSIBILITY_SEPARATION.md (boundaries)
4. ARCHITECTURE_UNDERSTANDING_SUMMARY.md (system design)

### **If you want to Start Coding**
1. DEVELOPMENT_PLAN.md (Phase 1-2)
2. LEPTOS_FOLDER_STRUCTURE.md (folder layout)
3. API_DESIGN.md (command signatures)
4. Start Phase 1: Create workspace

---

## 📋 Document Summary

| Document | Purpose | Pages | Priority |
|----------|---------|-------|----------|
| **DEVELOPMENT_PLAN.md** | Step-by-step build plan | 20 | 🔴 CRITICAL |
| **Project_Specification.md** | Requirements & design | 8 | 🔴 CRITICAL |
| **RESPONSIBILITY_SEPARATION.md** | Who does what | 10 | 🔴 CRITICAL |
| **LEPTOS_FOLDER_STRUCTURE.md** | Component layout | 12 | 🟠 IMPORTANT |
| **ARCHITECTURE_UNDERSTANDING_SUMMARY.md** | System design | 8 | 🟠 IMPORTANT |
| **API_DESIGN.md** | Commands & events | 15 | 🟠 IMPORTANT |
| **Music_Notation_Guide.md** | Music theory | 6 | 🟡 REFERENCE |
| **DELETED_ANGULAR_DOCS_REPLACEMENT_PLAN.md** | Migration guide | 5 | 🟡 REFERENCE |
| **DOCUMENTATION_ALIGNMENT_AUDIT.md** | Audit results | 5 | 🟡 REFERENCE |

---

## 🔄 Workflow: From Design to Code

```
1. Read DEVELOPMENT_PLAN.md
   ↓
2. Understand current state (Phase 1)
   ↓
3. Review relevant architecture docs
   ↓
4. Check API_DESIGN.md for required commands/events
   ↓
5. Follow LEPTOS_FOLDER_STRUCTURE.md for folder layout
   ↓
6. Implement task from DEVELOPMENT_PLAN.md
   ↓
7. Test & move to next task
```

---

## 🎯 Key Concepts (Quick Reference)

### **Tauri Commands** (Backend → Frontend Communication)
```rust
// Frontend calls backend
invoke("load_lesson", { "lesson_id": "alphabet" })

// Backend responds
#[tauri::command]
pub async fn load_lesson(lesson_id: String) -> Result<Lesson, String>
```

### **Events** (Backend → Frontend Notifications)
```rust
// Backend emits
app_handle.emit_all("note_evaluated", result)

// Frontend listens
listen_to_event("note_evaluated", |data| { /* handle */ })
```

### **Responsibility Boundaries**
```
BACKEND (Tauri/Rust):        FRONTEND (Leptos/WASM):
✅ MIDI hardware             ✅ SVG rendering
✅ File I/O (YAML)           ✅ User interactions
✅ Evaluation logic          ✅ State display (Signals)
✅ Database (SQLite)         ✅ Animations
✅ Statistics                ✅ Layout
```

### **Component Hierarchy** (Leptos)
```
Atoms (12)       → Pure rendering, no logic
  ↓
Molecules (8)    → Lightweight compositions
  ↓
Organisms (6)    → Layout & coordination
  ↓
Containers (4)   → Business logic, state
```

---

## 📂 File Locations

```
super_docs/                           ← Architecture & planning
├─ DEVELOPMENT_PLAN.md                (Phase breakdown)
├─ Project_Specification.md           (Requirements)
├─ RESPONSIBILITY_SEPARATION.md       (Boundaries)
├─ LEPTOS_FOLDER_STRUCTURE.md         (Component layout)
├─ ARCHITECTURE_UNDERSTANDING_SUMMARY.md
├─ Music_Notation_Guide.md
├─ DELETED_ANGULAR_DOCS_REPLACEMENT_PLAN.md
├─ DOCUMENTATION_ALIGNMENT_AUDIT.md
└─ DOCUMENTATION_INDEX.md             (this file)

docs/                                 ← Feature docs
├─ API_DESIGN.md                      (Commands & events)
├─ ARCHITECTURE_UNDERSTANDING_SUMMARY.md (System design)
├─ LESSON_TIMELINE_COMPLETE.md        (⏳ Needs update)
├─ TIMING_COMPLETE_GUIDE.md           (⏳ Needs update)
└─ ... (other feature docs)

lessons/                              ← Lesson files
├─ alphabet.yaml
├─ simple_chords.yaml
├─ two_hand_chords.yaml
├─ happy_birthday.yaml
└─ example_features.yaml

crates/                               ← Existing Rust code
├─ piano-app/
├─ piano-cli/
├─ piano-domain/
├─ piano-lessons/
└─ piano-midi/

src-tauri/                            ← New backend (to create)
src-leptos/                           ← New frontend (to create)
```

---

## 🚀 Getting Started (Next Steps)

**Step 1: Review**
- [ ] Read DEVELOPMENT_PLAN.md (Phase 1)
- [ ] Understand current Rust codebase (in crates/)
- [ ] Review Project_Specification.md requirements

**Step 2: Plan**
- [ ] Create src-tauri/ and src-leptos/ workspace
- [ ] List Cargo dependencies
- [ ] Design folder structure

**Step 3: Start Phase 1**
- [ ] Create workspace Cargo.toml
- [ ] Create backend skeleton (commands, services, models)
- [ ] Create frontend skeleton (components)
- [ ] Verify both compile

**Step 4: Continue to Phase 2**
- [ ] Review current YAML lesson files
- [ ] Design new YAML structure
- [ ] Implement YAML parser

**Step 5: Phase 3 (First Visual Test)**
- [ ] Build atoms (notehead, stem, clef, staff_lines)
- [ ] Build molecules (note, measure)
- [ ] Build organisms (staff, grand_staff)
- [ ] Render hardcoded lesson
- [ ] See notes on screen ✅

---

## ❓ Common Questions

**Q: Where do I start?**  
A: Read DEVELOPMENT_PLAN.md, Phase 1 "Architecture Review & Setup"

**Q: What should the Backend do?**  
A: See RESPONSIBILITY_SEPARATION.md - MIDI, evaluation, persistence, commands

**Q: What should the Frontend do?**  
A: See RESPONSIBILITY_SEPARATION.md - rendering, state display, animations

**Q: How do frontend and backend talk?**  
A: Via Tauri Commands (see API_DESIGN.md)

**Q: What's the component structure?**  
A: Atoms → Molecules → Organisms → Containers (see LEPTOS_FOLDER_STRUCTURE.md)

**Q: How are notes positioned on the staff?**  
A: See Music_Notation_Guide.md and staff_position utility functions

**Q: When will it be done?**  
A: 5-6 weeks following DEVELOPMENT_PLAN.md (Feb 28, 2026 target)

---

## 📞 Document Dependencies

```
DEVELOPMENT_PLAN.md (Master Plan)
├─ Depends on: Project_Specification.md
├─ Depends on: RESPONSIBILITY_SEPARATION.md
├─ Depends on: LEPTOS_FOLDER_STRUCTURE.md
└─ References: API_DESIGN.md

RESPONSIBILITY_SEPARATION.md (Boundaries)
├─ Depends on: Project_Specification.md
└─ References: API_DESIGN.md

LEPTOS_FOLDER_STRUCTURE.md (Layout)
├─ Depends on: Project_Specification.md
└─ References: RESPONSIBILITY_SEPARATION.md

API_DESIGN.md (Commands)
├─ Depends on: Project_Specification.md
└─ References: RESPONSIBILITY_SEPARATION.md
```

---

## ✅ Status

**Documentation Complete:** ✅ YES  
**Architecture Defined:** ✅ YES  
**Ready to Code:** ✅ YES  

**Next:** Start Phase 1 of DEVELOPMENT_PLAN.md

---

**Created:** January 25, 2026  
**Version:** 1.0  
**Maintainer:** Development Team
