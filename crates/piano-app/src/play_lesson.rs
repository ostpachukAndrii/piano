//! Play Lesson Use Case
//!
//! Main use case: User selects a lesson and plays it on their MIDI device.

use crate::error::AppError;
use crate::lesson_player::LessonPlayer;
use piano_domain::NoteName;
use piano_lessons::LessonRepository;
use piano_midi::MidiDeviceManager;

/// Play Lesson use case
pub struct PlayLessonUseCase;

impl PlayLessonUseCase {
    /// Execute the play lesson use case
    pub fn execute(
        lesson_name: &str,
        note_name: NoteName,
        device_index: usize,
        lessons_dir: &str,
        chord_tolerance_ms: u64,
    ) -> Result<(LessonPlayer, String), AppError> {
        // Load lesson
        let repository = LessonRepository::new(lessons_dir);
        let lesson = repository
            .load_by_name(lesson_name)
            .map_err(|e| AppError::LessonError(e.to_string()))?;

        // Get MIDI device
        let device_manager = MidiDeviceManager::new()?;
        let device = device_manager.get_device(device_index)?;

        // Create lesson player with timing tolerance
        let player = LessonPlayer::with_tolerance(lesson, note_name, chord_tolerance_ms);

        Ok((player, device.name))
    }

    /// List available lessons
    pub fn list_lessons(lessons_dir: &str) -> Result<Vec<String>, AppError> {
        let repository = LessonRepository::new(lessons_dir);
        repository
            .list_available()
            .map_err(|e| AppError::LessonError(e.to_string()))
    }

    /// List available MIDI devices
    pub fn list_devices() -> Result<Vec<(usize, String)>, AppError> {
        let manager = MidiDeviceManager::new()?;
        let devices = manager.list_devices()?;
        Ok(devices.iter().map(|d| (d.port, d.name.clone())).collect())
    }
}
