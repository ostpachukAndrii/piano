use crate::models::{GlobalSettings, Measure};
use serde::{Deserialize, Serialize};

/// A complete lesson loaded from YAML
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Lesson {
    /// Unique identifier for the lesson (typically the filename without .yaml)
    pub id: String,
    /// Metadata about the lesson
    pub metadata: LessonMetadata,
    /// Global settings (tempo, time signature, key)
    pub settings: GlobalSettings,
    /// Measures containing notes
    pub measures: Vec<Measure>,
}

/// Metadata describing a lesson
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LessonMetadata {
    /// Human-readable name (e.g., "Alphabet Song")
    pub name: String,
    /// Description of what the lesson teaches
    #[serde(default)]
    pub description: Option<String>,
    /// Composer or creator name
    #[serde(default)]
    pub composer: Option<String>,
    /// Difficulty level
    #[serde(default = "default_difficulty")]
    pub difficulty: String, // "beginner"|"intermediate"|"advanced"
}

fn default_difficulty() -> String {
    "beginner".to_string()
}

impl Lesson {
    /// Validate the lesson structure
    pub fn validate(&self) -> Result<(), String> {
        if self.id.is_empty() {
            return Err("Lesson id cannot be empty".to_string());
        }
        if self.metadata.name.is_empty() {
            return Err("Lesson name cannot be empty".to_string());
        }
        if self.measures.is_empty() {
            return Err("Lesson must have at least one measure".to_string());
        }

        // Validate measure numbers are sequential
        for (i, measure) in self.measures.iter().enumerate() {
            if measure.number != (i + 1) as u32 {
                return Err(format!(
                    "Measure numbers must be sequential. Expected {}, got {}",
                    i + 1,
                    measure.number
                ));
            }
            if measure.notes.is_empty() {
                return Err(format!("Measure {} has no notes", measure.number));
            }
        }

        Ok(())
    }

    /// Get the total number of notes in the lesson
    pub fn total_notes(&self) -> usize {
        self.measures.iter().map(|m| m.notes.len()).sum()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lesson_validation_requires_id() {
        let lesson = Lesson {
            id: "".to_string(),
            metadata: LessonMetadata {
                name: "Test".to_string(),
                description: None,
                composer: None,
                difficulty: "beginner".to_string(),
            },
            settings: GlobalSettings {
                tempo: 100,
                time_signature: "4/4".to_string(),
                key_signature: "C major".to_string(),
            },
            measures: vec![],
        };
        assert!(lesson.validate().is_err());
    }
}
