//! Piano Application Layer
//!
//! Business logic and use cases that orchestrate domain and infrastructure.
//! This layer knows about both domain entities and how to interact with MIDI/lessons.

pub mod error;
pub mod lesson_player;
pub mod lesson_runner;
pub mod play_lesson;
pub mod statistics;

pub use error::AppError;
pub use lesson_player::LessonPlayer;
pub use lesson_runner::run_lesson;
pub use play_lesson::PlayLessonUseCase;
pub use statistics::{EventStatistics, LessonStatistics};
