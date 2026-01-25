//! Piano Lessons Module
//!
//! Lesson definitions, loading, and repository.
//! Responsible for managing lesson data and persistence.

pub mod chords;
pub mod lesson_config;
pub mod yaml_loader;
pub mod repository;

pub use chords::{get_chord, available_chords};
pub use lesson_config::LessonConfig;
pub use yaml_loader::YamlLessonLoader;
pub use repository::LessonRepository;
