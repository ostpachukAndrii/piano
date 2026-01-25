//! Application error types

use std::fmt;

/// Application-level errors
#[derive(Debug)]
pub enum AppError {
    /// Domain error
    DomainError(String),
    /// MIDI error
    MidiError(String),
    /// Lesson loading error
    LessonError(String),
    /// I/O error
    IoError(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::DomainError(msg) => write!(f, "Domain error: {}", msg),
            AppError::MidiError(msg) => write!(f, "MIDI error: {}", msg),
            AppError::LessonError(msg) => write!(f, "Lesson error: {}", msg),
            AppError::IoError(msg) => write!(f, "I/O error: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

impl From<piano_midi::MidiError> for AppError {
    fn from(err: piano_midi::MidiError) -> Self {
        AppError::MidiError(err.to_string())
    }
}
