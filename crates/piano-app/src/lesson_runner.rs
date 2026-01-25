//! Lesson runner - executes a lesson with MIDI input
//!
//! This is an application-layer component that orchestrates the lesson gameplay loop,
//! combining the use case, domain logic, and MIDI infrastructure.

use crate::PlayLessonUseCase;
use piano_domain::NoteName;
use piano_midi::MidiDeviceManager;
use std::io::{self, Write};
use std::thread;
use std::time::Duration;

/// Execute a lesson interactively with MIDI input
pub fn run_lesson(
    lesson_name: &str,
    note_name: NoteName,
    device_idx: usize,
    lesson_path: &str,
    chord_tolerance_ms: u64,
) {
    // Load lesson and setup
    let (mut player, device_name) = match PlayLessonUseCase::execute(
        lesson_name,
        note_name,
        device_idx,
        lesson_path,
        chord_tolerance_ms,
    ) {
        Ok(result) => result,
        Err(e) => {
            eprintln!("❌ Failed to start lesson: {}", e);
            return;
        }
    };

    println!("Connected to: {}\n", device_name);
    println!("📚 Lesson: {}", player.lesson().name());
    println!("📝 {}", player.lesson().description());
    println!("🎵 Note system: {}\n", note_name);

    // Display difficulty and timing tolerance
    let difficulty_name = match chord_tolerance_ms {
        300 => "Easy",
        150 => "Medium",
        50 => "Hard",
        _ => "Custom",
    };
    println!(
        "⚙️  Difficulty: {} ({}ms chord timing tolerance)",
        difficulty_name, chord_tolerance_ms
    );
    println!(
        "    └─ You have {}ms to press all chord notes\n",
        chord_tolerance_ms
    );

    // Show all note events (notes and chords)
    println!("Notes and chords to play:");
    for event in player.lesson().note_events() {
        print!("{} ", event.display_name_detailed(&note_name));
    }
    println!("\n");

    println!("═══════════════════════════════════════════════════════");
    println!("🎹 Ready to play! Press Ctrl+C to exit.\n");

    // Create MIDI device manager
    let midi_manager = match MidiDeviceManager::new() {
        Ok(m) => m,
        Err(e) => {
            eprintln!("❌ Failed to initialize MIDI: {}", e);
            return;
        }
    };

    // Connect to the device
    let mut connected_device = match midi_manager.connect(device_idx) {
        Ok(d) => d,
        Err(e) => {
            eprintln!("❌ Failed to connect to MIDI device: {}", e);
            return;
        }
    };

    // Show countdown before starting
    show_countdown();

    println!("Waiting for MIDI input... Press Ctrl+C to exit.\n");

    // Main game loop
    loop {
        // Display current progress
        let current_index = player.current_note_index();
        let progress = player.progress();
        let total = player.lesson().total_events();

        if current_index < total {
            let expected = &player.lesson().note_events()[current_index];
            let expected_name = expected.display_name_detailed(&note_name);

            print!(
                "\r📊 Progress: {}% ({}/{}) | Next: {} ",
                progress.percentage(),
                current_index,
                total,
                expected_name
            );
        } else {
            print!("\r🎉 Lesson complete! ");
            println!();
            break;
        }

        io::stdout().flush().unwrap();

        // Check for MIDI events (non-blocking)
        while let Some(event) = connected_device.try_recv() {
            if let Some(result) = player.handle_midi_event(event) {
                // Handle duration feedback - just informational now, not pass/fail
                if let Some(held_duration) = result.held_duration_ms {
                    if let Some(exp) = &result.expected_event {
                        let expected_duration = exp.duration_ms().unwrap_or(0);

                        if expected_duration > 0 {
                            let variance = held_duration as i64 - expected_duration as i64;
                            let variance_str = if variance >= 0 {
                                format!("+{}ms", variance)
                            } else {
                                format!("{}ms", variance)
                            };

                            println!(
                                "\n✅ Great! {} - held for {}ms (expected: {}ms, variance: {})",
                                exp.display_name_detailed(&note_name),
                                held_duration,
                                expected_duration,
                                variance_str
                            );
                        } else {
                            println!(
                                "\n✅ Good! {} - held for {}ms",
                                exp.display_name_detailed(&note_name),
                                held_duration
                            );
                        }
                    }
                } else if result.is_correct {
                    let completed_event =
                        &player.lesson().note_events()[player.current_note_index() - 1];
                    let timing_info = if let Some(timing_ms) = result.chord_timing_ms {
                        format!(" ({}ms)", timing_ms)
                    } else {
                        String::new()
                    };
                    println!(
                        "\n✅ Correct! {}{}",
                        completed_event.display_name_detailed(&note_name),
                        timing_info
                    );
                } else if let Some(exp) = &result.expected_event {
                    // Show what was expected vs what was played
                    let played_names: Vec<String> = result
                        .played_notes
                        .iter()
                        .map(|&n| note_name.note_name(n % 12).to_string())
                        .collect();

                    if exp.is_chord() {
                        // Only show errors for chords if:
                        // 1. Wrong notes are being held (notes not part of the expected chord)
                        // 2. Timing exceeded the limit
                        let expected_notes: std::collections::HashSet<u8> =
                            exp.midi_numbers().into_iter().collect();

                        // Check if any held note is wrong (not in expected chord)
                        let has_wrong_notes = result
                            .played_notes
                            .iter()
                            .any(|&note| !expected_notes.contains(&note));

                        // Check if timing exceeded limit
                        let timing_exceeded = if let Some(timing_ms) = result.chord_timing_ms {
                            timing_ms > chord_tolerance_ms
                        } else {
                            false
                        };

                        // Only print error if there's actually a problem
                        if has_wrong_notes {
                            println!(
                                "\n❌ Wrong note(s)! Expected: {}, currently holding: [{}]",
                                exp.display_name_detailed(&note_name),
                                played_names.join("-")
                            );
                        } else if timing_exceeded {
                            println!(
                                "\n⏱️  Too slow! Expected: {}, timing: {}ms (limit: {}ms)",
                                exp.display_name_detailed(&note_name),
                                result.chord_timing_ms.unwrap(),
                                chord_tolerance_ms
                            );
                        }
                        // Otherwise stay silent - user is building the chord correctly
                    } else {
                        // For single notes, always show wrong note errors
                        println!(
                            "\n❌ Wrong note! Expected: {}, got: [{}]",
                            exp.display_name_detailed(&note_name),
                            played_names.join("-")
                        );
                    }
                }
            }
        }

        if player.is_complete() {
            break;
        }

        thread::sleep(Duration::from_millis(50));
    }

    println!("\n═══════════════════════════════════════════════════════");
    println!(
        "📊 Final Score: {}/{} events completed ({:.0}%)\n",
        player.current_note_index(),
        player.lesson().total_events(),
        player.progress().percentage() as f32
    );

    // Finalize and display statistics
    player.finalize_statistics();
    println!(
        "{}",
        player.statistics().generate_report(player.lesson().name())
    );

    println!("Press Enter to return to menu...");
    let _ = io::stdin().read_line(&mut String::new());
}

/// Show a 3-second countdown before lesson starts
fn show_countdown() {
    println!("\n═══════════════════════════════════════════════════════");
    println!("🎹 Get ready to play!\n");

    for i in (1..=3).rev() {
        print!("    {} ", i);
        io::stdout().flush().unwrap();
        thread::sleep(Duration::from_secs(1));
    }

    println!("\n🎵 GO! Playing in 3 seconds...\n");
    thread::sleep(Duration::from_millis(500));
}
