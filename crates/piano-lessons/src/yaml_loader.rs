//! YAML Lesson Loader
//!
//! Load lesson configurations from YAML files.

use crate::LessonConfig;
use piano_domain::{ConcreteLesson, Lesson, NoteEvent};
use std::path::Path;

/// Loads lessons from YAML files
pub struct YamlLessonLoader;

impl YamlLessonLoader {
    /// Load a lesson from a YAML file
    pub fn load_from_file<P: AsRef<Path>>(
        path: P,
    ) -> Result<Box<dyn Lesson>, Box<dyn std::error::Error>> {
        let content = std::fs::read_to_string(path)?;
        Self::load_from_str(&content)
    }

    /// Load a lesson from a YAML string
    pub fn load_from_str(yaml: &str) -> Result<Box<dyn Lesson>, Box<dyn std::error::Error>> {
        let config: LessonConfig = serde_yaml::from_str(yaml)?;
        config.validate()?;

        // Support both old format (simple notes) and new format (measures with chords)
        let note_events: Vec<NoteEvent> = config.get_all_note_events();
        let lesson =
            ConcreteLesson::new(config.name.clone(), config.name, config.description, note_events);

        Ok(Box::new(lesson))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_load_from_yaml_string() {
        let yaml = r#"
name: Test Song
description: A test song
notes: [60, 62, 64]
"#;
        let result = YamlLessonLoader::load_from_str(yaml);
        assert!(result.is_ok());

        let lesson = result.unwrap();
        assert_eq!(lesson.name(), "Test Song");
        assert_eq!(lesson.note_events().len(), 3);
        assert_eq!(lesson.notes().len(), 3); // Backward compatibility
    }

    #[test]
    fn test_load_chord_from_yaml() {
        let yaml = r#"
name: Chord Test
description: A test with chords
measures:
  - number: 1
    notes:
      - pitch: 60
        duration: 1.0
      - pitches: [60, 64, 67]
        name: C Major
        duration: 1.0
"#;
        let result = YamlLessonLoader::load_from_str(yaml);
        assert!(result.is_ok());

        let lesson = result.unwrap();
        assert_eq!(lesson.name(), "Chord Test");
        assert_eq!(lesson.note_events().len(), 2);
        assert!(lesson.note_events()[1].is_chord());
    }

    #[test]
    fn test_load_chord_reference_from_yaml() {
        let yaml = r#"
name: Chord Reference Test
description: Test chord references
measures:
  - number: 1
    notes:
      - chord: "C Major"
        duration: 2.0
      - chord: "F Major"
        duration: 2.0
"#;
        let result = YamlLessonLoader::load_from_str(yaml);
        assert!(result.is_ok());

        let lesson = result.unwrap();
        assert_eq!(lesson.name(), "Chord Reference Test");
        assert_eq!(lesson.note_events().len(), 2);

        // Both should be chords
        assert!(lesson.note_events()[0].is_chord());
        assert!(lesson.note_events()[1].is_chord());

        // Check chord names
        assert_eq!(lesson.note_events()[0].display_name(), "C Major");
        assert_eq!(lesson.note_events()[1].display_name(), "F Major");

        // Check chord pitches (from the standard library)
        assert_eq!(lesson.note_events()[0].midi_numbers(), vec![60, 64, 67]);
        assert_eq!(lesson.note_events()[1].midi_numbers(), vec![65, 69, 72]);
    }

    #[test]
    fn test_load_mixed_chord_formats() {
        let yaml = r#"
name: Mixed Chord Format Test
description: Test mixing chord references and inline chords
measures:
  - number: 1
    notes:
      - chord: "C Major"
        duration: 1.0
      - pitches: [65, 69, 72]
        name: "F Major Inline"
        duration: 1.0
      - pitch: 60
        duration: 1.0
"#;
        let result = YamlLessonLoader::load_from_str(yaml);
        assert!(result.is_ok());

        let lesson = result.unwrap();
        assert_eq!(lesson.note_events().len(), 3);

        // First is a chord reference from the standard library
        assert!(lesson.note_events()[0].is_chord());
        assert_eq!(lesson.note_events()[0].display_name(), "C Major");

        // Second is an inline chord (still supported for custom chords)
        assert!(lesson.note_events()[1].is_chord());
        assert_eq!(lesson.note_events()[1].display_name(), "F Major Inline");

        // Third is a single note
        assert!(!lesson.note_events()[2].is_chord());
    }
}
