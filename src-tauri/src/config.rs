// Configuration management for the Piano Learning App
// Loads configuration from:
// 1. Default values
// 2. config.toml file (if present)
// 3. Environment variables (prefixed with ROLAND_)

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::OnceLock;

static APP_CONFIG: OnceLock<AppConfig> = OnceLock::new();

/// Main application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub midi: MidiConfig,
    pub evaluation: EvaluationConfig,
    pub paths: PathsConfig,
    pub staff: StaffConfig,
}

/// MIDI-related configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MidiConfig {
    /// Group notes within this many milliseconds into a chord
    pub chord_grouping_ms: u64,
    /// Split point between left and right hand (MIDI note number)
    pub hand_split_point: u8,
}

/// Evaluation tolerances configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvaluationConfig {
    /// Perfect timing: ±N milliseconds
    pub timing_perfect_ms: i32,
    /// Good timing: ±N milliseconds
    pub timing_good_ms: i32,
    /// Acceptable timing: ±N milliseconds
    pub timing_acceptable_ms: i32,
    /// Duration tolerance as percentage (e.g., 20.0 = ±20%)
    pub duration_tolerance_percent: f32,
}

/// File system paths configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PathsConfig {
    /// Directory containing lesson YAML files
    pub lessons_dir: Option<PathBuf>,
}

/// Staff rendering configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StaffConfig {
    pub line_height: f32,
    pub top_y: f32,
    pub bottom_y: f32,
    pub treble_min_midi: u8,
    pub treble_max_midi: u8,
    pub bass_min_midi: u8,
    pub bass_max_midi: u8,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            midi: MidiConfig {
                chord_grouping_ms: 50,
                hand_split_point: 60, // C4
            },
            evaluation: EvaluationConfig {
                timing_perfect_ms: 50,
                timing_good_ms: 100,
                timing_acceptable_ms: 200,
                duration_tolerance_percent: 20.0,
            },
            paths: PathsConfig { lessons_dir: None },
            staff: StaffConfig {
                line_height: 10.0,
                top_y: 0.0,
                bottom_y: 40.0,
                treble_min_midi: 60, // C4
                treble_max_midi: 77, // F5
                bass_min_midi: 43,   // G2
                bass_max_midi: 60,   // C4
            },
        }
    }
}

impl AppConfig {
    /// Load configuration from multiple sources
    /// Priority: Environment variables > config.toml > defaults
    pub fn load() -> Result<Self, config::ConfigError> {
        let config_dir = Self::get_config_dir();
        let config_file = config_dir.join("config.toml");

        let mut builder = config::Config::builder()
            // Start with defaults
            .add_source(config::Config::try_from(&AppConfig::default())?);

        // Add config file if it exists
        if config_file.exists() {
            builder = builder.add_source(config::File::from(config_file));
        }

        // Add environment variables (e.g., ROLAND_MIDI__CHORD_GROUPING_MS)
        builder = builder.add_source(
            config::Environment::with_prefix("ROLAND")
                .separator("__")
                .try_parsing(true),
        );

        builder.build()?.try_deserialize()
    }

    /// Get the configuration directory
    /// Uses platform-specific paths:
    /// - Windows: %APPDATA%\roland
    /// - macOS: ~/Library/Application Support/roland
    /// - Linux: ~/.config/roland
    pub fn get_config_dir() -> PathBuf {
        if let Some(proj_dirs) = directories::ProjectDirs::from("com", "pianoapp", "roland") {
            proj_dirs.config_dir().to_path_buf()
        } else {
            // Fallback to current directory
            PathBuf::from(".")
        }
    }

