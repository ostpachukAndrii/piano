//! Lesson Player - Core orchestrator for lesson playback
//!
//! Combines lesson, progress tracking, and MIDI events to implement lesson playback.

use crate::statistics::LessonStatistics;
use piano_domain::{Lesson, NoteEvent, NoteName, Progress};
use piano_midi::MidiEvent;
use std::collections::{HashMap, HashSet};
use std::time::{Instant, SystemTime, UNIX_EPOCH};

/// Plays a lesson and tracks progress
pub struct LessonPlayer {
    lesson: Box<dyn Lesson>,
    progress: Progress,
    note_name: NoteName,
    /// Currently held notes (for chord detection)
    held_notes: HashSet<u8>,
    /// Timestamp when each note was pressed (for timing tolerance)
    note_press_times: HashMap<u8, Instant>,
    /// Chord timing tolerance in milliseconds
    chord_tolerance_ms: u64,
    /// Timestamp when the current event was first correctly played (for duration tracking)
    event_start_time: Option<Instant>,
    /// Statistics tracking
    statistics: LessonStatistics,
    /// When the lesson started (for overall timing)
    #[allow(dead_code)]
    lesson_start_time: Instant,
}

impl LessonPlayer {
    /// Create a new lesson player
    pub fn new(lesson: Box<dyn Lesson>, note_name: NoteName) -> Self {
        Self::with_tolerance(lesson, note_name, 150) // Default: Medium difficulty
    }

    /// Create a new lesson player with custom chord timing tolerance
    pub fn with_tolerance(
        lesson: Box<dyn Lesson>,
        note_name: NoteName,
        chord_tolerance_ms: u64,
    ) -> Self {
        let total_events = lesson.total_events();
        let mut statistics = LessonStatistics::new(total_events);
        statistics.start_timestamp_ms = current_time_ms();

        LessonPlayer {
            lesson,
            progress: Progress::new(total_events),
            note_name,
            held_notes: HashSet::new(),
            note_press_times: HashMap::new(),
            chord_tolerance_ms,
            event_start_time: None,
            statistics,
            lesson_start_time: Instant::now(),
        }
    }

    /// Get the lesson
    pub fn lesson(&self) -> &dyn Lesson {
        &*self.lesson
    }

    /// Get current progress
    pub fn progress(&self) -> &Progress {
        &self.progress
    }

    /// Get note naming system
    pub fn note_name(&self) -> NoteName {
        self.note_name
    }

    /// Get current note to play
    pub fn current_note_index(&self) -> usize {
        self.progress.current_index()
    }

    /// Get expected note event
    pub fn expected_event(&self) -> Option<&NoteEvent> {
        self.lesson.note_events().get(self.progress.current_index())
    }

    /// Get expected note (backward compatibility)
    #[deprecated(note = "Use expected_event instead")]
    pub fn expected_note(&self) -> Option<piano_domain::Note> {
        self.expected_event().and_then(|event| {
            if let NoteEvent::Single { note, .. } = event {
                Some(*note)
            } else {
                None
            }
        })
    }

    /// Get the timing span for currently held notes (in milliseconds)
    fn get_chord_timing(&self) -> Option<u64> {
        if self.note_press_times.len() <= 1 {
            return None;
        }

        let press_times: Vec<Instant> = self.note_press_times.values().copied().collect();
        if press_times.is_empty() {
            return None;
        }

        let earliest = press_times.iter().min().unwrap();
        let latest = press_times.iter().max().unwrap();
        Some(latest.duration_since(*earliest).as_millis() as u64)
    }

    /// Check if currently held notes match the expected event
    fn check_held_notes_match(&self) -> bool {
        if let Some(expected) = self.expected_event() {
            let expected_notes: HashSet<u8> = expected.midi_numbers().into_iter().collect();

            // Check if all expected notes are held
            if self.held_notes != expected_notes {
                return false;
            }

            // Check timing tolerance for chords (only relevant for chords with multiple notes)
            if expected_notes.len() > 1 {
                if let Some(time_span) = self.get_chord_timing() {
                    if time_span > self.chord_tolerance_ms {
                        return false;
                    }
                }
            }

            true
        } else {
            false
        }
    }

