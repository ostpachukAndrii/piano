// Duration Utilities
// Classify and work with note durations
// Responsibility: Duration logic

// TODO: Implement duration utilities
// - string_to_ms: (duration_str: &str, bpm: u16) -> u64
//   Examples: "quarter" at 120bpm = 500ms, "eighth" = 250ms
// - ms_to_duration: (ms: u64, bpm: u16) -> String
// - is_duration_correct: (expected, actual, tolerance) -> bool
// Duration values at 120 BPM (quarter note = 500ms):
//   Whole: 2000ms
//   Half: 1000ms
//   Quarter: 500ms
//   Eighth: 250ms
//   Sixteenth: 125ms
