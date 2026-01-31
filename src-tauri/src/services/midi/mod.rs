// MIDI Service Module
// Organized services for MIDI processing

pub mod chord_grouper;
pub mod event_processor;

pub use chord_grouper::ChordGrouper;
pub use event_processor::{EventProcessor, ProcessResult};
