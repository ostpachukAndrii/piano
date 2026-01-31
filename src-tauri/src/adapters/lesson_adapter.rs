// Lesson Adapter
// Single responsibility: Convert between piano-lessons crate types and Tauri DTOs
//
// This adapter bridges the domain model (piano-lessons) with the presentation layer (Tauri)
// Allows us to reuse the well-tested piano-lessons crate instead of duplicating code

use crate::commands::lesson::{LessonDTO, LessonMetadata, LessonMode, MeasureDTO, NoteDTO};
use piano_lessons::LessonConfig;
use std::path::Path;

/// Adapter for converting between piano-lessons and Tauri DTOs
pub struct LessonAdapter;

impl LessonAdapter {
    /// Load a lesson from a YAML file and convert to DTO
    pub fn load_from_file<P: AsRef<Path>>(path: P) -> Result<LessonDTO, String> {
        // Read and parse YAML
        let content = std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read lesson file: {}", e))?;

        Self::load_from_yaml(&content)
    }

    /// Parse YAML string and convert to DTO
    pub fn load_from_yaml(yaml_content: &str) -> Result<LessonDTO, String> {
        // Parse using piano-lessons crate
        let config: LessonConfig = serde_yaml::from_str(yaml_content)
            .map_err(|e| format!("Failed to parse YAML: {}", e))?;

        config
            .validate()
            .map_err(|e| format!("Invalid lesson: {}", e))?;

        Ok(Self::config_to_dto(config))
    }

    /// Convert LessonConfig to LessonDTO
    pub fn config_to_dto(config: LessonConfig) -> LessonDTO {
        let tempo = config.tempo.unwrap_or(120) as u32;
        let time_signature = config
            .time_signature
            .clone()
            .unwrap_or_else(|| "4/4".to_string());
        let key_signature = config
            .key_signature
            .clone()
            .unwrap_or_else(|| "C major".to_string());

        // Calculate total duration
        let total_beats = Self::calculate_total_beats(&config);
        let total_seconds = Self::calculate_total_seconds(total_beats, tempo);

        // Convert measures
        let measures = Self::convert_measures(&config);

        // Parse mode (default to study right hand no timing)
        let mode = LessonMode::default(); // TODO: Could extract from config if needed

        LessonDTO {
            title: config.name,
            description: Some(config.description),
            mode,
            tempo,
            time_signature,
            key_signature,
            total_beats,
            total_seconds,
            measures,
        }
    }

    /// Convert LessonConfig to LessonMetadata (for listing)
    pub fn config_to_metadata(id: String, config: LessonConfig) -> LessonMetadata {
        let tempo = config.tempo.unwrap_or(120) as u32;
        let total_beats = Self::calculate_total_beats(&config);
        let duration_seconds = Self::calculate_total_seconds(total_beats, tempo);

        LessonMetadata {
            id,
            title: config.name,
            description: Some(config.description),
            mode: LessonMode::default(),
            duration_seconds,
        }
    }

    /// Calculate total beats from all measures
    fn calculate_total_beats(config: &LessonConfig) -> f32 {
        // If using old format (simple notes), assume 1 beat each
        if !config.notes.is_empty() {
            return config.notes.len() as f32;
        }

        // Sum up durations from all measures
        let mut total = 0.0;
        for measure in &config.measures {
            for note in &measure.notes {
                total += Self::get_note_duration(note);
            }
        }
        total
    }

    /// Calculate total seconds from beats and tempo
    fn calculate_total_seconds(total_beats: f32, tempo: u32) -> f32 {
        // Formula: seconds = (beats / BPM) * 60
        (total_beats / tempo as f32) * 60.0
    }

    /// Get duration from a note event
    fn get_note_duration(note: &piano_lessons::lesson_config::NoteEvent) -> f32 {
        use piano_lessons::lesson_config::NoteEvent;

        match note {
            NoteEvent::SingleNote { duration, .. } => *duration,
            NoteEvent::ChordReference { duration, .. } => *duration,
            NoteEvent::Chord { duration, .. } => *duration,
            NoteEvent::Rest { duration, .. } => *duration,
        }
    }

    /// Convert measures from LessonConfig to DTO format
    fn convert_measures(config: &LessonConfig) -> Vec<MeasureDTO> {
        // If using old format (simple notes), create a single measure
        if !config.notes.is_empty() {
            let notes: Vec<NoteDTO> = config
                .notes
                .iter()
                .map(|&midi| NoteDTO::Single {
                    midi,
                    duration: 1.0, // Default to quarter note
                    hand: "right".to_string(),
                    accidental: None,
                    start_beat: None,
                })
                .collect();

            return vec![MeasureDTO { number: 1, notes }];
        }

        // Convert measures from new format
        config
            .measures
            .iter()
            .map(|measure| MeasureDTO {
                number: measure.number,
                notes: measure
                    .notes
                    .iter()
                    .filter_map(|note| Self::convert_note_event(note))
                    .collect(),
            })
            .collect()
    }

