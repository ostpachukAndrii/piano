/// Measure Calculator - Manages bar line insertion and measure capacity
///
/// Enforces the 4/4 time signature rule:
/// - A measure holds exactly 4.0 beats
/// - Bar lines inserted when accumulated duration >= 4.0
/// - Chords (same timestamp) count as single duration = Max(durations)
///
/// Based on Project_Specification.md v1.8 Section 2.3.1

#[derive(Debug, Clone)]
pub struct BarLinePosition {
    pub measure_number: usize,
    pub x_position: f32,
    pub accumulated_duration: f32,
}

pub struct MeasureCalculator {
    current_measure_duration: f32,
    current_measure_number: usize,
    bar_lines: Vec<BarLinePosition>,
    beats_per_measure: f32,
    x_position: f32,
    x_spacing_per_beat: f32,
}

impl MeasureCalculator {
    /// Create a new calculator for 4/4 time signature
    pub fn new() -> Self {
        Self {
            current_measure_duration: 0.0,
            current_measure_number: 1,
            bar_lines: Vec::new(),
            beats_per_measure: 4.0,
            x_position: 120.0,        // Start after clef (default 120px)
            x_spacing_per_beat: 50.0, // 50px per beat
        }
    }

    /// Create with custom spacing (useful for testing)
    pub fn with_spacing(x_start: f32, x_per_beat: f32) -> Self {
        Self {
            current_measure_duration: 0.0,
            current_measure_number: 1,
            bar_lines: Vec::new(),
            beats_per_measure: 4.0,
            x_position: x_start,
            x_spacing_per_beat: x_per_beat,
        }
    }

    /// Add a single note to the current measure
    ///
    /// Returns Some(BarLinePosition) if the measure is now full (>= 4.0 beats)
    /// Resets accumulator for next measure
    pub fn add_note(&mut self, duration: f32) -> Option<BarLinePosition> {
        // First, advance X position for this note
        self.x_position += duration * self.x_spacing_per_beat;
        self.current_measure_duration += duration;

        if self.current_measure_duration >= self.beats_per_measure {
            let bar_line = BarLinePosition {
                measure_number: self.current_measure_number,
                x_position: self.x_position,
                accumulated_duration: self.current_measure_duration,
            };

            self.bar_lines.push(bar_line.clone());
            self.current_measure_duration = 0.0;
            self.current_measure_number += 1;

            return Some(bar_line);
        }

        None
    }

    /// Add a chord (multiple notes with same timestamp)
    ///
    /// Chord exception rule: Notes played simultaneously share the same duration.
    /// Duration = Max(all note durations), NOT sum of durations
    ///
    /// Example: C (Quarter) + E (Quarter) + G (Quarter) = 1 beat (NOT 3)
    pub fn add_chord(&mut self, durations: Vec<f32>) -> Option<BarLinePosition> {
        if durations.is_empty() {
            return None;
        }

        // Chord duration = maximum of all note durations
        let chord_duration = durations.iter().copied().fold(f32::NEG_INFINITY, f32::max);

        self.add_note(chord_duration)
    }

    /// Get all bar line positions calculated so far
    pub fn get_bar_lines(&self) -> Vec<BarLinePosition> {
        self.bar_lines.clone()
    }

    /// Get current measure duration (0.0 to 4.0)
    pub fn current_duration(&self) -> f32 {
        self.current_measure_duration
    }

    /// Get current measure number
    pub fn current_measure(&self) -> usize {
        self.current_measure_number
    }

    /// Get beats per measure (always 4.0 for 4/4 time)
    pub fn beats_per_measure(&self) -> f32 {
        self.beats_per_measure
    }

    /// Get current X position for next note
    pub fn current_x_position(&self) -> f32 {
        self.x_position
    }

