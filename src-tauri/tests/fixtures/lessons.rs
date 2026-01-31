// Lesson Test Fixtures
//
// Reusable lesson configurations for testing

use piano_lessons::lesson_config::{LessonConfig, Measure, NoteEvent};

/// Simple C major scale (8 notes)
/// Good for basic testing
pub fn simple_c_scale() -> LessonConfig {
    LessonConfig {
        name: "C Major Scale".to_string(),
        description: "Simple C major scale for testing".to_string(),
        tempo: Some(120),
        time_signature: Some("4/4".to_string()),
        key_signature: Some("C major".to_string()),
        notes: vec![60, 62, 64, 65, 67, 69, 71, 72], // C D E F G A B C
        measures: vec![],
        composer: None,
        difficulty: None,
    }
}

/// Lesson with measures and single notes
/// Tests new format with measure structure
pub fn lesson_with_measures() -> LessonConfig {
    LessonConfig {
        name: "Measure Lesson".to_string(),
        description: "Lesson with explicit measures".to_string(),
        tempo: Some(100),
        time_signature: Some("4/4".to_string()),
        key_signature: Some("C major".to_string()),
        notes: vec![], // New format uses measures
        measures: vec![
            Measure {
                number: 1,
                notes: vec![
                    NoteEvent::SingleNote {
                        pitch: 60,
                        duration: 1.0,
                        dynamic: None,
                    },
                    NoteEvent::SingleNote {
                        pitch: 62,
                        duration: 1.0,
                        dynamic: None,
                    },
                    NoteEvent::SingleNote {
                        pitch: 64,
                        duration: 1.0,
                        dynamic: None,
                    },
                    NoteEvent::SingleNote {
                        pitch: 65,
                        duration: 1.0,
                        dynamic: None,
                    },
                ],
            },
            Measure {
                number: 2,
                notes: vec![
                    NoteEvent::SingleNote {
                        pitch: 67,
                        duration: 1.0,
                        dynamic: None,
                    },
                    NoteEvent::SingleNote {
                        pitch: 69,
                        duration: 1.0,
                        dynamic: None,
                    },
                    NoteEvent::SingleNote {
                        pitch: 71,
                        duration: 1.0,
                        dynamic: None,
                    },
                    NoteEvent::SingleNote {
                        pitch: 72,
                        duration: 1.0,
                        dynamic: None,
                    },
                ],
            },
        ],
        composer: None,
        difficulty: Some("beginner".to_string()),
    }
}

/// Lesson with chords (C-F-G-C progression)
/// Tests chord handling
pub fn chord_progression() -> LessonConfig {
    LessonConfig {
        name: "Basic Chord Progression".to_string(),
        description: "I-IV-V-I progression in C major".to_string(),
        tempo: Some(80),
        time_signature: Some("4/4".to_string()),
        key_signature: Some("C major".to_string()),
        notes: vec![],
        measures: vec![
            Measure {
                number: 1,
                notes: vec![
                    NoteEvent::ChordReference {
                        chord: "C Major".to_string(),
                        duration: 4.0,
                        dynamic: None,
                        hand: Some("right".to_string()),
                    },
                ],
            },
            Measure {
                number: 2,
                notes: vec![
                    NoteEvent::ChordReference {
                        chord: "F Major".to_string(),
                        duration: 4.0,
                        dynamic: None,
                        hand: Some("right".to_string()),
                    },
                ],
            },
            Measure {
                number: 3,
                notes: vec![
                    NoteEvent::ChordReference {
                        chord: "G Major".to_string(),
                        duration: 4.0,
                        dynamic: None,
                        hand: Some("right".to_string()),
                    },
                ],
            },
            Measure {
                number: 4,
                notes: vec![
                    NoteEvent::ChordReference {
                        chord: "C Major".to_string(),
                        duration: 4.0,
                        dynamic: None,
                        hand: Some("right".to_string()),
                    },
                ],
            },
        ],
        composer: Some("Test Composer".to_string()),
        difficulty: Some("beginner".to_string()),
    }
}

/// Lesson with inline chord definition
/// Tests inline chord vs chord reference
pub fn lesson_with_inline_chord() -> LessonConfig {
    LessonConfig {
        name: "Inline Chord".to_string(),
        description: "Lesson with inline chord definition".to_string(),
        tempo: Some(120),
        time_signature: Some("4/4".to_string()),
        key_signature: Some("C major".to_string()),
        notes: vec![],
        measures: vec![Measure {
            number: 1,
            notes: vec![NoteEvent::Chord {
                pitches: vec![60, 64, 67], // C E G
                name: "C Major Inline".to_string(),
                duration: 4.0,
                dynamic: Some("forte".to_string()),
                hand: Some("right".to_string()),
            }],
        }],
        composer: None,
        difficulty: None,
    }
}

/// Lesson with rests
/// Tests rest handling
pub fn lesson_with_rests() -> LessonConfig {
    LessonConfig {
        name: "Rests Test".to_string(),
        description: "Lesson containing rests".to_string(),
        tempo: Some(120),
        time_signature: Some("4/4".to_string()),
        key_signature: Some("C major".to_string()),
        notes: vec![],
        measures: vec![Measure {
            number: 1,
            notes: vec![
                NoteEvent::SingleNote {
                    pitch: 60,
                    duration: 1.0,
                    dynamic: None,
                },
                NoteEvent::Rest {
                    rest: true,
                    duration: 1.0,
                },
                NoteEvent::SingleNote {
                    pitch: 64,
                    duration: 1.0,
                    dynamic: None,
                },
                NoteEvent::Rest {
                    rest: true,
                    duration: 1.0,
                },
            ],
        }],
        composer: None,
        difficulty: None,
    }
}

/// Empty lesson (invalid)
/// Used for testing error handling
pub fn invalid_empty_lesson() -> LessonConfig {
    LessonConfig {
        name: "Empty Lesson".to_string(),
        description: "Should fail validation".to_string(),
        tempo: Some(120),
        time_signature: Some("4/4".to_string()),
        key_signature: Some("C major".to_string()),
        notes: vec![],
        measures: vec![],
        composer: None,
        difficulty: None,
    }
}

/// Lesson with invalid name (empty)
/// Used for testing validation
pub fn invalid_no_name() -> LessonConfig {
    LessonConfig {
        name: "".to_string(), // Invalid: empty name
        description: "Should fail validation".to_string(),
        tempo: Some(120),
        time_signature: Some("4/4".to_string()),
        key_signature: Some("C major".to_string()),
        notes: vec![60, 62, 64],
        measures: vec![],
        composer: None,
        difficulty: None,
    }
}

/// Fast tempo lesson
/// Tests high tempo handling
pub fn fast_tempo_lesson() -> LessonConfig {
    LessonConfig {
        name: "Allegro".to_string(),
        description: "Fast tempo lesson".to_string(),
        tempo: Some(200),
        time_signature: Some("4/4".to_string()),
        key_signature: Some("C major".to_string()),
        notes: vec![60, 62, 64, 65],
        measures: vec![],
        composer: None,
        difficulty: Some("advanced".to_string()),
    }
}

/// Slow tempo lesson
/// Tests low tempo handling
pub fn slow_tempo_lesson() -> LessonConfig {
    LessonConfig {
        name: "Adagio".to_string(),
        description: "Slow tempo lesson".to_string(),
        tempo: Some(60),
        time_signature: Some("4/4".to_string()),
        key_signature: Some("C major".to_string()),
        notes: vec![60, 62, 64, 65],
        measures: vec![],
        composer: None,
        difficulty: Some("beginner".to_string()),
    }
}
