# Note Timing Feature - Complete Implementation Guide

Date: January 25, 2026

## 🎯 Objective Completed

✅ **Modified API to provide timing (duration) information for all notes and chords**

## 📋 What Changed

### 1. API Specification Updated
**File:** [docs/API_DESIGN.md](API_DESIGN.md)

All note events in API responses now include a `duration_ms` field:

```json
{
  "type": "single",
  "note": 60,
  "note_name": "C4",
  "duration_ms": 500
}
```

**Affected Endpoints:**
- `GET /lessons/{lesson_id}` - Returns all notes with timing
- `GET /sessions/{session_id}` - Current expected event includes timing
- `POST /sessions/{session_id}/events` - Expected event shows required duration
- `WS /ws/sessions/{session_id}` - Progress updates include timing

### 2. Domain Model Already Ready
**File:** [crates/piano-domain/src/note.rs](../crates/piano-domain/src/note.rs)

The Rust domain layer already had complete support:

```rust
pub enum NoteEvent {
    Single {
        note: Note,
        duration_ms: Option<u64>,
    },
    Chord {
        notes: Vec<Note>,
        name: Option<String>,
        hand: Option<Hand>,
        duration_ms: Option<u64>,
    },
}
```

## 📚 Documentation Created

### Summary Documents
1. **[TIMING_FEATURE_SUMMARY.md](TIMING_FEATURE_SUMMARY.md)** - Quick overview
2. **[TIMING_API_FEATURE.md](TIMING_API_FEATURE.md)** - Comprehensive guide
3. **[TIMING_API_EXAMPLES.md](TIMING_API_EXAMPLES.md)** - Code examples

### Updated Files
- **[API_DESIGN.md](API_DESIGN.md)** - All responses now include duration_ms

## 🚀 Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Domain Model | ✅ Complete | NoteEvent has duration_ms fields |
| API Specification | ✅ Complete | API_DESIGN.md updated with timing |
| Documentation | ✅ Complete | 4 comprehensive guides created |
| REST API Server | ⏳ To Do | Ready for implementation |

## 📖 Example API Response

**Request:**
```http
GET /api/v1/lessons/simple_lesson
```

**Response:**
```json
{
  "id": "simple_lesson",
  "name": "Simple Lesson",
  "total_events": 3,
  "note_events": [
    {
      "type": "single",
      "note": 60,
      "note_name": "C4",
      "duration_ms": 500
    },
    {
      "type": "single",
      "note": 64,
      "note_name": "E4",
      "duration_ms": 1000
    },
    {
      "type": "chord",
      "notes": [60, 64, 67],
      "note_names": ["C4", "E4", "G4"],
      "chord_name": "C Major",
      "hand": "both",
      "duration_ms": 800
    }
  ]
}
```

## ✨ Key Features

✅ **Optional Timing** - Duration can be None for flexible-paced notes  
✅ **Comprehensive** - Works for single notes and chords  
✅ **Well-Documented** - API examples and use cases provided  
✅ **Type-Safe** - Strongly typed Rust implementation  
✅ **Ready for Implementation** - Full specification for REST API  

## Summary

✅ **Status:** Feature specification complete and ready for REST API implementation  
✅ **Domain Layer:** Full timing support already in place  
✅ **API Spec:** Updated with comprehensive timing documentation  
✅ **Examples:** Multiple client implementation examples provided  

The API is now fully designed and documented to provide timing information for all notes and chords.
