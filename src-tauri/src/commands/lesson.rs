// Lesson commands - Load and manage lessons
// Responsibility: Backend only (see RESPONSIBILITY_SEPARATION.md)
// Commands:
//   - load_lesson(lesson_id: String) -> Result<LessonDTO, String>
//   - list_lessons() -> Result<Vec<LessonMetadata>, String>

use crate::lesson_parser::YamlLesson;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Get the lessons directory path
/// In dev: uses the workspace lessons/ folder
/// In production: would use bundled resources
fn get_lessons_dir() -> PathBuf {
    // Try multiple locations
    let candidates = [
        // Relative to workspace root (dev mode)
        PathBuf::from("lessons"),
        // From src-tauri location
        PathBuf::from("../lessons"),
        // Absolute path for dev (Windows)
        PathBuf::from(r"G:\Rust run\roland\lessons"),
    ];

    for path in &candidates {
        if path.exists() {
            return path.clone();
        }
    }

    // Default fallback
    PathBuf::from("lessons")
}

/// Lesson mode - determines evaluation behavior
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum LessonMode {
    // Study modes (no timing)
    StudyLeftHandNoTiming,
    #[default]
    StudyRightHandNoTiming,
    StudyTwoHandsNoTiming,
    // Play modes (with timing)
    PlayLeftHandTiming,
    PlayRightHandTiming,
    PlayTwoHandsTiming,
}

/// Response DTO for a loaded lesson
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LessonDTO {
    pub title: String,
    pub description: Option<String>,
    #[serde(default)]
    pub mode: LessonMode,
    pub tempo: u32,
    pub time_signature: String,
    pub key_signature: String,
    pub total_beats: f32,
    pub total_seconds: f32,
    pub measures: Vec<MeasureDTO>,
}

/// Response DTO for a measure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MeasureDTO {
    pub number: u32,
    pub notes: Vec<NoteDTO>,
}

/// Response DTO for a note
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum NoteDTO {
    Single {
        midi: u8,
        duration: f32,
        hand: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        accidental: Option<String>,
    },
    Chord {
        midi: Vec<u8>,
        duration: f32,
        hand: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        chord: Option<String>,
    },
    Rest {
        duration: f32,
    },
}

/// Lesson metadata for listing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LessonMetadata {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    #[serde(default)]
    pub mode: LessonMode,
    pub duration_seconds: f32,
}

/// Load a lesson by ID (filename without extension)
#[tauri::command]
pub fn load_lesson(lesson_id: String) -> Result<LessonDTO, String> {
    // Construct path to lesson file
    let lessons_dir = get_lessons_dir();
    let lesson_path = lessons_dir.join(format!("{}.yaml", lesson_id));

    // Parse the YAML file
    let yaml_lesson = YamlLesson::from_file(&lesson_path)?;

    // Convert to DTO - clone all fields to avoid ownership issues
    let total_beats = yaml_lesson.total_beats();
    let total_seconds = yaml_lesson.total_seconds();
    let measures = yaml_lesson
        .measures
        .iter()
        .map(|m| MeasureDTO {
            number: m.number,
            notes: m.notes.iter().map(|n| note_to_dto(n)).collect(),
        })
        .collect();

    // Parse mode from YAML settings or use default
    let mode = yaml_lesson.mode.clone().unwrap_or_default();

    Ok(LessonDTO {
        title: yaml_lesson.title.clone(),
        description: yaml_lesson.description.clone(),
        mode,
        tempo: yaml_lesson.settings.tempo,
        time_signature: yaml_lesson.settings.time_signature.clone(),
        key_signature: yaml_lesson.settings.key_signature.clone(),
        total_beats,
        total_seconds,
        measures,
    })
}

/// List all available lessons
#[tauri::command]
pub fn list_lessons() -> Result<Vec<LessonMetadata>, String> {
    let lessons_dir = get_lessons_dir();

    if !lessons_dir.exists() {
        return Err("Lessons directory not found".to_string());
    }

    let mut lessons = Vec::new();

    // Iterate through all YAML files in the lessons directory
    for entry in std::fs::read_dir(&lessons_dir)
        .map_err(|e| format!("Failed to read lessons directory: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        // Only process .yaml files
        if path.extension().and_then(|s| s.to_str()) == Some("yaml") {
            // Try to parse the lesson
            if let Ok(yaml_lesson) = YamlLesson::from_file(&path) {
                let id = path
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("unknown")
                    .to_string();

                let duration_seconds = yaml_lesson.total_seconds();
                let mode = yaml_lesson.mode.clone().unwrap_or_default();
                lessons.push(LessonMetadata {
                    id,
                    title: yaml_lesson.title.clone(),
                    description: yaml_lesson.description.clone(),
                    mode,
                    duration_seconds,
                });
            }
        }
    }

    // Sort by title
    lessons.sort_by(|a, b| a.title.cmp(&b.title));

    Ok(lessons)
}

/// Helper function to convert a Note to NoteDTO
fn note_to_dto(note: &crate::models::Note) -> NoteDTO {
    use crate::models::Note;

    match note {
        Note::Single {
            midi,
            duration_beats,
            hand,
            accidental,
        } => NoteDTO::Single {
            midi: *midi,
            duration: *duration_beats,
            hand: hand.clone(),
            accidental: accidental.clone(),
        },
        Note::Chord {
            midi_set,
            duration_beats,
            hand,
            chord_name,
        } => NoteDTO::Chord {
            midi: midi_set.clone(),
            duration: *duration_beats,
            hand: hand.clone(),
            chord: chord_name.clone(),
        },
        Note::Rest { duration_beats } => NoteDTO::Rest {
            duration: *duration_beats,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_note_to_dto_single() {
        let note = crate::models::Note::Single {
            midi: 60,
            duration_beats: 1.0,
            hand: "right".to_string(),
            accidental: None,
        };
        let dto = note_to_dto(&note);
        if let NoteDTO::Single { midi, .. } = dto {
            assert_eq!(midi, 60);
        } else {
            panic!("Expected Single variant");
        }
    }

    #[test]
    fn test_note_to_dto_chord() {
        let note = crate::models::Note::Chord {
            midi_set: vec![60, 64, 67],
            duration_beats: 2.0,
            hand: "left".to_string(),
            chord_name: Some("C Major".to_string()),
        };
        let dto = note_to_dto(&note);
        if let NoteDTO::Chord { midi, .. } = dto {
            assert_eq!(midi, vec![60, 64, 67]);
        } else {
            panic!("Expected Chord variant");
        }
    }

    #[test]
    fn test_note_to_dto_rest() {
        let note = crate::models::Note::Rest {
            duration_beats: 1.0,
        };
        let dto = note_to_dto(&note);
        if let NoteDTO::Rest { duration } = dto {
            assert_eq!(duration, 1.0);
        } else {
            panic!("Expected Rest variant");
        }
    }
}
