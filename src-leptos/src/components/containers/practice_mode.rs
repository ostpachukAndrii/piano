// Practice Mode Container - Game mode selector and implementation
// Supports: Waiting (step-by-step), Drill (random), Tempo (rhythm)

use crate::components::molecules::FeedbackBadge;
use crate::components::organisms::PerformanceStatsCompact;
use crate::hooks::use_evaluation;
use leptos::*;

/// Practice mode type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum PracticeType {
    #[default]
    Waiting,
    Drill,
    Tempo,
}

impl PracticeType {
    pub fn label(&self) -> &'static str {
        match self {
            PracticeType::Waiting => "Waiting Mode",
            PracticeType::Drill => "Drill Mode",
            PracticeType::Tempo => "Tempo Mode",
        }
    }

    pub fn description(&self) -> &'static str {
        match self {
            PracticeType::Waiting => "Play each note at your own pace",
            PracticeType::Drill => "Random notes, immediate feedback",
            PracticeType::Tempo => "Play with the metronome",
        }
    }
}

/// Main practice mode selector component
#[component]
pub fn PracticeMode() -> impl IntoView {
    let (selected_mode, set_selected_mode) = create_signal(None::<PracticeType>);

    view! {
        <div class="practice-mode">
            {move || match selected_mode.get() {
                None => view! {
                    <PracticeModeSelector on_select=set_selected_mode />
                }.into_view(),
                Some(PracticeType::Waiting) => view! {
                    <WaitingMode on_back=move |_| set_selected_mode.set(None) />
                }.into_view(),
                Some(PracticeType::Drill) => view! {
                    <DrillMode on_back=move |_| set_selected_mode.set(None) />
                }.into_view(),
                Some(PracticeType::Tempo) => view! {
                    <TempoMode on_back=move |_| set_selected_mode.set(None) />
                }.into_view(),
            }}
        </div>
    }
}

/// Mode selector screen
#[component]
fn PracticeModeSelector(on_select: WriteSignal<Option<PracticeType>>) -> impl IntoView {
    view! {
        <div
            class="practice-mode-selector"
            style="display: flex; flex-direction: column; gap: 16px; padding: 24px; max-width: 600px; margin: 0 auto;"
        >
            <h2 style="text-align: center; font-size: 24px; margin-bottom: 16px;">"Choose Practice Mode"</h2>

            <ModeButton
                mode=PracticeType::Waiting
                icon="⏳"
                on_click=move |_| on_select.set(Some(PracticeType::Waiting))
            />
            <ModeButton
                mode=PracticeType::Drill
                icon="🎯"
                on_click=move |_| on_select.set(Some(PracticeType::Drill))
            />
            <ModeButton
                mode=PracticeType::Tempo
                icon="🎵"
                on_click=move |_| on_select.set(Some(PracticeType::Tempo))
            />
        </div>
    }
}