    /// Check if a played note is correct
    pub fn check_note(&mut self, played_note: u8) -> bool {
        if let Some(expected) = self.expected_event() {
            match expected {
                NoteEvent::Single { note, .. } => {
                    if played_note == note.midi_number {
                        self.progress.advance();
                        return true;
                    }
                }
                NoteEvent::Chord { .. } => {
                    // For chords, we don't advance immediately
                    // We need to wait until all notes are held
                    // This is handled in handle_midi_event
                }
            }
        }
        false
    }

    /// Handle a MIDI event
    pub fn handle_midi_event(&mut self, event: MidiEvent) -> Option<MidiEventResult> {
        match event {
            MidiEvent::NoteOn { note, velocity: _ } => {
                // Add note to held notes
                self.held_notes.insert(note);

                let mut is_correct = false;
                let expected_event = self.expected_event().cloned();

                // Only record press time if this note is part of the expected chord
                if let Some(expected) = &expected_event {
                    match expected {
                        NoteEvent::Single { .. } => {
                            // For single notes, we don't need chord timing tracking
                        }
                        NoteEvent::Chord { .. } => {
                            // Only track timing for notes that are part of the expected chord
                            let expected_notes: HashSet<u8> =
                                expected.midi_numbers().into_iter().collect();
                            if expected_notes.contains(&note) {
                                self.note_press_times.insert(note, Instant::now());
                            }
                        }
                    }
                }

                let chord_timing = self.get_chord_timing();

                if let Some(expected) = &expected_event {
                    match expected {
                        NoteEvent::Single {
                            note: expected_note,
                            duration_ms,
                        } => {
                            // For single notes, check immediately
                            if note == expected_note.midi_number {
                                // If duration tracking is required, start the timer
                                if duration_ms.is_some() {
                                    self.event_start_time = Some(Instant::now());
                                    is_correct = false; // Don't advance yet, wait for release
                                } else {
                                    // No duration requirement, advance immediately
                                    is_correct = true;
                                    self.progress.advance();
                                    self.held_notes.clear();
                                    self.note_press_times.clear();
                                    self.event_start_time = None;
                                }
                            }
                        }
                        NoteEvent::Chord { duration_ms, .. } => {
                            // For chords, check if all notes are held within timing tolerance
                            if self.check_held_notes_match() {
                                // If duration tracking is required, start the timer
                                if duration_ms.is_some() {
                                    self.event_start_time = Some(Instant::now());
                                    is_correct = false; // Don't advance yet, wait for release
                                } else {
                                    // No duration requirement, advance immediately
                                    is_correct = true;
                                    self.progress.advance();
                                    self.held_notes.clear();
                                    self.note_press_times.clear();
                                    self.event_start_time = None;
                                }
                            }
                        }
                    }
                }

                Some(MidiEventResult {
                    is_correct,
                    expected_event,
                    played_notes: self.held_notes.clone(),
                    progress_percent: self.progress.percentage(),
                    chord_timing_ms: chord_timing,
                    held_duration_ms: None,
                    duration_match: None,
                })
            }
            MidiEvent::NoteOff { note } => {
                // Check if we're tracking duration for the current event
                let result = if let Some(start_time) = self.event_start_time {
                    let expected_event = self.expected_event().cloned();

                    if let Some(expected) = &expected_event {
                        // Check if the released note is part of the expected event
                        let expected_notes: HashSet<u8> =
                            expected.midi_numbers().into_iter().collect();

                        if expected_notes.contains(&note) {
                            // Calculate held duration
                            let held_duration_ms = start_time.elapsed().as_millis() as u64;

                            // CHANGE: Always advance when user releases the note
                            // Don't require strict duration matching anymore
                            // Just track it for feedback

                            self.progress.advance();

                            // Record the duration for statistics
                            let current_idx = self.progress.current_index() - 1;
                            self.statistics
                                .record_duration(current_idx, held_duration_ms);

                            self.held_notes.clear();
                            self.note_press_times.clear();
                            self.event_start_time = None;

                            Some(MidiEventResult {
                                is_correct: true, // Always correct now - duration is for feedback only
                                expected_event,
                                played_notes: {
                                    let mut set = HashSet::new();
                                    set.insert(note);
                                    set
                                },
                                progress_percent: self.progress.percentage(),
                                chord_timing_ms: None,
                                held_duration_ms: Some(held_duration_ms),
                                duration_match: None, // No matching required
                            })
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                } else {
                    None
                };

                // Remove note from held notes and press times
                self.held_notes.remove(&note);
                self.note_press_times.remove(&note);

                result
            }
            _ => None,
        }
    }

    /// Reset the lesson
    pub fn reset(&mut self) {
        self.progress.reset();
        self.held_notes.clear();
        self.note_press_times.clear();
        self.event_start_time = None;
    }

    /// Check if lesson is complete
    pub fn is_complete(&self) -> bool {
        self.progress.is_complete()
    }

    /// Get statistics for the lesson playback
    pub fn statistics(&self) -> &LessonStatistics {
        &self.statistics
    }

    /// Get mutable statistics
    pub fn statistics_mut(&mut self) -> &mut LessonStatistics {
        &mut self.statistics
    }

    /// Finalize statistics at the end of the lesson
    pub fn finalize_statistics(&mut self) {
        self.statistics.end_timestamp_ms = current_time_ms();
        self.statistics.finalize(self.lesson.total_events());
    }
}

/// Result of handling a MIDI event in the lesson
pub struct MidiEventResult {
    pub is_correct: bool,
    pub expected_event: Option<NoteEvent>,
    pub played_notes: HashSet<u8>,
    pub progress_percent: u8,
    /// Time span in milliseconds between first and last chord note (None for single notes)
    pub chord_timing_ms: Option<u64>,
    /// Actual duration the note/chord was held in milliseconds (only set when releasing)
    pub held_duration_ms: Option<u64>,
    /// Whether the held duration matches the expected duration
    pub duration_match: Option<bool>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use piano_domain::{ConcreteLesson, NoteEvent};

    #[test]
    fn test_lesson_player_single_notes() {
        let note_events = vec![
            NoteEvent::single(60),
            NoteEvent::single(62),
            NoteEvent::single(64),
        ];
        let lesson = Box::new(ConcreteLesson::new(
            "test",
            "Test".to_string(),
            "Test lesson".to_string(),
            note_events,
        ));

        let mut player = LessonPlayer::new(lesson, NoteName::Solfege);

        assert_eq!(player.current_note_index(), 0);
        assert!(!player.is_complete());

        // Play correct note
        let result = player.handle_midi_event(MidiEvent::NoteOn {
            note: 60,
            velocity: 100,
        });
        assert!(result.is_some());
        assert!(result.unwrap().is_correct);
        assert_eq!(player.current_note_index(), 1);

        // Play wrong note
        let result = player.handle_midi_event(MidiEvent::NoteOn {
            note: 61,
            velocity: 100,
        });
        assert!(result.is_some());
        assert!(!result.unwrap().is_correct);
        assert_eq!(player.current_note_index(), 1); // Still at same note

        // Play correct note
        let result = player.handle_midi_event(MidiEvent::NoteOn {
            note: 62,
            velocity: 100,
        });
        assert!(result.is_some());
        assert!(result.unwrap().is_correct);
        assert_eq!(player.current_note_index(), 2);
    }

    #[test]
    fn test_lesson_player_chords() {
        let note_events = vec![
            NoteEvent::single(60),
            NoteEvent::chord(vec![60, 64, 67], Some("C Major".to_string())),
        ];
        let lesson = Box::new(ConcreteLesson::new(
            "test",
            "Test Chords".to_string(),
            "Test lesson with chords".to_string(),
            note_events,
        ));

        let mut player = LessonPlayer::new(lesson, NoteName::Solfege);

        // Play first single note
        let result = player.handle_midi_event(MidiEvent::NoteOn {
            note: 60,
            velocity: 100,
        });
        assert!(result.is_some());
        assert!(result.unwrap().is_correct);
        assert_eq!(player.current_note_index(), 1);

        // Play first note of chord - not complete yet
        let result = player.handle_midi_event(MidiEvent::NoteOn {
            note: 60,
            velocity: 100,
        });
        assert!(result.is_some());
        assert!(!result.unwrap().is_correct);
        assert_eq!(player.current_note_index(), 1);

        // Play second note of chord - not complete yet
        let result = player.handle_midi_event(MidiEvent::NoteOn {
            note: 64,
            velocity: 100,
        });
        assert!(result.is_some());
        assert!(!result.unwrap().is_correct);
        assert_eq!(player.current_note_index(), 1);

        // Play third note of chord - now complete!
        let result = player.handle_midi_event(MidiEvent::NoteOn {
            note: 67,
            velocity: 100,
        });
        assert!(result.is_some());
        assert!(result.unwrap().is_correct);
        assert_eq!(player.current_note_index(), 2);
        assert!(player.is_complete());
    }
}

/// Get current time in milliseconds since Unix epoch
fn current_time_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}
