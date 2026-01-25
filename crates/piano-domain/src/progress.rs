//! Progress tracking
//! 
//! Pure domain logic for tracking lesson progress without any I/O.

/// Lesson progress state - tracks which note we're on
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Progress {
    current_index: usize,
    total_notes: usize,
}

impl Progress {
    /// Create a new progress tracker
    pub fn new(total_notes: usize) -> Self {
        Progress {
            current_index: 0,
            total_notes,
        }
    }

    /// Get current note index (0-based)
    pub fn current_index(&self) -> usize {
        self.current_index
    }

    /// Get total number of notes
    pub fn total_notes(&self) -> usize {
        self.total_notes
    }

    /// Check if we've completed the lesson
    pub fn is_complete(&self) -> bool {
        self.current_index >= self.total_notes
    }

    /// Advance to the next note
    pub fn advance(&mut self) {
        if self.current_index < self.total_notes {
            self.current_index += 1;
        }
    }

    /// Reset to the beginning
    pub fn reset(&mut self) {
        self.current_index = 0;
    }

    /// Get progress as a percentage (0-100)
    pub fn percentage(&self) -> u8 {
        if self.total_notes == 0 {
            return 100;
        }
        (((self.current_index as u32 * 100) / self.total_notes as u32) as u8).min(100)
    }

    /// Set progress to a specific index
    pub fn set_index(&mut self, index: usize) {
        self.current_index = index.min(self.total_notes);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_progress_tracking() {
        let mut progress = Progress::new(10);
        assert_eq!(progress.current_index(), 0);
        assert_eq!(progress.percentage(), 0);
        assert!(!progress.is_complete());

        progress.advance();
        assert_eq!(progress.current_index(), 1);
        assert_eq!(progress.percentage(), 10);

        for _ in 0..9 {
            progress.advance();
        }
        assert!(progress.is_complete());
        assert_eq!(progress.percentage(), 100);
    }

    #[test]
    fn test_progress_reset() {
        let mut progress = Progress::new(5);
        progress.advance();
        progress.advance();
        assert_eq!(progress.current_index(), 2);

        progress.reset();
        assert_eq!(progress.current_index(), 0);
    }

    #[test]
    fn test_no_overflow() {
        let mut progress = Progress::new(26); // Alphabet song
        for i in 0..26 {
            assert_eq!(progress.percentage(), ((i as u32 * 100) / 26) as u8);
            progress.advance();
        }
        assert_eq!(progress.percentage(), 100);
    }
}
