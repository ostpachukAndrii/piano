// Lesson Stage Container - Main game component
// Phase 4: Dynamic lesson loading with lesson selector
// Phase 5: MIDI device integration with note highlighting
// This is where the lesson is displayed and played

use crate::components::molecules::MidiDeviceSelector;
use crate::hooks::{get_available_lessons, load_lesson_mock, use_midi, LessonMetadata};
use crate::models::lesson::Lesson;
use crate::models::note::Note;
use crate::utils::midi_to_position::{midi_to_y, stem_direction};
use leptos::*;

/// Note duration in beats (4/4 time: quarter = 1 beat)
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Duration {
    Whole,   // 4 beats - hollow head, no stem
    Half,    // 2 beats - hollow head, has stem
    Quarter, // 1 beat  - filled head, has stem
    Eighth,  // 0.5 beats - filled head, stem + flag
}

impl Duration {
    /// Convert from beat duration (f32) to Duration enum
    fn from_beats(beats: f32) -> Self {
        if beats >= 3.5 {
            Duration::Whole
        } else if beats >= 1.5 {
            Duration::Half
        } else if beats >= 0.75 {
            Duration::Quarter
        } else {
            Duration::Eighth
        }
    }

    /// How many beats this duration takes in 4/4 time
    fn beats(&self) -> f32 {
        match self {
            Duration::Whole => 4.0,
            Duration::Half => 2.0,
            Duration::Quarter => 1.0,
            Duration::Eighth => 0.5,
        }
    }

    /// Does this note have a stem?
    fn has_stem(&self) -> bool {
        !matches!(self, Duration::Whole)
    }

    /// Does this note have a flag?
    fn has_flag(&self) -> bool {
        matches!(self, Duration::Eighth)
    }
}

/// Internal note representation for rendering
#[derive(Clone, Copy)]
struct NoteData {
    midi: u8,
    duration: Duration,
}

/// Convert a Lesson model note to internal NoteData
fn note_to_note_data(note: &Note) -> Option<NoteData> {
    match note {
        Note::Single(single) => Some(NoteData {
            midi: single.midi,
            duration: Duration::from_beats(single.duration),
        }),
        Note::Chord(chord) => {
            // For chords, take the first note (we'll improve this later)
            chord.midi.first().map(|&midi| NoteData {
                midi,
                duration: Duration::from_beats(chord.duration),
            })
        }
        Note::Rest(_) => None, // Skip rests for now
    }
}

/// Convert Lesson to flat list of NoteData
fn lesson_to_notes(lesson: &Lesson) -> Vec<NoteData> {
    lesson
        .measures
        .iter()
        .flat_map(|m| m.notes.iter().filter_map(note_to_note_data))
        .collect()
}

/// Layout constants
const STAFF_END_X: f32 = 1150.0;
const STAFF_TOP_Y: f32 = 40.0;
const STAFF_BOTTOM_Y: f32 = 120.0;
const FIRST_NOTE_X: f32 = 160.0;
const BAR_GAP: f32 = 20.0;

/// Calculate note and bar positions for rendering
fn calculate_positions(measures: &[Vec<NoteData>]) -> (Vec<(f32, NoteData)>, Vec<f32>) {
    let num_measures = measures.len() as f32;
    if num_measures == 0.0 {
        return (vec![], vec![]);
    }

    let available_width = STAFF_END_X - FIRST_NOTE_X;
    let bar_width = (available_width - (num_measures - 1.0) * BAR_GAP) / num_measures;

    let mut note_elements: Vec<(f32, NoteData)> = Vec::new();
    let mut bar_line_positions: Vec<f32> = Vec::new();

    for (measure_idx, measure) in measures.iter().enumerate() {
        let bar_start_x = FIRST_NOTE_X + (measure_idx as f32) * (bar_width + BAR_GAP);
        let mut time_position: f32 = 0.0;

        for note in measure.iter() {
            let note_x = bar_start_x + (time_position * bar_width);
            note_elements.push((note_x, *note));
            time_position += note.duration.beats() / 4.0;
        }

        let bar_line_x = bar_start_x + bar_width;
        bar_line_positions.push(bar_line_x);
    }

    (note_elements, bar_line_positions)
}

/// Organize notes into measures (4 beats each for 4/4)
fn organize_into_measures(notes: &[NoteData]) -> Vec<Vec<NoteData>> {
    let mut measures: Vec<Vec<NoteData>> = Vec::new();
    let mut current_measure: Vec<NoteData> = Vec::new();
    let mut beats_in_current_measure = 0.0;

    for note in notes {
        let note_beats = note.duration.beats();

        if beats_in_current_measure + note_beats > 4.0 {
            if !current_measure.is_empty() {
                measures.push(current_measure);
                current_measure = Vec::new();
            }
            beats_in_current_measure = 0.0;
        }

        current_measure.push(*note);
        beats_in_current_measure += note_beats;

        if (beats_in_current_measure - 4.0).abs() < 0.001 {
            measures.push(current_measure);
            current_measure = Vec::new();
            beats_in_current_measure = 0.0;
        }
    }

    if !current_measure.is_empty() {
        measures.push(current_measure);
    }

    measures
}

