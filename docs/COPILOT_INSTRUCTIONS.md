# 📋 Copilot Documentation Management Instructions

This document provides guidelines for how Copilot should manage project documentation.

---

## Documentation Organization

### Root Directory (g:\Rust run\roland\)
**Only these files should be in the root:**
- `README.md` - Main project entry point, quick start guide
- `Cargo.toml` - Workspace configuration
- Source code (`src/`, `crates/`)

**Nothing else** - all other documentation goes to `docs/`

### Docs Directory (g:\Rust run\roland\docs/)

All `.md` files except `README.md` should be in this folder, organized by type:

```
docs/
├── ARCHITECTURE/
│   ├── DDD_ARCHITECTURE.md
│   ├── PROJECT_STRUCTURE.md
│   └── ARCHITECTURE_DIAGRAM.md
│
├── GUIDES/
│   ├── LESSON_SYSTEM.md
│   ├── LESSON_USAGE.md
│   └── AUTO_SELECT.md
│
├── REFERENCE/
│   ├── TESTING.md
│   ├── IMPLEMENTATION_NOTES.md
│   └── API_REFERENCE.md (future)
│
└── INDEX.md (start here for docs navigation)
```

---

## When Creating New Documentation

### ✅ DO:
1. **Save in `docs/` folder**, not root
2. **Create appropriate subfolder** (ARCHITECTURE, GUIDES, REFERENCE, etc.)
3. **Add link in `docs/INDEX.md`** pointing to new document
4. **Keep filename descriptive** (e.g., `LESSON_SYSTEM.md`)
5. **Use UPPERCASE for filenames** (convention: `DOCUMENT_NAME.md`)

### ❌ DON'T:
1. Don't save .md files in root (except README.md)
2. Don't create standalone files without adding to INDEX.md
3. Don't use unclear filenames (e.g., `doc1.md`, `temp.md`)
4. Don't create redundant documentation
5. Don't forget to cross-link related documents

---

## Documentation Types & Examples

### 1. Architecture Documentation
**Purpose:** Explain system design, layers, dependencies  
**Location:** `docs/ARCHITECTURE/`  
**Examples:**
- DDD_ARCHITECTURE.md - Domain-Driven Design layering
- PROJECT_STRUCTURE.md - Crate and file organization
- ARCHITECTURE_DIAGRAM.md - Visual architecture representation

### 2. User Guides
**Purpose:** How to use features, add lessons, run application  
**Location:** `docs/GUIDES/`  
**Examples:**
- LESSON_SYSTEM.md - How the lesson system works
- LESSON_USAGE.md - How to use lessons
- AUTO_SELECT.md - Auto-selection feature

### 3. Reference Documentation
**Purpose:** Technical details, APIs, testing info  
**Location:** `docs/REFERENCE/`  
**Examples:**
- TESTING.md - How to run tests
- IMPLEMENTATION_NOTES.md - Technical implementation details

### 4. Quick Start
**Purpose:** Main entry point for users  
**Location:** Root as `README.md` ONLY  
**Content:** Installation, quick start, links to docs

---

## How to Manage Existing Documentation

### Consolidate Redundant Files
**If you find multiple files covering similar topics:**
1. Identify which is most comprehensive
2. Merge others into it
3. Delete redundant copies
4. Update INDEX.md with links

### Example (Cleanup Article):
Instead of having:
- CLEANUP_SUMMARY.md (360 lines)
- ARCHITECTURE_CLEANUP.md (215 lines)
- COMPLETE_CHANGELOG.md (280 lines)
- VERIFICATION_REPORT.md (270 lines)

**Create:**
- `docs/CHANGES/CLEANUP_SUMMARY.md` (comprehensive, merged from all four)
- Link from INDEX.md with table of contents

---

## Documentation Index Pattern

Create `docs/INDEX.md` with structure like:

```markdown
# Documentation Index 📚

## Architecture
- [DDD Architecture](ARCHITECTURE/DDD_ARCHITECTURE.md)
- [Project Structure](ARCHITECTURE/PROJECT_STRUCTURE.md)
- [Layering & Dependencies](ARCHITECTURE/ARCHITECTURE_DIAGRAM.md)

## Guides
- [Lesson System](GUIDES/LESSON_SYSTEM.md)
- [How to Add Lessons](GUIDES/LESSON_USAGE.md)
- [Auto Device Selection](GUIDES/AUTO_SELECT.md)

## Reference
- [Testing](REFERENCE/TESTING.md)
- [Implementation Notes](REFERENCE/IMPLEMENTATION_NOTES.md)

## Quick Links
- [README.md](../README.md) - Main entry point
- Source Code: [crates/](../crates/)
```

