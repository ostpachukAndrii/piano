// Frontend utilities
// Coordinate calculations, conversions, formatting

pub mod formatting;
pub mod midi_to_position;

#[allow(unused_imports)] // Phase 4+: will be used for duration/time formatting
pub use formatting::*;
pub use midi_to_position::*;