    /// Get the lessons directory path
    /// Priority:
    /// 1. Configured path from config.toml or environment
    /// 2. Platform-specific data directory
    /// 3. Project root detection (by finding src-tauri/Cargo.toml)
    /// 4. Common development locations
    /// 5. Fallback to "./lessons"
    pub fn get_lessons_dir(&self) -> PathBuf {
        // If explicitly configured, use that
        if let Some(ref path) = self.paths.lessons_dir {
            if path.exists() {
                return path.clone();
            }
        }

        // Try platform-specific data directory
        if let Some(proj_dirs) = directories::ProjectDirs::from("com", "pianoapp", "roland") {
            let data_dir = proj_dirs.data_dir().join("lessons");
            if data_dir.exists() {
                return data_dir;
            }
        }

        // Try to find project root by looking for src-tauri/Cargo.toml
        if let Ok(cwd) = std::env::current_dir() {
            let mut current = cwd.as_path();
            for _ in 0..5 {
                // Check if this directory has src-tauri/Cargo.toml
                let cargo_toml = current.join("src-tauri").join("Cargo.toml");
                if cargo_toml.exists() {
                    // Found project root! Check for lessons directory
                    let lessons = current.join("lessons");
                    if lessons.exists() {
                        tracing::debug!("Found project root and lessons at: {:?}", lessons);
                        return lessons.canonicalize().unwrap_or(lessons);
                    }
                }
                // Go up one directory
                match current.parent() {
                    Some(parent) => current = parent,
                    None => break,
                }
            }
        }

        // Try common development locations
        let dev_candidates = [
            PathBuf::from("lessons"),
            PathBuf::from("../lessons"),
            PathBuf::from("../../lessons"),
            PathBuf::from("../../../lessons"),
        ];

        for path in &dev_candidates {
            if path.exists() {
                tracing::debug!("Found lessons directory at: {:?}", path);
                return path.canonicalize().unwrap_or_else(|_| path.clone());
            }
        }

        // Fallback
        tracing::warn!("Lessons directory not found in any candidate location, using fallback: ./lessons");
        PathBuf::from("lessons")
    }
}

/// Get the global application configuration
/// Initializes on first call
pub fn get_config() -> &'static AppConfig {
    APP_CONFIG.get_or_init(|| {
        AppConfig::load().unwrap_or_else(|e| {
            tracing::warn!("Failed to load config, using defaults: {}", e);
            AppConfig::default()
        })
    })
}

/// Legacy constants for backward compatibility
/// These now reference the centralized configuration
pub mod legacy {
    use super::get_config;

    pub fn midi_chord_grouping_ms() -> u64 {
        get_config().midi.chord_grouping_ms
    }

    pub fn midi_hand_split_point() -> u8 {
        get_config().midi.hand_split_point
    }

    pub fn timing_perfect_ms() -> i32 {
        get_config().evaluation.timing_perfect_ms
    }

    pub fn timing_good_ms() -> i32 {
        get_config().evaluation.timing_good_ms
    }

    pub fn timing_acceptable_ms() -> i32 {
        get_config().evaluation.timing_acceptable_ms
    }

    pub fn duration_tolerance_percent() -> f32 {
        get_config().evaluation.duration_tolerance_percent
    }

    pub fn staff_line_height() -> f32 {
        get_config().staff.line_height
    }

    pub fn staff_top_y() -> f32 {
        get_config().staff.top_y
    }

    pub fn staff_bottom_y() -> f32 {
        get_config().staff.bottom_y
    }

    pub fn treble_min_midi() -> u8 {
        get_config().staff.treble_min_midi
    }

    pub fn treble_max_midi() -> u8 {
        get_config().staff.treble_max_midi
    }

    pub fn bass_min_midi() -> u8 {
        get_config().staff.bass_min_midi
    }

    pub fn bass_max_midi() -> u8 {
        get_config().staff.bass_max_midi
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = AppConfig::default();
        assert_eq!(config.midi.chord_grouping_ms, 50);
        assert_eq!(config.midi.hand_split_point, 60);
        assert_eq!(config.evaluation.timing_perfect_ms, 50);
    }

    #[test]
    fn test_get_lessons_dir_fallback() {
        let config = AppConfig::default();
        let lessons_dir = config.get_lessons_dir();
        // Should return a path (even if it doesn't exist)
        assert!(!lessons_dir.as_os_str().is_empty());
    }

    #[test]
    fn test_legacy_constants() {
        assert_eq!(legacy::midi_chord_grouping_ms(), 50);
        assert_eq!(legacy::midi_hand_split_point(), 60);
    }
}
