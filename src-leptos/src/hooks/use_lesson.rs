// use_lesson Hook - Load and manage lesson state
// Single responsibility: Load lesson from backend via load_lesson command
// Returns: lesson data and loading state
//
// Phase 4: Using mock data for standalone Leptos development
// Phase 5+: Will use actual Tauri commands

use crate::models::lesson::{Lesson, Measure};
use crate::models::note::{Note, SingleNote};
use leptos::*;

/// Metadata for lesson listing
#[derive(Debug, Clone)]
pub struct LessonMetadata {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub duration_seconds: f32,
}

/// Get list of available lessons (mock data for now)
pub fn get_available_lessons() -> Vec<LessonMetadata> {
    vec![
        LessonMetadata {
            id: "alphabet".to_string(),
            title: "Musical Alphabet".to_string(),
            description: Some("Learn the notes A through G".to_string()),
            duration_seconds: 30.0,
        },
        LessonMetadata {
            id: "simple_chords".to_string(),
            title: "Simple Chords".to_string(),
            description: Some("Basic chord progressions".to_string()),
            duration_seconds: 45.0,
        },
        LessonMetadata {
            id: "scales".to_string(),
            title: "C Major Scale".to_string(),
            description: Some("Practice the C major scale".to_string()),
            duration_seconds: 60.0,
        },
        LessonMetadata {
            id: "demo".to_string(),
            title: "Note Duration Demo".to_string(),
            description: Some("Whole, half, quarter, and eighth notes".to_string()),
            duration_seconds: 20.0,
        },
    ]
}

/// Load a lesson by ID (mock data for Phase 4)
/// Returns lesson matching the ID, or a default demo lesson
pub fn load_lesson_mock(lesson_id: &str) -> Lesson {
    match lesson_id {
        "alphabet" => create_alphabet_lesson(),
        "scales" => create_scales_lesson(),
        "demo" => create_duration_demo_lesson(),
        _ => create_duration_demo_lesson(), // Default
    }
}

/// Hook for loading lesson data
/// Returns a Signal containing the current lesson
pub fn use_lesson(lesson_id: RwSignal<String>) -> (ReadSignal<Option<Lesson>>, ReadSignal<bool>) {
    let (lesson, set_lesson) = create_signal(None::<Lesson>);
    let (loading, set_loading) = create_signal(false);

    // Effect that loads lesson when lesson_id changes
    create_effect(move |_| {
        let id = lesson_id.get();
        if !id.is_empty() {
            set_loading.set(true);
            // In Phase 5+, this will be an async Tauri command
            // For now, we load mock data synchronously
            let loaded_lesson = load_lesson_mock(&id);
            set_lesson.set(Some(loaded_lesson));
            set_loading.set(false);
        }
    });

    (lesson, loading)
}

// ===== Mock Lesson Generators =====

fn create_alphabet_lesson() -> Lesson {
    // Notes: C4 D4 E4 F4 G4 A4 B4 C5
    let notes: Vec<Note> = vec![
        (60, 1.0), // C4
        (62, 1.0), // D4
        (64, 1.0), // E4
        (65, 1.0), // F4
        (67, 1.0), // G4
        (69, 1.0), // A4
        (71, 1.0), // B4
        (72, 1.0), // C5
    ]
    .into_iter()
    .map(|(midi, duration)| {
        Note::Single(SingleNote {
            midi,
            duration,
            hand: "right".to_string(),
            accidental: None,
        })
    })
    .collect();

    // Split into measures (4 notes each for 4/4 time)
    let measures = vec![
        Measure {
            number: 1,
            notes: notes[0..4].to_vec(),
        },
        Measure {
            number: 2,
            notes: notes[4..8].to_vec(),
        },
    ];

    Lesson {
        title: "Musical Alphabet".to_string(),
        description: Some("Learn the notes from C to C".to_string()),
        tempo: 90,
        time_signature: "4/4".to_string(),
        key_signature: "C major".to_string(),
        total_beats: 8.0,
        total_seconds: 5.33,
        measures,
    }
}

fn create_scales_lesson() -> Lesson {
    // C Major Scale: C4 D4 E4 F4 G4 A4 B4 C5 (ascending)
    let notes: Vec<Note> = vec![
        60, 62, 64, 65, 67, 69, 71, 72, // Ascending
    ]
    .into_iter()
    .map(|midi| {
        Note::Single(SingleNote {
            midi,
            duration: 1.0,
            hand: "right".to_string(),
            accidental: None,
        })
    })
    .collect();

    let measures = vec![
        Measure {
            number: 1,
            notes: notes[0..4].to_vec(),
        },
        Measure {
            number: 2,
            notes: notes[4..8].to_vec(),
        },
    ];

    Lesson {
        title: "C Major Scale".to_string(),
        description: Some("Practice ascending C major scale".to_string()),
        tempo: 80,
        time_signature: "4/4".to_string(),
        key_signature: "C major".to_string(),
        total_beats: 8.0,
        total_seconds: 6.0,
        measures,
    }
}

fn create_duration_demo_lesson() -> Lesson {
    // Same as the hardcoded lesson in lesson_stage.rs
    // Measure 1: 1 whole note (C4)
    // Measure 2: 2 half notes (D4, E4)
    // Measure 3: 4 quarter notes (F4, G4, A4, B4)
    // Measure 4: 8 eighth notes (C5-C6)

    let measure1 = Measure {
        number: 1,
        notes: vec![Note::Single(SingleNote {
            midi: 60,
            duration: 4.0, // Whole note
            hand: "right".to_string(),
            accidental: None,
        })],
    };

    let measure2 = Measure {
        number: 2,
        notes: vec![
            Note::Single(SingleNote {
                midi: 62,
                duration: 2.0, // Half note
                hand: "right".to_string(),
                accidental: None,
            }),
            Note::Single(SingleNote {
                midi: 64,
                duration: 2.0, // Half note
                hand: "right".to_string(),
                accidental: None,
            }),
        ],
    };

    let measure3 = Measure {
        number: 3,
        notes: vec![
            Note::Single(SingleNote {
                midi: 65,
                duration: 1.0,
                hand: "right".to_string(),
                accidental: None,
            }),
            Note::Single(SingleNote {
                midi: 67,
                duration: 1.0,
                hand: "right".to_string(),
                accidental: None,
            }),
            Note::Single(SingleNote {
                midi: 69,
                duration: 1.0,
                hand: "right".to_string(),
                accidental: None,
            }),
            Note::Single(SingleNote {
                midi: 71,
                duration: 1.0,
                hand: "right".to_string(),
                accidental: None,
            }),
        ],
    };

    let measure4 = Measure {
        number: 4,
        notes: vec![72, 74, 76, 77, 79, 81, 83, 84]
            .into_iter()
            .map(|midi| {
                Note::Single(SingleNote {
                    midi,
                    duration: 0.5, // Eighth note
                    hand: "right".to_string(),
                    accidental: None,
                })
            })
            .collect(),
    };

    Lesson {
        title: "Note Duration Demo".to_string(),
        description: Some("Whole → Half → Quarter → Eighth notes".to_string()),
        tempo: 120,
        time_signature: "4/4".to_string(),
        key_signature: "C major".to_string(),
        total_beats: 16.0,
        total_seconds: 8.0,
        measures: vec![measure1, measure2, measure3, measure4],
    }
}
