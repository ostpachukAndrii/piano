use crate::commands::lesson::LessonMode;
use crate::models::{GlobalSettings, Measure, Note};
use serde_yaml;
use std::fs;
use std::path::Path;

/// Represents a lesson loaded from YAML
#[derive(Debug, Clone)]
pub struct YamlLesson {
    pub title: String,
    pub description: Option<String>,
    pub mode: Option<LessonMode>,
    pub settings: GlobalSettings,
    pub measures: Vec<Measure>,
}

impl YamlLesson {
    /// Load a lesson from a YAML file
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self, String> {
        let content =
            fs::read_to_string(path).map_err(|e| format!("Failed to read YAML file: {}", e))?;

        Self::from_str(&content)
    }

    /// Parse a lesson from YAML string
    pub fn from_str(yaml_content: &str) -> Result<Self, String> {
        let value: serde_yaml::Value = serde_yaml::from_str(yaml_content)
            .map_err(|e| format!("Failed to parse YAML: {}", e))?;

        // Extract title
        let title = value["title"]
            .as_str()
            .ok_or("Missing 'title' field")?
            .to_string();

        // Extract description (optional)
        let description = value["description"].as_str().map(|s| s.to_string());

        // Extract mode (optional) - determines lesson behavior
        let mode = value["mode"].as_str().and_then(|s| parse_lesson_mode(s));

        // Extract settings
        let settings = parse_settings(&value["settings"])?;

        // Extract measures
        let measures = parse_measures(&value["measures"])?;

        Ok(YamlLesson {
            title,
            description,
            mode,
            settings,
            measures,
        })
    }

    /// Get total duration in beats
    pub fn total_beats(&self) -> f32 {
        self.measures
            .iter()
            .flat_map(|m| &m.notes)
            .map(|n| n.duration_beats())
            .sum()
    }

    /// Get total duration in seconds based on tempo
    pub fn total_seconds(&self) -> f32 {
        let beats = self.total_beats();
        let bpm = self.settings.tempo as f32;
        beats / bpm * 60.0
    }
}

fn parse_settings(settings_value: &serde_yaml::Value) -> Result<GlobalSettings, String> {
    let tempo = settings_value["tempo"]
        .as_u64()
        .ok_or("Missing or invalid 'tempo' in settings")? as u32;

    let time_signature = settings_value["time_signature"]
        .as_str()
        .ok_or("Missing 'time_signature' in settings")?
        .to_string();

    let key_signature = settings_value["key_signature"]
        .as_str()
        .ok_or("Missing 'key_signature' in settings")?
        .to_string();

    Ok(GlobalSettings {
        tempo,
        time_signature,
        key_signature,
    })
}

/// Parse lesson mode from string
fn parse_lesson_mode(mode_str: &str) -> Option<LessonMode> {
    match mode_str {
        "study_left_hand_no_timing" => Some(LessonMode::StudyLeftHandNoTiming),
        "study_right_hand_no_timing" => Some(LessonMode::StudyRightHandNoTiming),
        "study_two_hands_no_timing" => Some(LessonMode::StudyTwoHandsNoTiming),
        "play_left_hand_timing" => Some(LessonMode::PlayLeftHandTiming),
        "play_right_hand_timing" => Some(LessonMode::PlayRightHandTiming),
        "play_two_hands_timing" => Some(LessonMode::PlayTwoHandsTiming),
        _ => None,
    }
}

fn parse_measures(measures_value: &serde_yaml::Value) -> Result<Vec<Measure>, String> {
    let measures_seq = measures_value
        .as_sequence()
        .ok_or("'measures' must be a list")?;

    let mut measures = Vec::new();

    for (index, measure_value) in measures_seq.iter().enumerate() {
        let number = (index + 1) as u32;
        let notes = parse_notes(&measure_value["notes"])?;

        measures.push(Measure { number, notes });
    }

    Ok(measures)
}

fn parse_notes(notes_value: &serde_yaml::Value) -> Result<Vec<Note>, String> {
    let notes_seq = notes_value.as_sequence().ok_or("'notes' must be a list")?;

    let mut notes = Vec::new();

    for note_value in notes_seq.iter() {
        let note = parse_note(note_value)?;
        notes.push(note);
    }

    Ok(notes)
}

