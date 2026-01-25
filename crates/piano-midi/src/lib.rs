//! Piano MIDI Infrastructure Layer
//!
//! Low-level MIDI device interaction, connection, and event parsing.
//! This layer handles all I/O and external dependencies related to MIDI.

pub mod device;
pub mod error;
pub mod event;

pub use device::{ConnectedMidiDevice, MidiDevice, MidiDeviceManager};
pub use error::MidiError;
pub use event::MidiEvent;
