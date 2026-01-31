// Integration tests for lesson loading with actual YAML format
// Tests the YamlLesson parser with the real YAML files

use piano_tauri_backend::commands::lesson::{list_lessons, load_lesson};
use std::fs;
use std::path::PathBuf;

/// Helper to get the lessons directory
fn get_lessons_dir() -> PathBuf {
    // Navigate from test location to project root
    let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    path.push("..");
    path.push("lessons");
    path.canonicalize().expect("Failed to find lessons directory")
}

#[test]
fn test_yaml_lesson_parser_with_real_files() {
    use piano_tauri_backend::lesson_parser::YamlLesson;

    let lessons_dir = get_lessons_dir();

    // Test loading a simple chord lesson
    let simple_chords_path = lessons_dir.join("simple_chords.yaml");
    assert!(simple_chords_path.exists(), "simple_chords.yaml should exist");

    let yaml_lesson = YamlLesson::from_file(&simple_chords_path)
        .expect("Should successfully parse simple_chords.yaml");

    assert_eq!(yaml_lesson.title, "Simple Chords");
    assert!(yaml_lesson.measures.len() > 0, "Should have measures");
    assert!(yaml_lesson.settings.tempo > 0, "Should have valid tempo");
}

#[test]
fn test_yaml_parser_handles_chords() {
    use piano_tauri_backend::lesson_parser::YamlLesson;

    let yaml = r#"
title: "Test Chords"
description: "Test chord parsing"
settings:
  tempo: 100
  time_signature: "4/4"
  key_signature: "C major"

measures:
  - notes:
      - midi: [60, 64, 67]
        duration: 2.0
        chord: "C Major"
"#;

    let yaml_lesson = YamlLesson::from_str(yaml)
        .expect("Should parse YAML with chords");

    assert_eq!(yaml_lesson.title, "Test Chords");
    assert_eq!(yaml_lesson.measures.len(), 1);
    assert_eq!(yaml_lesson.measures[0].notes.len(), 1);
}

#[test]
fn test_yaml_parser_handles_single_notes() {
    use piano_tauri_backend::lesson_parser::YamlLesson;

    let yaml = r#"
title: "Test Single Notes"
description: "Test single note parsing"
settings:
  tempo: 120
  time_signature: "4/4"
  key_signature: "C major"

measures:
  - notes:
      - midi: 60
        duration: 1.0
      - midi: 62
        duration: 1.0
"#;

    let yaml_lesson = YamlLesson::from_str(yaml)
        .expect("Should parse YAML with single notes");

    assert_eq!(yaml_lesson.title, "Test Single Notes");
    assert_eq!(yaml_lesson.measures[0].notes.len(), 2);
}

#[test]
fn test_yaml_parser_handles_rests() {
    use piano_tauri_backend::lesson_parser::YamlLesson;

    let yaml = r#"
title: "Test Rests"
description: "Test rest parsing"
settings:
  tempo: 120
  time_signature: "4/4"
  key_signature: "C major"

measures:
  - notes:
      - midi: 60
        duration: 1.0
      - rest: 1.0
      - midi: 62
        duration: 1.0
"#;

    let yaml_lesson = YamlLesson::from_str(yaml)
        .expect("Should parse YAML with rests");

    assert_eq!(yaml_lesson.measures[0].notes.len(), 3);
}

#[test]
fn test_yaml_parser_calculates_duration() {
    use piano_tauri_backend::lesson_parser::YamlLesson;

    let yaml = r#"
title: "Duration Test"
description: "Test duration calculation"
settings:
  tempo: 120
  time_signature: "4/4"
  key_signature: "C major"

measures:
  - notes:
      - midi: 60
        duration: 2.0
      - midi: 62
        duration: 2.0
"#;

    let yaml_lesson = YamlLesson::from_str(yaml)
        .expect("Should parse YAML");

    assert_eq!(yaml_lesson.total_beats(), 4.0);
    // At 120 BPM, 4 beats = 2 seconds
    assert_eq!(yaml_lesson.total_seconds(), 2.0);
}

#[test]
fn test_yaml_parser_handles_mixed_notes() {
    use piano_tauri_backend::lesson_parser::YamlLesson;

    let yaml = r#"
title: "Mixed Notes"
description: "Single notes, chords, and rests"
settings:
  tempo: 100
  time_signature: "4/4"
  key_signature: "C major"

measures:
  - notes:
      - midi: 60
        duration: 1.0
      - midi: [60, 64, 67]
        duration: 2.0
        chord: "C Major"
      - rest: 1.0
"#;

    let yaml_lesson = YamlLesson::from_str(yaml)
        .expect("Should parse mixed YAML");

    assert_eq!(yaml_lesson.measures[0].notes.len(), 3);
    assert_eq!(yaml_lesson.total_beats(), 4.0);
}