fn parse_note(note_value: &serde_yaml::Value) -> Result<Note, String> {
    // Check if it's a rest
    if let Some(duration) = note_value["rest"].as_f64() {
        let hand = note_value["hand"].as_str().unwrap_or("right").to_string();
        return Ok(Note::Rest {
            duration_beats: duration as f32,
            hand,
            start_beat: None, // YAML doesn't track beat positions
        });
    }

    // Check if it's a chord (multiple MIDI notes)
    if let Some(midi_seq) = note_value["midi"].as_sequence() {
        let midi_set: Vec<u8> = midi_seq
            .iter()
            .filter_map(|v| v.as_u64().map(|m| m as u8))
            .collect();

        if !midi_set.is_empty() {
            let duration_beats = note_value["duration"]
                .as_f64()
                .ok_or("Missing 'duration' for chord")? as f32;

            let hand = note_value["hand"].as_str().unwrap_or("right").to_string();

            let chord_name = note_value["chord"].as_str().map(|s| s.to_string());

            return Ok(Note::Chord {
                midi_set,
                duration_beats,
                hand,
                chord_name,
                start_beat: None, // YAML doesn't track beat positions
                tie_start: false,
                tie_stop: false,
                staccato: false,
                dot: false,
            });
        }
    }

    // Single note
    let midi = note_value["midi"]
        .as_u64()
        .ok_or("Missing or invalid 'midi' value")? as u8;

    let duration_beats = note_value["duration"]
        .as_f64()
        .ok_or("Missing 'duration' for note")? as f32;

    let hand = note_value["hand"].as_str().unwrap_or("right").to_string();

    let accidental = note_value["accidental"].as_str().map(|s| s.to_string());

    Ok(Note::Single {
        midi,
        duration_beats,
        hand,
        accidental,
        start_beat: None, // YAML doesn't track beat positions
        tie_start: false,
        tie_stop: false,
        staccato: false,
        dot: false,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_lesson() {
        let yaml = r#"
title: Test Lesson
description: A test lesson
settings:
  tempo: 120
  time_signature: "4/4"
  key_signature: "C major"
measures:
  - notes:
      - midi: 60
        duration: 1.0
        hand: right
  - notes:
      - midi: 64
        duration: 1.0
        hand: right
"#;

        let lesson = YamlLesson::from_str(yaml).unwrap();
        assert_eq!(lesson.title, "Test Lesson");
        assert_eq!(lesson.measures.len(), 2);
        assert_eq!(lesson.settings.tempo, 120);
    }

    #[test]
    fn test_parse_chord() {
        let yaml = r#"
title: Chord Lesson
description: A lesson with chords
settings:
  tempo: 120
  time_signature: "4/4"
  key_signature: "C major"
measures:
  - notes:
      - midi: [60, 64, 67]
        duration: 1.0
        hand: right
        chord: C Major
"#;

        let lesson = YamlLesson::from_str(yaml).unwrap();
        assert_eq!(lesson.measures.len(), 1);
        let note = &lesson.measures[0].notes[0];
        assert_eq!(note.midi_notes(), vec![60, 64, 67]);
    }

    #[test]
    fn test_parse_rest() {
        let yaml = r#"
title: Rest Lesson
settings:
  tempo: 120
  time_signature: "4/4"
  key_signature: "C major"
measures:
  - notes:
      - rest: 1.0
"#;

        let lesson = YamlLesson::from_str(yaml).unwrap();
        let note = &lesson.measures[0].notes[0];
        assert!(note.is_rest());
    }

    #[test]
    fn test_total_duration() {
        let yaml = r#"
title: Duration Test
settings:
  tempo: 120
  time_signature: "4/4"
  key_signature: "C major"
measures:
  - notes:
      - midi: 60
        duration: 2.0
  - notes:
      - midi: 64
        duration: 2.0
"#;

        let lesson = YamlLesson::from_str(yaml).unwrap();
        assert_eq!(lesson.total_beats(), 4.0);
        assert_eq!(lesson.total_seconds(), 2.0); // 4 beats / 120 BPM * 60
    }
}
