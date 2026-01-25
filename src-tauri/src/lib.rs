// Tauri Piano Backend Library
// This module re-exports all public commands, services, and models

pub mod commands;
pub mod config;
pub mod lesson_parser;
pub mod models;
pub mod services;
pub mod utils;

// Re-export key types (selective to avoid unused import warnings)
pub use config::*;
pub use lesson_parser::YamlLesson;
pub use models::{GlobalSettings, Measure, MidiChord, MidiDeviceInfo, MidiEvent, Note};
pub use services::{
    EvaluationResult, EvaluationService, FeedbackType, LessonParser, MidiInputService,
    PlaybackManager, StatisticsService,
};

// Re-export MIDI commands
pub use commands::midi::{
    get_midi_devices, is_midi_connected, start_midi_listening, stop_midi_listening, MidiState,
};

// Re-export Evaluation commands
pub use commands::evaluation::{
    check_note, check_pitch, get_stats, reset_stats, EvaluationState, SessionStats,
};