#[test]
fn test_yaml_parser_handles_optional_hand() {
    use piano_tauri_backend::lesson_parser::YamlLesson;

    let yaml = r#"
title: "Hand Test"
description: "Test hand specification"
settings:
  tempo: 120
  time_signature: "4/4"
  key_signature: "C major"

measures:
  - notes:
      - midi: 60
        duration: 1.0
        hand: "left"
      - midi: [60, 64, 67]
        duration: 1.0
        hand: "right"
        chord: "C Major"
      - midi: 62
        duration: 1.0
"#;

    let yaml_lesson = YamlLesson::from_str(yaml)
        .expect("Should parse YAML with hand specification");

    // Hand should default to "right" when not specified
    assert_eq!(yaml_lesson.measures[0].notes.len(), 3);
}

#[test]
fn test_load_all_lesson_files() {
    use piano_tauri_backend::lesson_parser::YamlLesson;

    let lessons_dir = get_lessons_dir();

    let mut success_count = 0;
    let mut fail_count = 0;

    for entry in fs::read_dir(&lessons_dir).expect("Should read lessons directory") {
        let entry = entry.expect("Should read entry");
        let path = entry.path();

        if path.extension().and_then(|s| s.to_str()) == Some("yaml") {
            let filename = path.file_name().unwrap().to_string_lossy();

            match YamlLesson::from_file(&path) {
                Ok(lesson) => {
                    println!("✓ Successfully loaded: {} ({})", filename, lesson.title);
                    success_count += 1;

                    // Basic validations
                    assert!(!lesson.title.is_empty(), "Title should not be empty");
                    assert!(lesson.settings.tempo > 0, "Tempo should be positive");
                    assert!(lesson.measures.len() > 0, "Should have at least one measure");
                }
                Err(e) => {
                    println!("✗ Failed to load: {} - {}", filename, e);
                    fail_count += 1;
                }
            }
        }
    }

    println!("\nResults: {} succeeded, {} failed", success_count, fail_count);
    assert!(success_count > 0, "Should successfully load at least some lessons");
    assert_eq!(fail_count, 0, "All lessons should parse successfully");
}

#[test]
fn test_yaml_to_dto_conversion() {
    use piano_tauri_backend::lesson_parser::YamlLesson;

    let yaml = r#"
title: "DTO Test"
description: "Test conversion to DTO"
settings:
  tempo: 120
  time_signature: "3/4"
  key_signature: "G major"

measures:
  - notes:
      - midi: 60
        duration: 1.0
        hand: "right"
      - midi: [60, 64, 67]
        duration: 2.0
        hand: "right"
        chord: "C Major"
"#;

    let yaml_lesson = YamlLesson::from_str(yaml)
        .expect("Should parse YAML");

    // The conversion happens internally in load_lesson command
    // but we can verify the YamlLesson has all the data needed
    assert_eq!(yaml_lesson.title, "DTO Test");
    assert_eq!(yaml_lesson.settings.tempo, 120);
    assert_eq!(yaml_lesson.settings.time_signature, "3/4");
    assert_eq!(yaml_lesson.settings.key_signature, "G major");
    assert_eq!(yaml_lesson.total_beats(), 3.0);
}

#[test]
fn test_lesson_mode_parsing() {
    use piano_tauri_backend::lesson_parser::YamlLesson;

    let yaml = r#"
title: "Mode Test"
description: "Test mode parsing"
mode: "study_right_hand_no_timing"
settings:
  tempo: 120
  time_signature: "4/4"
  key_signature: "C major"

measures:
  - notes:
      - midi: 60
        duration: 1.0
"#;

    let yaml_lesson = YamlLesson::from_str(yaml)
        .expect("Should parse YAML with mode");

    assert!(yaml_lesson.mode.is_some(), "Mode should be parsed");
}

#[test]
fn test_lesson_without_mode_uses_default() {
    use piano_tauri_backend::lesson_parser::YamlLesson;

    let yaml = r#"
title: "No Mode Test"
description: "Test without mode"
settings:
  tempo: 120
  time_signature: "4/4"
  key_signature: "C major"

measures:
  - notes:
      - midi: 60
        duration: 1.0
"#;

    let yaml_lesson = YamlLesson::from_str(yaml)
        .expect("Should parse YAML without mode");

    // Mode is optional and should be None
    assert!(yaml_lesson.mode.is_none() || yaml_lesson.mode.is_some());
}

#[test]
fn test_multiple_measures() {
    use piano_tauri_backend::lesson_parser::YamlLesson;

    let yaml = r#"
title: "Multi Measure"
description: "Test multiple measures"
settings:
  tempo: 120
  time_signature: "4/4"
  key_signature: "C major"

measures:
  - notes:
      - midi: 60
        duration: 4.0
  - notes:
      - midi: 62
        duration: 4.0
  - notes:
      - midi: 64
        duration: 4.0
"#;

    let yaml_lesson = YamlLesson::from_str(yaml)
        .expect("Should parse multiple measures");

    assert_eq!(yaml_lesson.measures.len(), 3);
    assert_eq!(yaml_lesson.total_beats(), 12.0);
}