    /// Convert a single note event to DTO
    fn convert_note_event(note: &piano_lessons::lesson_config::NoteEvent) -> Option<NoteDTO> {
        use piano_lessons::lesson_config::NoteEvent;

        match note {
            NoteEvent::SingleNote { pitch, duration, .. } => Some(NoteDTO::Single {
                midi: *pitch,
                duration: *duration,
                hand: "right".to_string(), // TODO: Could be extracted if available
                accidental: None,
                start_beat: None,
            }),
            NoteEvent::ChordReference { chord, duration, hand, .. } => {
                // Look up chord in standard library
                if let Some(chord_def) = piano_lessons::get_chord(chord) {
                    Some(NoteDTO::Chord {
                        midi: chord_def.pitches.to_vec(),
                        duration: *duration,
                        hand: hand.clone().unwrap_or_else(|| "right".to_string()),
                        chord: Some(chord_def.name.to_string()),
                        start_beat: None,
                    })
                } else {
                    None // Skip unknown chords
                }
            }
            NoteEvent::Chord {
                pitches,
                name,
                duration,
                hand,
                ..
            } => Some(NoteDTO::Chord {
                midi: pitches.clone(),
                duration: *duration,
                hand: hand.clone().unwrap_or_else(|| "right".to_string()),
                chord: Some(name.clone()),
                start_beat: None,
            }),
            NoteEvent::Rest { duration, .. } => Some(NoteDTO::Rest {
                duration: *duration,
                hand: "right".to_string(), // Default hand for rests from piano_lessons
                start_beat: None,
            }),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_load_simple_lesson() {
        let yaml = r#"
name: Test Lesson
description: A simple test
notes: [60, 62, 64]
"#;

        let result = LessonAdapter::load_from_yaml(yaml);
        assert!(result.is_ok());

        let lesson = result.unwrap();
        assert_eq!(lesson.title, "Test Lesson");
        assert_eq!(lesson.measures.len(), 1);
        assert_eq!(lesson.measures[0].notes.len(), 3);
    }

    #[test]
    fn test_load_lesson_with_measures() {
        let yaml = r#"
name: Measure Lesson
description: Lesson with measures
tempo: 120
time_signature: "4/4"
key_signature: "C major"
measures:
  - number: 1
    notes:
      - pitch: 60
        duration: 1.0
      - pitch: 62
        duration: 1.0
"#;

        let result = LessonAdapter::load_from_yaml(yaml);
        assert!(result.is_ok());

        let lesson = result.unwrap();
        assert_eq!(lesson.title, "Measure Lesson");
        assert_eq!(lesson.tempo, 120);
        assert_eq!(lesson.time_signature, "4/4");
        assert_eq!(lesson.measures.len(), 1);
        assert_eq!(lesson.total_beats, 2.0);
    }

    #[test]
    fn test_load_lesson_with_chord() {
        let yaml = r#"
name: Chord Lesson
description: Lesson with chords
tempo: 120
measures:
  - number: 1
    notes:
      - pitches: [60, 64, 67]
        name: "C Major"
        duration: 2.0
"#;

        let result = LessonAdapter::load_from_yaml(yaml);
        assert!(result.is_ok());

        let lesson = result.unwrap();
        assert_eq!(lesson.measures[0].notes.len(), 1);

        match &lesson.measures[0].notes[0] {
            NoteDTO::Chord { midi, chord, .. } => {
                assert_eq!(midi, &vec![60, 64, 67]);
                assert_eq!(chord, &Some("C Major".to_string()));
            }
            _ => panic!("Expected chord"),
        }
    }

    #[test]
    fn test_calculate_total_duration() {
        let yaml = r#"
name: Duration Test
description: Test duration calculation
tempo: 120
measures:
  - number: 1
    notes:
      - pitch: 60
        duration: 2.0
      - pitch: 62
        duration: 2.0
"#;

        let lesson = LessonAdapter::load_from_yaml(yaml).unwrap();
        assert_eq!(lesson.total_beats, 4.0);
        assert_eq!(lesson.total_seconds, 2.0); // 4 beats at 120 BPM = 2 seconds
    }

    #[test]
    fn test_config_to_metadata() {
        let config = LessonConfig {
            name: "Test".to_string(),
            description: "Test description".to_string(),
            composer: None,
            difficulty: None,
            tempo: Some(120),
            time_signature: Some("4/4".to_string()),
            key_signature: Some("C major".to_string()),
            notes: vec![60, 62, 64],
            measures: vec![],
        };

        let metadata = LessonAdapter::config_to_metadata("test-id".to_string(), config);
        assert_eq!(metadata.id, "test-id");
        assert_eq!(metadata.title, "Test");
        assert_eq!(metadata.duration_seconds, 1.5); // 3 notes at 120 BPM
    }
}