/// Lesson selector dropdown component
#[component]
fn LessonSelector(lessons: Vec<LessonMetadata>, selected_id: RwSignal<String>) -> impl IntoView {
    view! {
        <div class="lesson-selector" style="margin-bottom: 20px;">
            <label for="lesson-select" style="margin-right: 10px; font-weight: bold;">
                "Select Lesson:"
            </label>
            <select
                id="lesson-select"
                style="padding: 8px 16px; font-size: 16px; border-radius: 4px; border: 1px solid #ccc;"
                on:change=move |ev| {
                    let value = event_target_value(&ev);
                    selected_id.set(value);
                }
            >
                {lessons.iter().map(|l| {
                    let id = l.id.clone();
                    let title = l.title.clone();
                    let desc = l.description.clone().unwrap_or_default();
                    view! {
                        <option value={id.clone()}>
                            {format!("{} - {}", title, desc)}
                        </option>
                    }
                }).collect::<Vec<_>>()}
            </select>
        </div>
    }
}

/// Main lesson stage component with dynamic loading
#[component]
pub fn LessonStage() -> impl IntoView {
    // Available lessons
    let lessons = get_available_lessons();

    // Current selected lesson ID
    let selected_lesson_id = create_rw_signal("demo".to_string());

    // MIDI hook for active notes
    let midi = use_midi();
    let active_notes = midi.active_notes;

    // Derived: load the lesson when ID changes
    let lesson_data = create_memo(move |_| {
        let id = selected_lesson_id.get();
        load_lesson_mock(&id)
    });

    view! {
        <div class="lesson-stage">
            // Control panel row: Lesson selector and MIDI device
            <div class="control-panel" style="display: flex; gap: 20px; margin-bottom: 20px; align-items: flex-start;">
                // Lesson selector
                <LessonSelector lessons=lessons.clone() selected_id=selected_lesson_id />

                // MIDI device selector (Phase 5)
                <MidiDeviceSelector />
            </div>

            // Dynamic lesson content
            {move || {
                let lesson = lesson_data.get();
                let notes = active_notes.get();
                render_lesson_view(lesson, notes)
            }}
        </div>
    }
}

/// Render a lesson as SVG staff
fn render_lesson_view(lesson: Lesson, active_midi_notes: Vec<u8>) -> impl IntoView {
    let notes = lesson_to_notes(&lesson);
    let measures = organize_into_measures(&notes);
    let (note_elements, bar_line_positions) = calculate_positions(&measures);

    view! {
        <div class="lesson-content">
            <div class="lesson-header">
                <h2>{lesson.title.clone()}</h2>
                <p>{lesson.description.clone().unwrap_or_default()}</p>
                <p class="lesson-info" style="color: #666; font-size: 14px;">
                    {format!("Tempo: {} BPM | Time: {} | Key: {}",
                        lesson.tempo, lesson.time_signature, lesson.key_signature)}
                </p>
                // Show active notes for debugging
                {if !active_midi_notes.is_empty() {
                    let notes_str = active_midi_notes.iter()
                        .map(|n| format!("{}", n))
                        .collect::<Vec<_>>()
                        .join(", ");
                    Some(view! {
                        <p class="active-notes" style="color: #22c55e; font-weight: bold;">
                            "Playing: " {notes_str}
                        </p>
                    })
                } else {
                    None
                }}
            </div>

            <div class="grand-staff">
                <svg viewBox="0 0 1200 200" class="grand-staff-svg" style="max-width: 100%; height: auto; background-color: white;">
                    <rect x="45" y="30" width="1110" height="100" fill="white" />

                    <g class="treble-staff">
                        // Staff lines
                        <line x1="50" y1="40" x2="1150" y2="40" stroke="black" stroke-width="1" />
                        <line x1="50" y1="60" x2="1150" y2="60" stroke="black" stroke-width="1" />
                        <line x1="50" y1="80" x2="1150" y2="80" stroke="black" stroke-width="1" />
                        <line x1="50" y1="100" x2="1150" y2="100" stroke="black" stroke-width="1" />
                        <line x1="50" y1="120" x2="1150" y2="120" stroke="black" stroke-width="1" />

                        // Starting bar line
                        <line x1="50" y1="40" x2="50" y2="120" stroke="black" stroke-width="2" />

                        // Treble clef
                        <text x="60" y="110" font-size="56" font-family="serif">"𝄞"</text>

                        // Time signature
                        <text x="115" y="70" font-size="28" font-weight="bold" font-family="serif">"4"</text>
                        <text x="115" y="105" font-size="28" font-weight="bold" font-family="serif">"4"</text>

                        // Bar lines
                        {bar_line_positions.iter().enumerate().map(|(idx, x)| {
                            let is_last = idx == bar_line_positions.len() - 1;
                            if is_last {
                                view! {
                                    <g class="double-bar-line">
                                        <line x1={*x - 5.0} y1=STAFF_TOP_Y x2={*x - 5.0} y2=STAFF_BOTTOM_Y stroke="black" stroke-width="1" />
                                        <line x1={*x} y1=STAFF_TOP_Y x2={*x} y2=STAFF_BOTTOM_Y stroke="black" stroke-width="3" />
                                    </g>
                                }
                            } else {
                                view! {
                                    <g class="bar-line">
                                        <line x1={*x} y1=STAFF_TOP_Y x2={*x} y2=STAFF_BOTTOM_Y stroke="black" stroke-width="1" />
                                    </g>
                                }
                            }
                        }).collect::<Vec<_>>()}

                        // Notes
                        {note_elements.into_iter().map(|(x, note)| {
                            let is_active = active_midi_notes.contains(&note.midi);
                            render_note(x, note, is_active)
                        }).collect::<Vec<_>>()}
                    </g>
                </svg>
            </div>

            <div class="lesson-footer">
                <div class="legend">
                    <p><strong>"Note Durations in 4/4 Time:"</strong></p>
                    <ul style="list-style: none; padding: 0; display: flex; gap: 20px; flex-wrap: wrap;">
                        <li>"𝅝 Whole = 4 beats"</li>
                        <li>"𝅗𝅥 Half = 2 beats"</li>
                        <li>"♩ Quarter = 1 beat"</li>
                        <li>"♪ Eighth = 0.5 beat"</li>
                    </ul>
                </div>
            </div>
        </div>
    }
}