/// Individual mode button
#[component]
fn ModeButton<F>(mode: PracticeType, icon: &'static str, on_click: F) -> impl IntoView
where
    F: Fn(web_sys::MouseEvent) + 'static,
{
    view! {
        <button
            style="display: flex; align-items: center; gap: 16px; padding: 16px 24px; \
                   background: #1f2937; border: 2px solid #374151; border-radius: 8px; \
                   color: white; cursor: pointer; transition: all 0.2s; text-align: left;"
            on:click=on_click
        >
            <span style="font-size: 32px;">{icon}</span>
            <div>
                <div style="font-size: 18px; font-weight: bold;">{mode.label()}</div>
                <div style="font-size: 14px; color: #9ca3af;">{mode.description()}</div>
            </div>
        </button>
    }
}

/// Waiting Mode - Play notes at your own pace
#[component]
fn WaitingMode<F>(on_back: F) -> impl IntoView
where
    F: Fn(web_sys::MouseEvent) + 'static + Clone,
{
    let evaluation = use_evaluation();
    let stats = evaluation.stats;
    let last_result = evaluation.last_result;
    let show_feedback = evaluation.show_feedback;
    let check_note = evaluation.check_note;

    // Current note index
    let (current_note_idx, set_current_note_idx) = create_signal(0_usize);

    // Demo notes (would come from lesson in real implementation)
    let demo_notes: Vec<u8> = vec![60, 62, 64, 65, 67, 69, 71, 72]; // C major scale
    let total_notes = demo_notes.len();

    // Clone for each closure
    let notes_for_correct = demo_notes.clone();
    let notes_for_wrong = demo_notes.clone();
    let notes_for_display = demo_notes;

    // Simulate playing correct note
    let play_correct = move |_| {
        let idx = current_note_idx.get();
        if idx < total_notes {
            let expected = notes_for_correct[idx];
            check_note.set(Some((expected, expected))); // Play correct note
            set_current_note_idx.set(idx + 1);
        }
    };

    // Simulate playing wrong note
    let play_wrong = move |_| {
        let idx = current_note_idx.get();
        if idx < total_notes {
            let expected = notes_for_wrong[idx];
            check_note.set(Some((expected + 1, expected))); // Play wrong note
        }
    };

    let on_back_clone = on_back.clone();

    view! {
        <div class="waiting-mode" style="padding: 24px;">
            // Header with back button
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <button
                    style="padding: 8px 16px; background: #374151; border: none; border-radius: 4px; color: white; cursor: pointer;"
                    on:click=on_back_clone
                >
                    "← Back"
                </button>
                <h2 style="margin: 0;">"Waiting Mode"</h2>
                <div style="width: 80px;"></div>
            </div>

            // Stats bar
            <div style="margin-bottom: 24px;">
                {move || {
                    let s = stats.get();
                    view! { <PerformanceStatsCompact stats=s /> }
                }}
            </div>

            // Current note display
            <div style="text-align: center; padding: 48px; background: #1f2937; border-radius: 8px; margin-bottom: 24px;">
                {move || {
                    let idx = current_note_idx.get();
                    if idx < total_notes {
                        let note = notes_for_display[idx];
                        let note_name = midi_to_note_name(note);
                        view! {
                            <div>
                                <div style="font-size: 14px; color: #9ca3af; margin-bottom: 8px;">
                                    {format!("Note {} of {}", idx + 1, total_notes)}
                                </div>
                                <div style="font-size: 72px; font-weight: bold; color: white;">
                                    {note_name}
                                </div>
                                <div style="font-size: 18px; color: #6b7280; margin-top: 8px;">
                                    {format!("MIDI: {}", note)}
                                </div>
                            </div>
                        }.into_view()
                    } else {
                        view! {
                            <div>
                                <div style="font-size: 48px; color: #22c55e;">{"🎉"}</div>
                                <div style="font-size: 24px; color: white; margin-top: 16px;">"Complete!"</div>
                            </div>
                        }.into_view()
                    }
                }}
            </div>

            // Test buttons (for demo - real version uses MIDI input)
            <div style="display: flex; gap: 16px; justify-content: center;">
                <button
                    style="padding: 12px 24px; background: #22c55e; border: none; border-radius: 8px; color: white; font-size: 16px; cursor: pointer;"
                    on:click=play_correct
                >
                    "Play Correct Note"
                </button>
                <button
                    style="padding: 12px 24px; background: #ef4444; border: none; border-radius: 8px; color: white; font-size: 16px; cursor: pointer;"
                    on:click=play_wrong
                >
                    "Play Wrong Note"
                </button>
            </div>

            // Feedback badge
            {move || {
                if show_feedback.get() {
                    if let Some(result) = last_result.get() {
                        return Some(view! { <FeedbackBadge feedback=result.feedback visible=true /> });
                    }
                }
                None
            }}
        </div>
    }
}

/// Drill Mode - Random notes, immediate feedback
#[component]
fn DrillMode<F>(on_back: F) -> impl IntoView
where
    F: Fn(web_sys::MouseEvent) + 'static,
{
    let evaluation = use_evaluation();
    let stats = evaluation.stats;
    let last_result = evaluation.last_result;
    let show_feedback = evaluation.show_feedback;
    let check_note = evaluation.check_note;

    // Random note generation using simple LCG
    let (current_note, set_current_note) = create_signal(60_u8);
    let (seed, set_seed) = create_signal(12345_u32);

    // Generate next random note
    let generate_note = move || {
        let s = seed.get();
        let new_seed = s.wrapping_mul(1103515245).wrapping_add(12345);
        set_seed.set(new_seed);
        // Random note in C4-C6 range (60-84)
        let note = 60 + ((new_seed >> 16) % 25) as u8;
        set_current_note.set(note);
    };

    // Play correct note
    let play_correct = move |_| {
        let expected = current_note.get();
        check_note.set(Some((expected, expected)));
        generate_note();
    };

    // Play wrong note
    let play_wrong = move |_| {
        let expected = current_note.get();
        check_note.set(Some((expected + 2, expected)));
    };

    view! {
        <div class="drill-mode" style="padding: 24px;">
            // Header
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <button
                    style="padding: 8px 16px; background: #374151; border: none; border-radius: 4px; color: white; cursor: pointer;"
                    on:click=on_back
                >
                    "← Back"
                </button>
                <h2 style="margin: 0;">"Drill Mode"</h2>
                <div style="width: 80px;"></div>
            </div>

            // Stats bar
            <div style="margin-bottom: 24px;">
                {move || {
                    let s = stats.get();
                    view! { <PerformanceStatsCompact stats=s /> }
                }}
            </div>

            // Current note display
            <div style="text-align: center; padding: 48px; background: #1f2937; border-radius: 8px; margin-bottom: 24px;">
                {move || {
                    let note = current_note.get();
                    let note_name = midi_to_note_name(note);
                    view! {
                        <div>
                            <div style="font-size: 14px; color: #9ca3af; margin-bottom: 8px;">
                                "Play this note:"
                            </div>
                            <div style="font-size: 72px; font-weight: bold; color: #f59e0b;">
                                {note_name}
                            </div>
                            <div style="font-size: 18px; color: #6b7280; margin-top: 8px;">
                                {format!("MIDI: {}", note)}
                            </div>
                        </div>
                    }
                }}
            </div>

            // Test buttons
            <div style="display: flex; gap: 16px; justify-content: center;">
                <button
                    style="padding: 12px 24px; background: #22c55e; border: none; border-radius: 8px; color: white; font-size: 16px; cursor: pointer;"
                    on:click=play_correct
                >
                    "Play Correct"
                </button>
                <button
                    style="padding: 12px 24px; background: #ef4444; border: none; border-radius: 8px; color: white; font-size: 16px; cursor: pointer;"
                    on:click=play_wrong
                >
                    "Play Wrong"
                </button>
            </div>

            // Feedback badge
            {move || {
                if show_feedback.get() {
                    if let Some(result) = last_result.get() {
                        return Some(view! { <FeedbackBadge feedback=result.feedback visible=true /> });
                    }
                }
                None
            }}
        </div>
    }
}

/// Tempo Mode - Play with metronome
#[component]
fn TempoMode<F>(on_back: F) -> impl IntoView
where
    F: Fn(web_sys::MouseEvent) + 'static,
{
    let evaluation = use_evaluation();
    let stats = evaluation.stats;
    let last_result = evaluation.last_result;
    let show_feedback = evaluation.show_feedback;
    let check_note = evaluation.check_note;

    // BPM and beat state
    let (bpm, set_bpm) = create_signal(60_u32);
    let (beat_count, set_beat_count) = create_signal(0_u32);
    let (is_playing, set_is_playing) = create_signal(false);

    // Demo notes sequence
    let demo_notes: Vec<u8> = vec![60, 64, 67, 72, 67, 64, 60]; // C major arpeggio
    let total_notes = demo_notes.len();
    let notes_for_correct = demo_notes.clone();
    let notes_for_wrong = demo_notes.clone();
    let notes_for_sequence = demo_notes.clone();
    let notes_for_current = demo_notes;

    // Get current note index (wraps around)
    let current_idx = move || (beat_count.get() as usize) % total_notes;

    // Play correct note
    let play_correct = move |_| {
        let idx = current_idx();
        let expected = notes_for_correct[idx];
        check_note.set(Some((expected, expected)));
        set_beat_count.update(|c| *c += 1);
    };

    // Play wrong note
    let play_wrong = move |_| {
        let idx = current_idx();
        let expected = notes_for_wrong[idx];
        check_note.set(Some((expected + 3, expected)));
    };

    view! {
        <div class="tempo-mode" style="padding: 24px;">
            // Header
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <button
                    style="padding: 8px 16px; background: #374151; border: none; border-radius: 4px; color: white; cursor: pointer;"
                    on:click=on_back
                >
                    "← Back"
                </button>
                <h2 style="margin: 0;">"Tempo Mode"</h2>
                <div style="width: 80px;"></div>
            </div>

            // Stats bar
            <div style="margin-bottom: 24px;">
                {move || {
                    let s = stats.get();
                    view! { <PerformanceStatsCompact stats=s /> }
                }}
            </div>

            // BPM selector
            <div style="display: flex; justify-content: center; align-items: center; gap: 16px; margin-bottom: 24px;">
                <button
                    style="padding: 8px 16px; background: #374151; border: none; border-radius: 4px; color: white; font-size: 20px; cursor: pointer;"
                    on:click=move |_| set_bpm.update(|b| if *b > 40 { *b -= 10 })
                >
                    "-"
                </button>
                <div style="font-size: 24px; font-weight: bold; color: #a855f7; min-width: 120px; text-align: center;">
                    {move || format!("{} BPM", bpm.get())}
                </div>
                <button
                    style="padding: 8px 16px; background: #374151; border: none; border-radius: 4px; color: white; font-size: 20px; cursor: pointer;"
                    on:click=move |_| set_bpm.update(|b| if *b < 200 { *b += 10 })
                >
                    "+"
                </button>
            </div>

            // Metronome visual
            <div style="text-align: center; padding: 24px; background: #1f2937; border-radius: 8px; margin-bottom: 24px;">
                <div style="font-size: 14px; color: #9ca3af; margin-bottom: 8px;">
                    {move || format!("Beat {}", beat_count.get() + 1)}
                </div>

                // Note sequence display
                <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 16px;">
                    {move || {
                        notes_for_sequence.iter().enumerate().map(|(i, &note)| {
                            let is_current = i == current_idx();
                            let bg = if is_current { "#a855f7" } else { "#374151" };
                            let scale = if is_current { "1.2" } else { "1" };
                            view! {
                                <div style=format!(
                                    "width: 48px; height: 48px; border-radius: 50%; background: {}; \
                                     display: flex; align-items: center; justify-content: center; \
                                     font-weight: bold; transform: scale({}); transition: all 0.2s;",
                                    bg, scale
                                )>
                                    {midi_to_note_name(note)}
                                </div>
                            }
                        }).collect_view()
                    }}
                </div>

                // Current note large display
                {move || {
                    let idx = current_idx();
                    let note = notes_for_current[idx];
                    let note_name = midi_to_note_name(note);
                    view! {
                        <div style="font-size: 48px; font-weight: bold; color: #a855f7;">
                            {note_name}
                        </div>
                    }
                }}
            </div>

            // Control buttons
            <div style="display: flex; gap: 16px; justify-content: center; margin-bottom: 16px;">
                <button
                    style=move || format!(
                        "padding: 12px 24px; background: {}; border: none; border-radius: 8px; color: white; font-size: 16px; cursor: pointer;",
                        if is_playing.get() { "#ef4444" } else { "#22c55e" }
                    )
                    on:click=move |_| set_is_playing.update(|p| *p = !*p)
                >
                    {move || if is_playing.get() { "Stop" } else { "Start" }}
                </button>
            </div>

            // Test buttons
            <div style="display: flex; gap: 16px; justify-content: center;">
                <button
                    style="padding: 12px 24px; background: #22c55e; border: none; border-radius: 8px; color: white; font-size: 16px; cursor: pointer;"
                    on:click=play_correct
                >
                    "Play Correct"
                </button>
                <button
                    style="padding: 12px 24px; background: #ef4444; border: none; border-radius: 8px; color: white; font-size: 16px; cursor: pointer;"
                    on:click=play_wrong
                >
                    "Play Wrong"
                </button>
            </div>

            // Feedback badge
            {move || {
                if show_feedback.get() {
                    if let Some(result) = last_result.get() {
                        return Some(view! { <FeedbackBadge feedback=result.feedback visible=true /> });
                    }
                }
                None
            }}
        </div>
    }
}

/// Convert MIDI number to note name
fn midi_to_note_name(midi: u8) -> String {
    let note_names = [
        "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
    ];
    let octave = (midi / 12) as i32 - 1;
    let note = note_names[(midi % 12) as usize];
    format!("{}{}", note, octave)
}
