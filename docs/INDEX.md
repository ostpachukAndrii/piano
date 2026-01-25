# 📚 Documentation Index

**Last Updated:** January 24, 2026  
**Status:** ✅ Current

---

## Quick Navigation

### 🚀 Getting Started
- **[README.md](../README.md)** - Main project entry point, installation, quick start

### 🏗️ Architecture & Design
- **[DDD Architecture](DDD_ARCHITECTURE.md)** - Domain-Driven Design, layer separation
- **[Project Structure](PROJECT_STRUCTURE.md)** - Crate organization, file layout
- **[Architecture Diagram](ARCHITECTURE_DIAGRAM.md)** - Visual layering and data flow

### 📖 User Guides
- **[Lesson System](GUIDES/LESSON_SYSTEM.md)** - How the lesson framework works
- **[Lesson Usage](GUIDES/LESSON_USAGE.md)** - How to use lessons, add new ones
- **[YAML Lesson Structure](GUIDES/YAML_LESSON_STRUCTURE.md)** - MVP+Soon lesson format with chords, rests, timing
- **[Chord Support](GUIDES/CHORD_SUPPORT.md)** - NEW: Learn to create and play chord-based lessons
- **[Lesson Settings](GUIDES/LESSON_SETTINGS.md)** - Configurable lesson behaviors
- **[Auto Device Selection](GUIDES/AUTO_SELECT.md)** - Automatic MIDI device handling

### 🔍 Reference & Testing
- **[Testing Guide](TESTING.md)** - How to run tests, test coverage
- **[Implementation Notes](IMPLEMENTATION_COMPLETE.md)** - What has been implemented

### 📝 Changes & Cleanup
- **[Project Cleanup Summary](CHANGES/PROJECT_CLEANUP_JAN2026.md)** - Architecture cleanup details
- **[Lesson Loading Fix](CHANGES/LESSON_LOADING_FIX_JAN2026.md)** - Fixed lesson discovery issue

---

## Documentation by Type

### Architecture (Design & Structure)
These documents explain how the system is organized and why:

| Document | Purpose | Audience |
|----------|---------|----------|
| [DDD Architecture](ARCHITECTURE/DDD_ARCHITECTURE.md) | Domain-Driven Design principles | Architects, Maintainers |
| [Architecture Analysis](ARCHITECTURE/ARCHITECTURE_ANALYSIS_JAN2026.md) | Deep dive into design and extensibility | Architects, Future Developers |
| [Project Structure](ARCHITECTURE/PROJECT_STRUCTURE.md) | Crate organization & files | All developers |
| [Architecture Diagram](ARCHITECTURE/ARCHITECTURE_DIAGRAM.md) | Visual layers & flow | Visual learners |

### Guides (How to Use)
Step-by-step instructions and usage patterns:

| Document | Purpose | Audience |
|----------|---------|----------|
| [Lesson System](LESSON_SYSTEM.md) | How lessons work internally | Developers |
| [Lesson Usage](LESSON_USAGE.md) | How to add lessons | Content creators |
| [Lesson Settings](LESSON_SETTINGS.md) | Configure lesson behavior | Users |
| [Auto Selection](AUTO_SELECT.md) | Device auto-selection feature | Users & maintainers |

### Reference (Technical Details)
Detailed technical information:

| Document | Purpose | Audience |
|----------|---------|----------|
| [Testing](TESTING.md) | Test running & coverage | QA, Developers |
| [Implementation](IMPLEMENTATION_COMPLETE.md) | What's implemented | Project managers |

### Changes (History & Progress)
What has changed and what was done:

| Document | Purpose | Audience |
|----------|---------|----------|
| [Project Cleanup](PROJECT_CLEANUP_JAN2026.md) | Cleanup details | Developers, Reviewers |

---

## How to Find What You're Looking For

### "I want to add a new lesson"
→ Read: [Lesson Usage](LESSON_USAGE.md)

### "I need to understand the architecture"
→ Read: [Project Structure](PROJECT_STRUCTURE.md) then [DDD Architecture](DDD_ARCHITECTURE.md)

### "I want to contribute code"
→ Read: [Project Structure](PROJECT_STRUCTURE.md) and [Testing](TESTING.md)

### "I want to run tests"
→ Read: [Testing Guide](TESTING.md)

### "I want to understand the cleanup work"
→ Read: [Project Cleanup Summary](PROJECT_CLEANUP_JAN2026.md)

### "I want a visual overview"
→ Read: [Architecture Diagram](ARCHITECTURE_DIAGRAM.md)

---

## Documentation Structure

```
g:\Rust run\roland\
├── README.md                        ← START HERE (root only)
├── COPILOT_INSTRUCTIONS.md          ← How to manage docs
│
└── docs/
    ├── INDEX.md                     ← This file
    │
    ├── ARCHITECTURE/
    │   ├── DDD_ARCHITECTURE.md
    │   ├── PROJECT_STRUCTURE.md     ← NEW: Complete structure guide
    │   └── ARCHITECTURE_DIAGRAM.md
    │
    ├── GUIDES/
    │   ├── LESSON_SYSTEM.md
    │   ├── LESSON_USAGE.md
    │   └── AUTO_SELECT.md
    │
    ├── REFERENCE/
    │   ├── TESTING.md
    │   └── IMPLEMENTATION_COMPLETE.md
    │
    └── CHANGES/
        ├── PROJECT_CLEANUP_JAN2026.md
        └── LESSON_LOADING_FIX_JAN2026.md    ← NEW: Lesson discovery fix
```

---

## Key Principles for This Documentation

1. **Single Source of Truth** - No duplicate information across files
2. **Cross-linking** - Related documents link to each other
3. **Audience-Focused** - Each document knows its audience
4. **Discoverable** - INDEX.md is the navigation hub
5. **Up-to-date** - Regular reviews to keep current

---

## Contributing to Documentation

When you find this documentation:

### ✅ Good:
- Adding new document to appropriate subfolder
- Updating outdated information
- Adding cross-links to related docs
- Fixing typos/formatting

### ❌ Avoid:
- Creating duplicate documents
- Leaving files in root (except README.md)
- Removing links without checking references
- Adding temporary/draft docs

---

## Questions?

- **How do I organize a new document?** → See [COPILOT_INSTRUCTIONS.md](../COPILOT_INSTRUCTIONS.md)
- **Where should this file go?** → Look at similar documents in this index
- **Is this documentation still needed?** → Check if it's linked from here

---

**For documentation management guidelines, see [COPILOT_INSTRUCTIONS.md](../COPILOT_INSTRUCTIONS.md)**
