//! MIDI Error types

use std::fmt;

/// MIDI-related errors
#[derive(Debug)]
pub enum MidiError {
    /// No MIDI inputs available
    NoInputsFound,
    /// Failed to connect to MIDI device
    ConnectionFailed(String),
    /// Invalid device index
    InvalidDeviceIndex,
    /// I/O error
    IoError(String),
}

impl fmt::Display for MidiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            MidiError::NoInputsFound => write!(f, "No MIDI inputs found"),
            MidiError::ConnectionFailed(msg) => write!(f, "Failed to connect to MIDI device: {}", msg),
            MidiError::InvalidDeviceIndex => write!(f, "Invalid MIDI device index"),
            MidiError::IoError(msg) => write!(f, "MIDI I/O error: {}", msg),
        }
    }
}

impl std::error::Error for MidiError {}
