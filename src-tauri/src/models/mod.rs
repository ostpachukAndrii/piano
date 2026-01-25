// Models - Data structures for the backend
// These structures are:
// - Serializable (serde derives)
// - Sent to frontend via Tauri Commands
// - Represent the application domain

mod measure;
mod midi_event;

pub use measure::{GlobalSettings, Measure, Note};
pub use midi_event::{MidiChord, MidiDeviceInfo, MidiEvent};

// For now, we re-export from piano_domain crate
// These will be custom models for the Tauri backend once fully implemented
pub use piano_domain::Lesson;

// Note: EvaluationResult is now in services/evaluation.rs
