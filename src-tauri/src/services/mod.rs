// Services - Core business logic
// Each service has a single clear responsibility:
// - lesson_parser: Parse YAML files into Lesson structures
// - midi_input: Listen to MIDI hardware via midir
// - evaluation: Check if played note matches expected note
// - playback: Manage playhead position and lesson timing
// - statistics: Record and retrieve session statistics

mod evaluation;
mod midi_input;

pub use evaluation::{EvaluationResult, EvaluationService, FeedbackType};
pub use midi_input::MidiInputService;

// Placeholder type exports for future phases
#[derive(Debug, Clone)]
pub struct LessonParser;

#[derive(Debug, Clone)]
pub struct PlaybackManager;

#[derive(Debug, Clone)]
pub struct StatisticsService;
