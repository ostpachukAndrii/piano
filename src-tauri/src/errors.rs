// Error Types - Structured errors for better testing and debugging
//
// Instead of using String for all errors, we define specific error types
// This allows:
// - Precise error assertions in tests
// - Better error handling in code
// - IDE autocomplete for error cases
// - Easier debugging

use thiserror::Error;

/// Main application error type
#[derive(Error, Debug, PartialEq)]
pub enum AppError {
    // Lesson errors
    #[error("Lesson not found: {0}")]
    LessonNotFound(String),

    #[error("Invalid lesson format: {0}")]
    InvalidLessonFormat(String),

    #[error("Failed to read lesson file: {0}")]
    LessonFileRead(String),

    // MIDI errors
    #[error("MIDI device not found: {0}")]
    MidiDeviceNotFound(String),

    #[error("MIDI connection failed: {0}")]
    MidiConnectionFailed(String),

    #[error("MIDI buffer overflow")]
    MidiBufferOverflow,

    // Configuration errors
    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Invalid configuration value: {0}")]
    InvalidConfigValue(String),

    // IO errors
    #[error("IO error: {0}")]
    IoError(String),

    // Generic errors
    #[error("Internal error: {0}")]
    Internal(String),
}

// Easy conversion to String for Tauri commands
impl From<AppError> for String {
    fn from(error: AppError) -> String {
        error.to_string()
    }
}

// Convert from std::io::Error
impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        AppError::IoError(error.to_string())
    }
}

// Convert from serde_yaml::Error
impl From<serde_yaml::Error> for AppError {
    fn from(error: serde_yaml::Error) -> Self {
        AppError::InvalidLessonFormat(error.to_string())
    }
}

// Convert from config::ConfigError
impl From<config::ConfigError> for AppError {
    fn from(error: config::ConfigError) -> Self {
        AppError::ConfigError(error.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let err = AppError::LessonNotFound("test".to_string());
        assert_eq!(err.to_string(), "Lesson not found: test");
    }

    #[test]
    fn test_error_equality() {
        let err1 = AppError::MidiBufferOverflow;
        let err2 = AppError::MidiBufferOverflow;
        assert_eq!(err1, err2);
    }

    #[test]
    fn test_error_to_string_conversion() {
        let err = AppError::InvalidConfigValue("tempo".to_string());
        let s: String = err.into();
        assert!(s.contains("Invalid configuration value"));
    }

    #[test]
    fn test_io_error_conversion() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "file not found");
        let app_err: AppError = io_err.into();
        assert!(matches!(app_err, AppError::IoError(_)));
    }
}