    /// Reset calculator to initial state
    pub fn reset(&mut self) {
        self.current_measure_duration = 0.0;
        self.current_measure_number = 1;
        self.bar_lines.clear();
        self.x_position = 120.0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_single_whole_note_fills_measure() {
        let mut calc = MeasureCalculator::new();
        let result = calc.add_note(4.0);

        assert!(result.is_some(), "Whole note should trigger bar line");
        assert_eq!(calc.get_bar_lines().len(), 1);
        assert_eq!(
            calc.current_duration(),
            0.0,
            "Measure should reset after bar line"
        );
        assert_eq!(calc.current_measure(), 2, "Should advance to measure 2");
    }

    #[test]
    fn test_four_quarter_notes_fill_measure() {
        let mut calc = MeasureCalculator::new();

        // Add 4 quarter notes (1 beat each)
        assert!(
            calc.add_note(1.0).is_none(),
            "Quarter 1 should not fill measure"
        );
        assert!(
            calc.add_note(1.0).is_none(),
            "Quarter 2 should not fill measure"
        );
        assert!(
            calc.add_note(1.0).is_none(),
            "Quarter 3 should not fill measure"
        );
        let result = calc.add_note(1.0); // Quarter 4

        assert!(result.is_some(), "4 quarters should trigger bar line");
        assert_eq!(calc.get_bar_lines().len(), 1);
        assert_eq!(calc.current_duration(), 0.0, "Measure should reset");
    }

    #[test]
    fn test_no_empty_measures() {
        let mut calc = MeasureCalculator::new();

        // Add notes totaling exactly 4 beats
        calc.add_note(2.0); // Half note
        calc.add_note(1.0); // Quarter note
        let result = calc.add_note(1.0); // Quarter note

        assert!(result.is_some(), "Should trigger bar line at 4 beats");
        assert_eq!(calc.get_bar_lines().len(), 1);
        assert_eq!(
            calc.current_duration(),
            0.0,
            "Measure should be empty after bar line"
        );
    }

    #[test]
    fn test_no_overflow_beyond_4_beats() {
        let mut calc = MeasureCalculator::new();

        calc.add_note(2.0);
        calc.add_note(2.0); // Exactly 4 beats

        assert_eq!(
            calc.current_duration(),
            0.0,
            "Should reset at exactly 4 beats"
        );

        // Next note starts new measure
        let result = calc.add_note(0.5);
        assert!(
            result.is_none(),
            "First note of new measure should not overflow"
        );
        assert_eq!(
            calc.current_duration(),
            0.5,
            "Should have 0.5 beats in new measure"
        );
    }

    #[test]
    fn test_chord_counts_as_single_duration() {
        let mut calc = MeasureCalculator::new();

        // Chord: C (Quarter) + E (Quarter) + G (Quarter) at same timestamp
        // Should count as 1 beat total, NOT 3 beats
        let chord_durations = vec![1.0, 1.0, 1.0];
        let result = calc.add_chord(chord_durations);

        assert!(result.is_none(), "Chord should add single duration (Max)");
        assert_eq!(
            calc.current_duration(),
            1.0,
            "Chord duration should be Max = 1.0"
        );
        assert_eq!(calc.get_bar_lines().len(), 0, "Should not trigger bar line");
    }

    #[test]
    fn test_chord_with_mixed_durations() {
        let mut calc = MeasureCalculator::new();

        // Chord: C (Half) + E (Half) at same timestamp
        // Duration = Max(2.0, 2.0) = 2.0 beats
        let chord_durations = vec![2.0, 2.0];
        let result = calc.add_chord(chord_durations);

        assert!(result.is_none(), "Should add 2 beats");
        assert_eq!(calc.current_duration(), 2.0, "Chord duration = Max = 2.0");

        // Add another chord (2 beats) = total 4 beats = full measure
        let result2 = calc.add_chord(vec![2.0, 2.0]);
        assert!(
            result2.is_some(),
            "Should trigger bar line at 4 beats total"
        );
        assert_eq!(calc.get_bar_lines().len(), 1);
    }

    #[test]
    fn test_multiple_measures_sequential() {
        let mut calc = MeasureCalculator::new();

        // Measure 1: C D E F (4 quarters = 4 beats)
        calc.add_note(1.0); // C
        calc.add_note(1.0); // D
        calc.add_note(1.0); // E
        let m1 = calc.add_note(1.0); // F
        assert!(m1.is_some(), "Measure 1 should end");
        assert_eq!(calc.current_measure(), 2);

        // Measure 2: G (1 half = 2 beats) + rest of measure empty
        calc.add_note(2.0); // G
        assert_eq!(calc.current_duration(), 2.0);
        assert_eq!(calc.get_bar_lines().len(), 1, "Only one bar line so far");
    }

    #[test]
    fn test_rest_counts_as_duration() {
        let mut calc = MeasureCalculator::new();

        // Rest (1 beat) should be treated like any note
        calc.add_note(1.0); // Quarter note
        calc.add_note(1.0); // Quarter rest
        calc.add_note(1.0); // Quarter note
        let result = calc.add_note(1.0); // Quarter note

        assert!(result.is_some(), "Rests count toward measure duration");
        assert_eq!(calc.get_bar_lines().len(), 1);
    }

    #[test]
    fn test_time_signature_4_4_only() {
        let calc = MeasureCalculator::new();
        assert_eq!(
            calc.beats_per_measure(),
            4.0,
            "Calculator enforces 4/4 time signature"
        );
    }

    #[test]
    fn test_eighth_notes_with_beaming() {
        let mut calc = MeasureCalculator::new();

        // Measure: 2 eighth notes (0.5 beats each) + quarter (1 beat) + quarter (1 beat) + half (2 beats) = 4 beats
        calc.add_chord(vec![0.5, 0.5]); // Beamed eighths = 0.5 beat
        calc.add_note(1.0); // Quarter
        calc.add_note(1.0); // Quarter
        let result = calc.add_note(2.0); // Half

        assert!(result.is_some(), "Should trigger bar line");
        assert_eq!(calc.get_bar_lines().len(), 1);
    }

    #[test]
    fn test_x_position_calculation() {
        let mut calc = MeasureCalculator::with_spacing(100.0, 10.0);

        let initial_x = calc.current_x_position();
        assert_eq!(initial_x, 100.0);

        calc.add_note(1.0); // 1 beat = 10px
        assert_eq!(
            calc.current_x_position(),
            110.0,
            "X should advance by 10px per beat"
        );

        calc.add_note(1.0); // Another beat
        assert_eq!(calc.current_x_position(), 120.0);

        calc.add_note(1.0);
        calc.add_note(1.0); // Bar line at 4 beats
        assert_eq!(
            calc.current_x_position(),
            140.0,
            "X should continue advancing for next measure"
        );
    }
}
