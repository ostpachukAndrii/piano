// Playback commands - Manage lesson playback state
// Responsibility: Backend only (see RESPONSIBILITY_SEPARATION.md)
// Commands:
//   - get_playback_state(lesson_id: String) -> Result<PlaybackState, String>
//   - seek_to_note(lesson_id: String, note_index: usize) -> Result<PlaybackState, String>
// Events:
//   - playhead_moved: {lesson_id: String, note_index: usize, progress_percent: f32}

// TODO: Implement after lesson service is ready
