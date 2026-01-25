//! Lesson Repository
//!
//! Repository pattern for accessing lessons from various sources.

use crate::YamlLessonLoader;
use piano_domain::Lesson;
use std::path::Path;

/// Repository for accessing lessons
pub struct LessonRepository {
    lessons_dir: String,
}

impl LessonRepository {
    /// Create a new repository pointing to a lessons directory
    pub fn new(lessons_dir: impl Into<String>) -> Self {
        LessonRepository {
            lessons_dir: lessons_dir.into(),
        }
    }

    /// Load a lesson by name (searches for .yaml file)
    pub fn load_by_name(&self, name: &str) -> Result<Box<dyn Lesson>, Box<dyn std::error::Error>> {
        let path = format!("{}/{}.yaml", self.lessons_dir, name);
        YamlLessonLoader::load_from_file(&path)
    }

    /// Load a lesson from a specific path
    pub fn load_from_path<P: AsRef<Path>>(&self, path: P) -> Result<Box<dyn Lesson>, Box<dyn std::error::Error>> {
        YamlLessonLoader::load_from_file(path)
    }

    /// List all available lesson files in the directory
    pub fn list_available(&self) -> Result<Vec<String>, Box<dyn std::error::Error>> {
        let mut lessons = Vec::new();

        if let Ok(entries) = std::fs::read_dir(&self.lessons_dir) {
            for entry in entries {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    if path.extension().and_then(|ext| ext.to_str()) == Some("yaml") {
                        if let Some(filename) = path.file_stem() {
                            if let Some(name) = filename.to_str() {
                                lessons.push(name.to_string());
                            }
                        }
                    }
                }
            }
        }

        Ok(lessons)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_repository_creation() {
        let repo = LessonRepository::new("lessons");
        assert_eq!(repo.lessons_dir, "lessons");
    }
}
