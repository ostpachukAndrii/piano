// Molecules - Lightweight compositions (2-3 atoms combined)
// Phase 3: Deferred - #[prop] macro issues with Leptos 0.6
// These will be re-enabled in Phase 4 when Leptos syntax is corrected

// pub mod chord_tooltip;
// pub mod duration_indicator;
// pub mod measure;
// pub mod metronome_display;
// pub mod note;
// pub mod streak_counter;
// pub mod virtual_keyboard;

// pub use chord_tooltip::ChordTooltip;
// pub use duration_indicator::DurationIndicator;
// pub use measure::Measure;
// pub use note::Note;

// Phase 5: MIDI Device Selector
pub mod midi_device_selector;
pub use midi_device_selector::MidiDeviceSelector;

// Phase 6: Feedback Badge
pub mod feedback_badge;
pub use feedback_badge::{FeedbackBadge, FeedbackBadgeInline};
