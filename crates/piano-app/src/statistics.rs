//! Lesson statistics - tracks performance metrics during lesson playback
//!
//! Collects data about how well the user played the lesson, including timing accuracy,
//! note correctness, and other metrics for educational feedback.

use piano_domain::NoteEvent;

/// Statistics for a single note/chord event
#[derive(Debug, Clone)]
pub struct EventStatistics {
    /// Which event in the lesson (0-indexed)
    pub event_index: usize,
    /// The event that was expected
    pub expected_event: NoteEvent,
    /// Notes the user actually played
    pub played_notes: Vec<u8>,
    /// How long the user held the note/chord (in milliseconds)
    pub actual_duration_ms: Option<u64>,
    /// Expected duration from the event definition (in milliseconds)
    pub expected_duration_ms: Option<u64>,
    /// Whether the user played the correct notes
    pub notes_correct: bool,
    /// How long after the expected time the user started playing (in milliseconds)
    /// Positive = late, Negative = early, None = not tracked
    pub timing_offset_ms: Option<i64>,
    /// Number of attempts before getting it right (1 = first try)
    pub attempts: u32,
}

impl EventStatistics {
    /// Create statistics for an event
    pub fn new(event_index: usize, expected_event: NoteEvent) -> Self {
        EventStatistics {
            event_index,
            expected_event: expected_event.clone(),
            played_notes: Vec::new(),
            actual_duration_ms: None,
            expected_duration_ms: expected_event.duration_ms(),
            notes_correct: false,
            timing_offset_ms: None,
            attempts: 0,
        }
    }

    /// Calculate duration accuracy as percentage (100 = perfect, 0 = way off)
    pub fn duration_accuracy_percent(&self) -> Option<u8> {
        match (self.actual_duration_ms, self.expected_duration_ms) {
            (Some(actual), Some(expected)) => {
                let diff = (actual as i64 - expected as i64).abs();
                let tolerance = ((expected as f64) * 0.1).max(50.0) as i64;

                if diff <= tolerance {
                    Some(100)
                } else {
                    let accuracy = 100i64 - ((diff - tolerance) as i64);
                    Some((accuracy.max(0) as u8).min(100))
                }
            }
            _ => None, // No duration requirement
        }
    }

    /// Get duration variance in milliseconds
    pub fn duration_variance_ms(&self) -> Option<i64> {
        match (self.actual_duration_ms, self.expected_duration_ms) {
            (Some(actual), Some(expected)) => Some(actual as i64 - expected as i64),
            _ => None,
        }
    }
}

/// Overall statistics for a lesson playback session
#[derive(Debug, Clone)]
pub struct LessonStatistics {
    /// Per-event statistics
    pub events: Vec<EventStatistics>,
    /// Total attempts across the entire lesson
    pub total_attempts: u32,
    /// Number of events completed correctly
    pub completed_correctly: u32,
    /// Overall accuracy percentage (correct events / total events * 100)
    pub overall_accuracy_percent: u8,
    /// Average duration accuracy across all events with duration requirements
    pub average_duration_accuracy_percent: Option<u8>,
    /// Lesson start time (timestamp in seconds since start)
    pub start_timestamp_ms: u64,
    /// Lesson end time (timestamp in seconds since start)
    pub end_timestamp_ms: u64,
}

impl LessonStatistics {
    /// Create empty statistics for a lesson with given number of events
    pub fn new(_total_events: usize) -> Self {
        LessonStatistics {
            events: Vec::new(),
            total_attempts: 0,
            completed_correctly: 0,
            overall_accuracy_percent: 0,
            average_duration_accuracy_percent: None,
            start_timestamp_ms: 0,
            end_timestamp_ms: 0,
        }
    }

    /// Record an event attempt
    pub fn record_attempt(
        &mut self,
        event_index: usize,
        expected_event: NoteEvent,
        played_notes: Vec<u8>,
        notes_correct: bool,
    ) {
        self.total_attempts += 1;

        // Find or create statistics for this event
        let stats = if event_index < self.events.len() {
            &mut self.events[event_index]
        } else {
            // Expand events vector if needed
            while self.events.len() <= event_index {
                self.events.push(EventStatistics::new(
                    self.events.len(),
                    expected_event.clone(),
                ));
            }
            &mut self.events[event_index]
        };

        stats.played_notes = played_notes;
        stats.notes_correct = notes_correct;
        stats.attempts += 1;

        if notes_correct {
            self.completed_correctly += 1;
        }
    }

    /// Record the actual duration for an event
    pub fn record_duration(&mut self, event_index: usize, actual_duration_ms: u64) {
        if event_index < self.events.len() {
            self.events[event_index].actual_duration_ms = Some(actual_duration_ms);
        }
    }

