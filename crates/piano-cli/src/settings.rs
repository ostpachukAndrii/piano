//! Application settings

use serde::{Deserialize, Serialize};
use std::fs;

/// Difficulty level for chord timing tolerance
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum Difficulty {
    /// Easy: 300ms tolerance for chord timing (very forgiving)
    Easy,
    /// Medium: 150ms tolerance for chord timing (moderate)
    Medium,
    /// Hard: 50ms tolerance for chord timing (strict, near-simultaneous)
    Hard,
}

impl Difficulty {
    pub fn display_name(&self) -> &'static str {
        match self {
            Difficulty::Easy => "Easy (300ms chord tolerance)",
            Difficulty::Medium => "Medium (150ms chord tolerance)",
            Difficulty::Hard => "Hard (50ms chord tolerance)",
        }
    }

    pub fn from_index(idx: usize) -> Self {
        match idx {
            0 => Difficulty::Easy,
            1 => Difficulty::Medium,
            2 => Difficulty::Hard,
            _ => Difficulty::Medium,
        }
    }

    /// Get the chord timing tolerance in milliseconds
    pub fn chord_tolerance_ms(&self) -> u64 {
        match self {
            Difficulty::Easy => 300,
            Difficulty::Medium => 150,
            Difficulty::Hard => 50,
        }
    }
}

impl Default for Difficulty {
    fn default() -> Self {
        Difficulty::Medium
    }
}

/// Lesson behavior when an incorrect note is played
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum IncorrectNoteBehavior {
    /// Wait until the correct note is played
    Wait,
    /// Skip to the next note
    Skip,
}

impl IncorrectNoteBehavior {
    pub fn display_name(&self) -> &'static str {
        match self {
            IncorrectNoteBehavior::Wait => "Wait for correct note (default)",
            IncorrectNoteBehavior::Skip => "Skip to next note",
        }
    }

    pub fn from_index(idx: usize) -> Self {
        match idx {
            0 => IncorrectNoteBehavior::Wait,
            1 => IncorrectNoteBehavior::Skip,
            _ => IncorrectNoteBehavior::Wait,
        }
    }
}

/// Application settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub incorrect_note_behavior: IncorrectNoteBehavior,
    pub difficulty: Difficulty,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            incorrect_note_behavior: IncorrectNoteBehavior::Wait,
            difficulty: Difficulty::Medium,
        }
    }
}

impl Settings {
    /// Load settings from configuration file
    pub fn load() -> Self {
        let config_path = Self::config_path();

        if config_path.exists() {
            if let Ok(content) = fs::read_to_string(&config_path) {
                if let Ok(settings) = serde_json::from_str::<Settings>(&content) {
                    return settings;
                }
            }
        }

        Self::default()
    }

    /// Save settings to configuration file
    pub fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        let config_dir = Self::config_dir();

        // Create config directory if it doesn't exist
        fs::create_dir_all(&config_dir)?;

        let config_path = Self::config_path();
        let content = serde_json::to_string_pretty(self)?;
        fs::write(config_path, content)?;

        Ok(())
    }

    fn config_dir() -> std::path::PathBuf {
        #[cfg(target_os = "windows")]
        {
            let app_data = std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
            std::path::PathBuf::from(format!("{}\\PianoLesson", app_data))
        }

        #[cfg(target_os = "macos")]
        {
            let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
            std::path::PathBuf::from(format!("{}/.config/pianolesson", home))
        }

        #[cfg(target_os = "linux")]
        {
            let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
            std::path::PathBuf::from(format!("{}/.config/pianolesson", home))
        }

        #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
        {
            std::path::PathBuf::from(".")
        }
    }

    fn config_path() -> std::path::PathBuf {
        Self::config_dir().join("settings.json")
    }
}
