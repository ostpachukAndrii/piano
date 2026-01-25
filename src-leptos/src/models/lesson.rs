// Frontend Lesson Model - Mirrors backend LessonDTO
use crate::models::note::Note;
use serde::{Deserialize, Serialize};

/// A measure containing notes
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Measure {
    pub number: u32,
    pub notes: Vec<Note>,
}

/// Global settings for a lesson
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct LessonSettings {
    pub tempo: u32,
    pub time_signature: String,
    pub key_signature: String,
}

/// A complete lesson
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Lesson {
    pub title: String,
    pub description: Option<String>,
    pub tempo: u32,
    pub time_signature: String,
    pub key_signature: String,
    pub total_beats: f32,
    pub total_seconds: f32,
    pub measures: Vec<Measure>,
}

impl Lesson {
    pub fn total_notes(&self) -> usize {
        self.measures.iter().map(|m| m.notes.len()).sum()
    }

    pub fn notes_flat(&self) -> Vec<&Note> {
        self.measures.iter().flat_map(|m| &m.notes).collect()
    }
}
