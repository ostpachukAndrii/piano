// Lesson commands - Load and manage lessons
// Responsibility: Backend only (see RESPONSIBILITY_SEPARATION.md)
// Commands:
//   - load_lesson(lesson_id: String) -> Result<LessonDTO, String>
//   - list_lessons() -> Result<Vec<LessonMetadata>, String>

use crate::lesson_parser::YamlLesson;
use crate::models::Note;
use crate::mxl_parser::MxlLesson;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Get the lessons directory path from configuration
fn get_lessons_dir() -> PathBuf {
    crate::config::get_config().get_lessons_dir()
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

/// Helper for skip_serializing_if on bool fields
fn is_false(v: &bool) -> bool {
    !*v
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
        #[serde(skip_serializing_if = "Option::is_none")]
        start_beat: Option<f32>,
        #[serde(default, skip_serializing_if = "is_false")]
        tie_start: bool,
        #[serde(default, skip_serializing_if = "is_false")]
        tie_stop: bool,
        #[serde(default, skip_serializing_if = "is_false")]
        staccato: bool,
        #[serde(default, skip_serializing_if = "is_false")]
        dot: bool,
    },
    Chord {
        midi: Vec<u8>,
        duration: f32,
        hand: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        chord: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        start_beat: Option<f32>,
        #[serde(default, skip_serializing_if = "is_false")]
        tie_start: bool,
        #[serde(default, skip_serializing_if = "is_false")]
        tie_stop: bool,
        #[serde(default, skip_serializing_if = "is_false")]
        staccato: bool,
        #[serde(default, skip_serializing_if = "is_false")]
        dot: bool,
    },
    Rest {
        duration: f32,
        hand: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        start_beat: Option<f32>,
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
    let lessons_dir = get_lessons_dir();

    // Try YAML first
    let yaml_path = lessons_dir.join(format!("{}.yaml", lesson_id));
    if yaml_path.exists() {
        let yaml_lesson = YamlLesson::from_file(&yaml_path)?;
        return Ok(yaml_lesson_to_dto(yaml_lesson));
    }

    // Try MXL (compressed MusicXML)
    let mxl_path = lessons_dir.join(format!("{}.mxl", lesson_id));
    if mxl_path.exists() {
        let mxl_lesson = MxlLesson::from_file(&mxl_path)?;
        return Ok(mxl_lesson_to_dto(mxl_lesson));
    }

    // Try uncompressed MusicXML
    let xml_path = lessons_dir.join(format!("{}.musicxml", lesson_id));
    if xml_path.exists() {
        let content = std::fs::read_to_string(&xml_path)
            .map_err(|e| format!("Failed to read MusicXML file: {}", e))?;
        let mxl_lesson = MxlLesson::from_xml(&content, &xml_path)?;
        return Ok(mxl_lesson_to_dto(mxl_lesson));
    }

    Err(format!(
        "Lesson not found: {} (tried .yaml, .mxl, .musicxml)",
        lesson_id
    ))
}

/// List all available lessons
#[tauri::command]
pub fn list_lessons() -> Result<Vec<LessonMetadata>, String> {
    // Log current working directory for debugging
    if let Ok(cwd) = std::env::current_dir() {
        tracing::info!("Current working directory: {:?}", cwd);
    }

    let lessons_dir = get_lessons_dir();
    tracing::info!("Looking for lessons in: {:?}", lessons_dir);

    if !lessons_dir.exists() {
        let err_msg = format!("Lessons directory not found at: {:?}", lessons_dir);
        tracing::error!("{}", err_msg);
        return Err(err_msg);
    }

    tracing::info!("Lessons directory exists, reading files...");

    let mut lessons = Vec::new();

    // Iterate through all lesson files in the lessons directory
    for entry in std::fs::read_dir(&lessons_dir)
        .map_err(|e| format!("Failed to read lessons directory: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        let ext = path.extension().and_then(|s| s.to_str());

        match ext {
            // Process YAML files
            Some("yaml") => {
                tracing::debug!("Processing YAML file: {:?}", path);
                match YamlLesson::from_file(&path) {
                    Ok(yaml_lesson) => {
                        let id = path
                            .file_stem()
                            .and_then(|s| s.to_str())
                            .unwrap_or("unknown")
                            .to_string();

                        tracing::debug!("Successfully loaded lesson: {}", yaml_lesson.title);
                        lessons.push(LessonMetadata {
                            id,
                            title: yaml_lesson.title.clone(),
                            description: yaml_lesson.description.clone(),
                            mode: yaml_lesson.mode.clone().unwrap_or_default(),
                            duration_seconds: yaml_lesson.total_seconds(),
                        });
                    }
                    Err(e) => {
                        tracing::warn!("Failed to load YAML lesson from {:?}: {}", path, e);
                    }
                }
            }
            // Process MXL files (compressed MusicXML)
            Some("mxl") => {
                tracing::debug!("Processing MXL file: {:?}", path);
                match MxlLesson::from_file(&path) {
                    Ok(mxl_lesson) => {
                        let id = path
                            .file_stem()
                            .and_then(|s| s.to_str())
                            .unwrap_or("unknown")
                            .to_string();

                        tracing::debug!("Successfully loaded MXL lesson: {}", mxl_lesson.title);
                        lessons.push(LessonMetadata {
                            id,
                            title: mxl_lesson.title.clone(),
                            description: mxl_lesson.description.clone(),
                            mode: mxl_lesson.mode.clone().unwrap_or_default(),
                            duration_seconds: mxl_lesson.total_seconds(),
                        });
                    }
                    Err(e) => {
                        tracing::warn!("Failed to load MXL lesson from {:?}: {}", path, e);
                    }
                }
            }
            // Process uncompressed MusicXML files
            Some("musicxml") => {
                tracing::debug!("Processing MusicXML file: {:?}", path);
                match std::fs::read_to_string(&path) {
                    Ok(content) => match MxlLesson::from_xml(&content, &path) {
                        Ok(mxl_lesson) => {
                            let id = path
                                .file_stem()
                                .and_then(|s| s.to_str())
                                .unwrap_or("unknown")
                                .to_string();

                            tracing::debug!(
                                "Successfully loaded MusicXML lesson: {}",
                                mxl_lesson.title
                            );
                            lessons.push(LessonMetadata {
                                id,
                                title: mxl_lesson.title.clone(),
                                description: mxl_lesson.description.clone(),
                                mode: mxl_lesson.mode.clone().unwrap_or_default(),
                                duration_seconds: mxl_lesson.total_seconds(),
                            });
                        }
                        Err(e) => {
                            tracing::warn!("Failed to parse MusicXML from {:?}: {}", path, e);
                        }
                    },
                    Err(e) => {
                        tracing::warn!("Failed to read MusicXML file {:?}: {}", path, e);
                    }
                }
            }
            _ => {
                // Skip non-lesson files
            }
        }
    }

    // Sort by title
    lessons.sort_by(|a, b| a.title.cmp(&b.title));

    tracing::info!("Found {} valid lesson files", lessons.len());
    Ok(lessons)
}

/// Convert YamlLesson to LessonDTO
fn yaml_lesson_to_dto(yaml_lesson: YamlLesson) -> LessonDTO {
    let tempo = yaml_lesson.settings.tempo;
    let time_signature = yaml_lesson.settings.time_signature.clone();
    let key_signature = yaml_lesson.settings.key_signature.clone();
    let total_beats = yaml_lesson.total_beats();
    let total_seconds = yaml_lesson.total_seconds();

    // Convert measures
    let measures: Vec<MeasureDTO> = yaml_lesson
        .measures
        .iter()
        .map(|measure| MeasureDTO {
            number: measure.number,
            notes: measure
                .notes
                .iter()
                .map(|note| note_to_dto(note))
                .collect(),
        })
        .collect();

    LessonDTO {
        title: yaml_lesson.title,
        description: yaml_lesson.description,
        mode: yaml_lesson.mode.unwrap_or_default(),
        tempo,
        time_signature,
        key_signature,
        total_beats,
        total_seconds,
        measures,
    }
}

/// Convert Note to NoteDTO
fn note_to_dto(note: &Note) -> NoteDTO {
    match note {
        Note::Single {
            midi,
            duration_beats,
            hand,
            accidental,
            start_beat,
            tie_start,
            tie_stop,
            staccato,
            dot,
        } => NoteDTO::Single {
            midi: *midi,
            duration: *duration_beats,
            hand: hand.clone(),
            accidental: accidental.clone(),
            start_beat: *start_beat,
            tie_start: *tie_start,
            tie_stop: *tie_stop,
            staccato: *staccato,
            dot: *dot,
        },
        Note::Chord {
            midi_set,
            duration_beats,
            hand,
            chord_name,
            start_beat,
            tie_start,
            tie_stop,
            staccato,
            dot,
        } => NoteDTO::Chord {
            midi: midi_set.clone(),
            duration: *duration_beats,
            hand: hand.clone(),
            chord: chord_name.clone(),
            start_beat: *start_beat,
            tie_start: *tie_start,
            tie_stop: *tie_stop,
            staccato: *staccato,
            dot: *dot,
        },
        Note::Rest { duration_beats, hand, start_beat } => NoteDTO::Rest {
            duration: *duration_beats,
            hand: hand.clone(),
            start_beat: *start_beat,
        },
    }
}

/// Convert MxlLesson to LessonDTO
fn mxl_lesson_to_dto(mxl_lesson: MxlLesson) -> LessonDTO {
    let tempo = mxl_lesson.settings.tempo;
    let time_signature = mxl_lesson.settings.time_signature.clone();
    let key_signature = mxl_lesson.settings.key_signature.clone();
    let total_beats = mxl_lesson.total_beats();
    let total_seconds = mxl_lesson.total_seconds();

    // Convert measures
    let measures: Vec<MeasureDTO> = mxl_lesson
        .measures
        .iter()
        .map(|measure| MeasureDTO {
            number: measure.number,
            notes: measure
                .notes
                .iter()
                .map(|note| note_to_dto(note))
                .collect(),
        })
        .collect();

    LessonDTO {
        title: mxl_lesson.title,
        description: mxl_lesson.description,
        mode: mxl_lesson.mode.unwrap_or_default(),
        tempo,
        time_signature,
        key_signature,
        total_beats,
        total_seconds,
        measures,
    }
}