/// Render a single note with optional highlighting
fn render_note(x: f32, note: NoteData, is_active: bool) -> impl IntoView {
    let y = midi_to_y(note.midi, "treble");
    let dir = stem_direction(note.midi, "treble");
    let has_stem = note.duration.has_stem();
    let has_flag = note.duration.has_flag();

    let stem_x = if dir == "up" { x + 7.0 } else { x - 7.0 };
    let stem_y1 = if dir == "up" { y - 35.0 } else { y };
    let stem_y2 = if dir == "up" { y } else { y + 35.0 };

    let rx = 8.0;
    let ry = 6.0;
    let stroke_width = if note.duration == Duration::Whole || note.duration == Duration::Half {
        2.0
    } else {
        1.5
    };

    // Highlight colors for active notes
    let highlight_stroke = if is_active { "#22c55e" } else { "black" };
    let highlight_fill_hollow = if is_active { "#dcfce7" } else { "white" };
    let highlight_fill_solid = if is_active { "#22c55e" } else { "black" };
    let glow_filter = if is_active {
        "drop-shadow(0 0 6px #22c55e)"
    } else {
        "none"
    };

    let needs_ledger_c4 = note.midi == 60;
    let needs_ledger_above = y < STAFF_TOP_Y;

    view! {
        <g class="note" style=format!("filter: {}", glow_filter)>
            // Ledger line for C4
            {if needs_ledger_c4 {
                Some(view! {
                    <line x1={x - 12.0} y1={y} x2={x + 12.0} y2={y} stroke={highlight_stroke} stroke-width="1" />
                })
            } else {
                None
            }}

            // Ledger lines above staff
            {if needs_ledger_above {
                let ledger_count = ((STAFF_TOP_Y - y) / 20.0).ceil() as i32;
                let ledger_views: Vec<_> = (0..ledger_count).map(|i| {
                    let ledger_y = STAFF_TOP_Y - ((i as f32 + 1.0) * 20.0);
                    view! {
                        <line x1={x - 12.0} y1={ledger_y} x2={x + 12.0} y2={ledger_y} stroke={highlight_stroke} stroke-width="1" />
                    }
                }).collect();
                Some(ledger_views)
            } else {
                None
            }}

            // Notehead with highlighting
            {match note.duration {
                Duration::Whole | Duration::Half => {
                    view! {
                        <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={highlight_fill_hollow} stroke={highlight_stroke} stroke-width=stroke_width />
                    }
                }
                Duration::Quarter | Duration::Eighth => {
                    view! {
                        <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={highlight_fill_solid} stroke={highlight_stroke} stroke-width=stroke_width />
                    }
                }
            }}

            // Stem
            {if has_stem {
                Some(view! {
                    <line x1={stem_x} y1={stem_y1} x2={stem_x} y2={stem_y2} stroke={highlight_stroke} stroke-width="2" />
                })
            } else {
                None
            }}

            // Flag for eighth notes
            {if has_flag {
                let flag_path = if dir == "up" {
                    format!("M {} {} q 12 15 0 30", stem_x, stem_y1)
                } else {
                    format!("M {} {} q 12 -15 0 -30", stem_x, stem_y2)
                };
                Some(view! {
                    <path d={flag_path} fill="none" stroke={highlight_stroke} stroke-width="2" />
                })
            } else {
                None
            }}
        </g>
    }
}