---

## Naming Conventions

### ✅ Good File Names:
- `DDD_ARCHITECTURE.md` - Clear, descriptive, UPPERCASE
- `LESSON_SYSTEM.md` - Easy to understand at a glance
- `PROJECT_STRUCTURE.md` - Purpose is obvious
- `AUTO_SELECT.md` - Concise but complete

### ❌ Bad File Names:
- `doc.md` - Too vague
- `arch.md` - Unclear abbreviation
- `lesson stuff.md` - Unprofessional spacing
- `TODO.md` - Vague, should be `TODO_2024.md` with date

---

## Before Saving a New Document

Ask yourself:

1. **Is this document needed?**
   - Does it provide new, unique information?
   - Or does it duplicate existing documentation?
   
2. **Where should it go?**
   - Root (README.md only) OR
   - docs/ARCHITECTURE/ OR
   - docs/GUIDES/ OR
   - docs/REFERENCE/ OR
   - New subfolder (if unique topic)?

3. **Is the filename clear?**
   - Would another developer understand its purpose?
   - Is it in UPPERCASE_WITH_UNDERSCORES format?

4. **Will it be linked?**
   - Is it added to docs/INDEX.md?
   - Are related documents linked to/from it?

---

## Review Checklist for Existing Documentation

When reviewing current documentation:

- [ ] Is this document in root? (Should it be in docs/?
- [ ] Does it duplicate another document?
- [ ] Is it properly linked from INDEX.md?
- [ ] Is the content still accurate?
- [ ] Is it referenced anywhere else?
- [ ] Should it be archived or deleted?

---

## Special Cases

### Documentation to Keep in Root:
- `README.md` - Main entry point for project
- `Cargo.toml` - Workspace configuration
- `Cargo.lock` - Dependency lock file

### Documentation to Remove:
- Temporary/draft files (*.draft.md)
- Obsolete/outdated information
- Redundant copies of same information
- Test documentation (move to docs/REFERENCE/TESTING.md)

### Documentation to Archive:
If you have old documentation that's no longer needed but want to preserve:
1. Create `docs/ARCHIVE/` folder
2. Move outdated files there
3. Add `DEPRECATED` prefix: `docs/ARCHIVE/DEPRECATED_OLD_SYSTEM.md`
4. Add note at top: "⚠️ This document is outdated. See [CURRENT_DOC.md](...)"

---

## Example: How to Handle Cleanup Documentation

**Current state:** 4-5 files about cleanup (redundant)

**Action:**
1. Create: `docs/CHANGES/PROJECT_CLEANUP_2026.md`
2. Merge content from:
   - CLEANUP_SUMMARY.md
   - ARCHITECTURE_CLEANUP.md
   - COMPLETE_CHANGELOG.md
   - VERIFICATION_REPORT.md
3. Delete old files from root
4. Add to `docs/INDEX.md`:
   ```markdown
   - [Project Cleanup (Jan 2026)](CHANGES/PROJECT_CLEANUP_2026.md)
   ```

---

## Template for New Documentation

When creating new documentation, follow this template:

```markdown
# [Document Title] 📚

**Last Updated:** [Date]  
**Status:** ✅ Current / ⚠️ Draft / ❌ Deprecated  
**Related Docs:** [Link to related docs]

---

## Overview
[Brief description of what this document covers]

---

## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)

---

## Section 1
[Content]

---

## See Also
- [Related Document](../other.md)
- [Another Document](../path/to/doc.md)
```

---

## Quick Command Reference

### Move files to docs folder:
```bash
cd g:\Rust run\roland
# Move to docs
mv ARCHITECTURE_DIAGRAM.md docs/ARCHITECTURE/
mv LESSON_SYSTEM.md docs/GUIDES/
```

### Create new doc subfolder:
```bash
mkdir docs/GUIDES
```

### Remove old doc:
```bash
rm docs/ARCHIVE/OLD_FILE.md
```

---

## Questions for Clarification

When uncertain about where to put documentation:

1. **Is it about system design?** → `docs/ARCHITECTURE/`
2. **Is it a user guide?** → `docs/GUIDES/`
3. **Is it technical reference?** → `docs/REFERENCE/`
4. **Is it about changes/history?** → `docs/CHANGES/`
5. **Is it brand new topic?** → Create new subfolder

---

## This Document Itself

- **Location:** `docs/COPILOT_INSTRUCTIONS.md` (or in root for easy access)
- **Purpose:** Guide for documentation management
- **Review:** Quarterly, update as standards evolve
- **Owner:** Project maintainers

---

**Following these guidelines keeps documentation organized, findable, and maintainable.** 📋
