//! Piano Domain Layer
//!
//! Core domain entities and value objects for the piano teaching application.
//! This layer contains no infrastructure details - pure business logic only.

pub mod lesson;
pub mod note;
pub mod note_name;
pub mod progress;

pub use lesson::{ConcreteLesson, Lesson, LessonId};
pub use note::{Hand, Note, NoteEvent};
pub use note_name::NoteName;
pub use progress::Progress;