    /// Set the lesson timing
    pub fn set_timing(&mut self, start_ms: u64, end_ms: u64) {
        self.start_timestamp_ms = start_ms;
        self.end_timestamp_ms = end_ms;
    }

    /// Calculate and update the overall statistics
    pub fn finalize(&mut self, total_events: usize) {
        if total_events > 0 {
            self.overall_accuracy_percent =
                ((self.completed_correctly as u64 * 100) / total_events as u64) as u8;
        }

        // Calculate average duration accuracy
        let duration_accuracies: Vec<u8> = self
            .events
            .iter()
            .filter_map(|e| e.duration_accuracy_percent())
            .collect();

        if !duration_accuracies.is_empty() {
            let sum: u32 = duration_accuracies.iter().map(|&x| x as u32).sum();
            let avg = sum / duration_accuracies.len() as u32;
            self.average_duration_accuracy_percent = Some(avg as u8);
        }
    }

    /// Get total duration of the lesson (in milliseconds)
    pub fn total_duration_ms(&self) -> u64 {
        self.end_timestamp_ms
            .saturating_sub(self.start_timestamp_ms)
    }

    /// Get detailed performance report as string
    pub fn generate_report(&self, lesson_name: &str) -> String {
        let mut report = String::new();
        report.push_str(&format!("\n📊 Lesson Statistics: {}\n", lesson_name));
        report.push_str("═════════════════════════════════════════════════════════\n");

        // Overall metrics
        report.push_str(&format!(
            "Overall Accuracy: {}%\n",
            self.overall_accuracy_percent
        ));
        report.push_str(&format!(
            "Events Completed: {}/{}\n",
            self.completed_correctly,
            self.events.len()
        ));
        report.push_str(&format!("Total Attempts: {}\n", self.total_attempts));

        let duration_sec = self.total_duration_ms() / 1000;
        let duration_min = duration_sec / 60;
        let duration_sec = duration_sec % 60;
        report.push_str(&format!(
            "Total Duration: {}m {}s\n",
            duration_min, duration_sec
        ));

        if let Some(avg_duration_acc) = self.average_duration_accuracy_percent {
            report.push_str(&format!("Average Timing Accuracy: {}%\n", avg_duration_acc));
        }

        // Event-specific details
        report.push_str("\nDetailed Results:\n");
        report.push_str("─────────────────────────────────────────────────────────\n");

        for (i, stats) in self.events.iter().enumerate() {
            let note_status = if stats.notes_correct { "✅" } else { "❌" };
            report.push_str(&format!("{} Event {}: ", note_status, i + 1));

            if let NoteEvent::Single { note, .. } = &stats.expected_event {
                report.push_str(&format!("Note({})", note.midi_number));
            } else if let NoteEvent::Chord { name, .. } = &stats.expected_event {
                if let Some(name) = name {
                    report.push_str(&format!("Chord({})", name));
                } else {
                    report.push_str("Chord");
                }
            }

            report.push_str(&format!(" - Attempts: {}", stats.attempts));

            if let Some(actual_dur) = stats.actual_duration_ms {
                if let Some(expected_dur) = stats.expected_duration_ms {
                    let variance = actual_dur as i64 - expected_dur as i64;
                    let variance_str = if variance >= 0 {
                        format!("+{}ms", variance)
                    } else {
                        format!("{}ms", variance)
                    };
                    report.push_str(&format!(
                        ", Duration: {}ms (expected {}ms, {})",
                        actual_dur, expected_dur, variance_str
                    ));

                    if let Some(acc) = stats.duration_accuracy_percent() {
                        report.push_str(&format!(", Accuracy: {}%", acc));
                    }
                } else {
                    report.push_str(&format!(", Held: {}ms", actual_dur));
                }
            }

            report.push_str("\n");
        }

        report.push_str("═════════════════════════════════════════════════════════\n");
        report
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_event_statistics_duration_accuracy() {
        let event = NoteEvent::single_with_duration(60, 500);
        let mut stats = EventStatistics::new(0, event);
        stats.actual_duration_ms = Some(500);

        assert_eq!(stats.duration_accuracy_percent(), Some(100));
    }

    #[test]
    fn test_lesson_statistics_accuracy() {
        let mut stats = LessonStatistics::new(3);
        stats.record_attempt(0, NoteEvent::single(60), vec![60], true);
        stats.record_attempt(1, NoteEvent::single(62), vec![62], true);
        stats.record_attempt(2, NoteEvent::single(64), vec![64], false);

        stats.finalize(3);

        assert_eq!(stats.completed_correctly, 2);
        assert_eq!(stats.overall_accuracy_percent, 66);
    }
}
