// Integration Tests - Lesson Adapter
//
// Tests the full flow of lesson loading and conversion

use piano_tauri_backend::adapters::LessonAdapter;

#[path = "../fixtures/mod.rs"]
mod fixtures;
use fixtures::*;

#[test]
fn test_convert_simple_c_scale() {
    let lesson_config = simple_c_scale();
    let dto = LessonAdapter::config_to_dto(lesson_config);

    assert_eq!(dto.title, "C Major Scale");
    assert_eq!(dto.tempo, 120);
    assert_eq!(dto.time_signature, "4/4");
    assert_eq!(dto.key_signature, "C major");
    assert_eq!(dto.total_beats, 8.0); // 8 notes, 1 beat each
    assert_eq!(dto.total_seconds, 4.0); // 8 beats at 120 BPM = 4 seconds
    assert_eq!(dto.measures.len(), 1);
    assert_eq!(dto.measures[0].notes.len(), 8);
}

#[test]
fn test_convert_lesson_with_measures() {
    let lesson_config = lesson_with_measures();
    let dto = LessonAdapter::config_to_dto(lesson_config);

    assert_eq!(dto.title, "Measure Lesson");
    assert_eq!(dto.tempo, 100);
    assert_eq!(dto.measures.len(), 2);
    assert_eq!(dto.measures[0].number, 1);
    assert_eq!(dto.measures[0].notes.len(), 4);
    assert_eq!(dto.measures[1].number, 2);
    assert_eq!(dto.measures[1].notes.len(), 4);
    assert_eq!(dto.total_beats, 8.0);
}

#[test]
fn test_convert_chord_progression() {
    let lesson_config = chord_progression();
    let dto = LessonAdapter::config_to_dto(lesson_config);

    assert_eq!(dto.title, "Basic Chord Progression");
    assert_eq!(dto.tempo, 80);
    assert_eq!(dto.measures.len(), 4);

    // Check that chords were converted
    for measure in &dto.measures {
        assert_eq!(measure.notes.len(), 1);
        // Each measure has one chord with 4 beats duration
    }

    assert_eq!(dto.total_beats, 16.0); // 4 measures × 4 beats
}

#[test]
fn test_convert_inline_chord() {
    let lesson_config = lesson_with_inline_chord();
    let dto = LessonAdapter::config_to_dto(lesson_config);

    assert_eq!(dto.measures.len(), 1);
    assert_eq!(dto.measures[0].notes.len(), 1);

    // Check that inline chord was converted correctly
    match &dto.measures[0].notes[0] {
        piano_tauri_backend::commands::lesson::NoteDTO::Chord {
            midi,
            duration,
            chord,
            ..
        } => {
            assert_eq!(midi, &vec![60, 64, 67]);
            assert_eq!(*duration, 4.0);
            assert_eq!(chord, &Some("C Major Inline".to_string()));
        }
        _ => panic!("Expected chord"),
    }
}

#[test]
fn test_convert_fast_tempo() {
    let lesson_config = fast_tempo_lesson();
    let dto = LessonAdapter::config_to_dto(lesson_config);

    assert_eq!(dto.tempo, 200);
    assert_eq!(dto.total_beats, 4.0);
    // At 200 BPM, 4 beats = 1.2 seconds
    assert!((dto.total_seconds - 1.2).abs() < 0.01);
}

#[test]
fn test_convert_slow_tempo() {
    let lesson_config = slow_tempo_lesson();
    let dto = LessonAdapter::config_to_dto(lesson_config);

    assert_eq!(dto.tempo, 60);
    assert_eq!(dto.total_beats, 4.0);
    // At 60 BPM, 4 beats = 4 seconds
    assert_eq!(dto.total_seconds, 4.0);
}

#[test]
fn test_invalid_empty_lesson() {
    let lesson_config = invalid_empty_lesson();

    // Validation should fail
    let result = lesson_config.validate();
    assert!(result.is_err());
}

#[test]
fn test_invalid_no_name() {
    let lesson_config = invalid_no_name();

    // Validation should fail
    let result = lesson_config.validate();
    assert!(result.is_err());
    assert!(result
        .unwrap_err()
        .contains("Lesson name cannot be empty"));
}

#[test]
fn test_load_from_yaml_simple() {
    let yaml = r#"
name: Test Lesson
description: A test lesson
tempo: 120
time_signature: "4/4"
key_signature: "C major"
notes: [60, 62, 64]
"#;

    let result = LessonAdapter::load_from_yaml(yaml);
    assert!(result.is_ok());

    let dto = result.unwrap();
    assert_eq!(dto.title, "Test Lesson");
    assert_eq!(dto.tempo, 120);
    assert_eq!(dto.measures.len(), 1);
    assert_eq!(dto.measures[0].notes.len(), 3);
}

#[test]
fn test_load_from_yaml_with_chords() {
    let yaml = r#"
name: Chord Test
description: Test with chords
tempo: 100
measures:
  - number: 1
    notes:
      - chord: "C Major"
        duration: 2.0
"#;

    let result = LessonAdapter::load_from_yaml(yaml);
    assert!(result.is_ok());

    let dto = result.unwrap();
    assert_eq!(dto.measures.len(), 1);
}

#[test]
fn test_load_from_yaml_invalid() {
    let yaml = "invalid: yaml: [[[";

    let result = LessonAdapter::load_from_yaml(yaml);
    assert!(result.is_err());
}

#[test]
fn test_tempo_defaults_to_120() {
    let yaml = r#"
name: No Tempo
description: Should default to 120
notes: [60, 62, 64]
"#;

    let dto = LessonAdapter::load_from_yaml(yaml).unwrap();
    assert_eq!(dto.tempo, 120);
}

#[test]
fn test_time_signature_defaults() {
    let yaml = r#"
name: No Time Sig
description: Should default
notes: [60]
"#;

    let dto = LessonAdapter::load_from_yaml(yaml).unwrap();
    assert_eq!(dto.time_signature, "4/4");
}

#[test]
fn test_key_signature_defaults() {
    let yaml = r#"
name: No Key Sig
description: Should default
notes: [60]
"#;

    let dto = LessonAdapter::load_from_yaml(yaml).unwrap();
    assert_eq!(dto.key_signature, "C major");
}
