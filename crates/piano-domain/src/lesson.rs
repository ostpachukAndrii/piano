//! Lesson aggregate root
//!
//! Core lesson entity and trait. A lesson is a sequence of notes to be played.

use crate::{Note, NoteEvent};

/// Unique lesson identifier
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct LessonId(pub String);

/// A lesson - sequence of notes and chords to learn and play
pub trait Lesson: Send + Sync {
    /// Get the lesson identifier
    fn id(&self) -> &LessonId;

    /// Get the lesson name
    fn name(&self) -> &str;

    /// Get the lesson description
    fn description(&self) -> &str;

    /// Get all note events (notes and chords) in this lesson
    fn note_events(&self) -> &[NoteEvent];

    /// Get all notes in this lesson (flattened, for backward compatibility)
    /// This converts all chords to their individual notes
    fn notes(&self) -> Vec<Note> {
        self.note_events()
            .iter()
            .flat_map(|event| event.notes())
            .collect()
    }

    /// Check if the lesson is empty
    fn is_empty(&self) -> bool {
        self.note_events().is_empty()
    }

    /// Get total event count (notes + chords)
    fn total_events(&self) -> usize {
        self.note_events().len()
    }

    /// Get total note count (deprecated - use total_events instead)
    fn total_notes(&self) -> usize {
        self.total_events()
    }
}

/// A concrete lesson implementation
#[derive(Debug, Clone)]
pub struct ConcreteLesson {
    id: LessonId,
    name: String,
    description: String,
    note_events: Vec<NoteEvent>,
}

impl ConcreteLesson {
    /// Create a new lesson from note events
    pub fn new(
        id: impl Into<String>,
        name: String,
        description: String,
        note_events: Vec<NoteEvent>,
    ) -> Self {
        ConcreteLesson {
            id: LessonId(id.into()),
            name,
            description,
            note_events,
        }
    }

    /// Create a new lesson from simple notes (backward compatibility)
    pub fn from_notes(
        id: impl Into<String>,
        name: String,
        description: String,
        notes: Vec<Note>,
    ) -> Self {
        let note_events = notes.into_iter().map(|note| NoteEvent::Single {
            note,
            duration_ms: None,
        }).collect();
        ConcreteLesson {
            id: LessonId(id.into()),
            name,
            description,
            note_events,
        }
    }
}

impl Lesson for ConcreteLesson {
    fn id(&self) -> &LessonId {
        &self.id
    }

    fn name(&self) -> &str {
        &self.name
    }

    fn description(&self) -> &str {
        &self.description
    }

    fn note_events(&self) -> &[NoteEvent] {
        &self.note_events
    }
}
