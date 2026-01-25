//! Piano CLI Library
//!
//! Public API for the piano teaching application CLI.

pub mod menu;
pub mod settings;

pub use menu::show_main_menu;
pub use settings::{Difficulty, IncorrectNoteBehavior, Settings};

use piano_app::{run_lesson as start_lesson, PlayLessonUseCase};
use piano_domain::NoteName;
use std::io::{self, Write};
use std::path::Path;

/// Find the lessons directory - try multiple possible locations
fn get_lessons_dir() -> String {
    // Try 1: Workspace root lessons directory
    let path1 = Path::new("lessons");
    if path1.exists() {
        return path1.to_string_lossy().to_string();
    }

    // Try 2: Parent directory (when running from subdirectory)
    let path2 = Path::new("../lessons");
    if path2.exists() {
        return path2.to_string_lossy().to_string();
    }

    // Fallback: assume workspace root
    "lessons".to_string()
}

/// Run the main CLI application
pub fn run() {
    loop {
        show_main_menu();

        let mut choice = String::new();
        print!("Enter your choice (1-4): ");
        io::stdout().flush().unwrap();
        io::stdin().read_line(&mut choice).unwrap();

        match choice.trim() {
            "1" => run_lesson(),
            "2" => list_lessons(),
            "3" => show_settings(),
            "4" => {
                println!("\nGoodbye! 👋\n");
                break;
            }
            _ => println!("\n❌ Invalid choice. Press Enter to continue..."),
        }
    }
}

fn run_lesson() {
    println!("\nSelect a lesson:");

    let lessons_dir = get_lessons_dir();

    // Get available lessons
    let lessons = match PlayLessonUseCase::list_lessons(&lessons_dir) {
        Ok(l) => l,
        Err(e) => {
            eprintln!("❌ Failed to load lessons: {}", e);
            return;
        }
    };

    if lessons.is_empty() {
        println!("❌ No lessons found. Please add YAML files to lessons/");
        return;
    }

    for (i, lesson) in lessons.iter().enumerate() {
        println!("{}: {}", i + 1, lesson);
    }
    println!("{}: Back to menu", lessons.len() + 1);

    let mut choice = String::new();
    print!("\nSelect lesson (1-{}): ", lessons.len() + 1);
    io::stdout().flush().unwrap();
    io::stdin().read_line(&mut choice).unwrap();

    let idx: usize = match choice.trim().parse::<usize>() {
        Ok(n) => n - 1,
        Err(_) => return,
    };

    if idx >= lessons.len() {
        return;
    }

    // Select note naming system
    println!("\nSelect note naming system:");
    for (i, system) in NoteName::all().iter().enumerate() {
        println!("{}: {}", i, system.display_name());
    }
    println!("(Default: Solfege)");

    let mut choice = String::new();
    print!("\nEnter your choice: ");
    io::stdout().flush().unwrap();
    io::stdin().read_line(&mut choice).unwrap();

    let note_name = match choice.trim().parse::<usize>() {
        Ok(0) => NoteName::Western,
        _ => NoteName::Solfege,
    };

    // Select MIDI device
    let devices = match PlayLessonUseCase::list_devices() {
        Ok(d) => d,
        Err(e) => {
            eprintln!("❌ {}", e);
            return;
        }
    };

    if devices.is_empty() {
        println!("❌ No MIDI devices found");
        return;
    }

    println!("\nAvailable MIDI devices:");
    for (idx, name) in &devices {
        println!("{}: {}", idx, name);
    }

    let device_idx = if devices.len() == 1 {
        println!("✓ Using device: {}", devices[0].1);
        0
    } else {
        let mut choice = String::new();
        print!("\nSelect device (enter number): ");
        io::stdout().flush().unwrap();
        io::stdin().read_line(&mut choice).unwrap();
        match choice.trim().parse::<usize>() {
            Ok(n) => n,
            Err(_) => 0,
        }
    };

    // Load settings and get chord tolerance
    let settings = Settings::load();
    let chord_tolerance_ms = settings.difficulty.chord_tolerance_ms();

    // Start the lesson
    println!("\n🎹 Starting lesson...\n");
    start_lesson(&lessons[idx], note_name, device_idx, &lessons_dir, chord_tolerance_ms);
}

fn list_lessons() {
    println!("\n📋 Available Lessons:\n");

    let lessons_dir = get_lessons_dir();
    match PlayLessonUseCase::list_lessons(&lessons_dir) {
        Ok(lessons) => {
            for lesson in lessons {
                println!("  🎵 {}", lesson);
            }
        }
        Err(e) => eprintln!("❌ Failed to load lessons: {}", e),
    }

    println!("\nPress Enter to continue...");
    let _ = io::stdin().read_line(&mut String::new());
}

fn show_settings() {
    loop {
        println!("\n╔═══════════════════════════════════════════════════════╗");
        println!("║            ⚙️  Settings                             ║");
        println!("╚═══════════════════════════════════════════════════════╝\n");

        let mut settings = Settings::load();

        println!("Difficulty Level (affects chord timing tolerance):");
        let difficulties = vec![Difficulty::Easy, Difficulty::Medium, Difficulty::Hard];
        for (idx, difficulty) in difficulties.iter().enumerate() {
            let indicator = if settings.difficulty == *difficulty {
                "✓"
            } else {
                " "
            };
            println!("{}: [{}] {}", idx, indicator, difficulty.display_name());
        }

        println!("\nIncorrect Note Behavior:");
        let behaviors = vec![IncorrectNoteBehavior::Wait, IncorrectNoteBehavior::Skip];
        for (idx, behavior) in behaviors.iter().enumerate() {
            let indicator = match (settings.incorrect_note_behavior, *behavior) {
                (IncorrectNoteBehavior::Wait, IncorrectNoteBehavior::Wait) => "✓",
                (IncorrectNoteBehavior::Skip, IncorrectNoteBehavior::Skip) => "✓",
                _ => " ",
            };
            println!("{}: [{}] {}", idx + 3, indicator, behavior.display_name());
        }

        println!("\n5. Back to menu\n");

        let mut choice = String::new();
        print!("Enter your choice (0-5): ");
        io::stdout().flush().unwrap();
        io::stdin().read_line(&mut choice).unwrap();

        match choice.trim() {
            "0" => {
                settings.difficulty = Difficulty::Easy;
                if let Err(e) = settings.save() {
                    eprintln!("❌ Failed to save settings: {}", e);
                } else {
                    println!("\n✅ Difficulty set to: {}", settings.difficulty.display_name());
                }
            }
            "1" => {
                settings.difficulty = Difficulty::Medium;
                if let Err(e) = settings.save() {
                    eprintln!("❌ Failed to save settings: {}", e);
                } else {
                    println!("\n✅ Difficulty set to: {}", settings.difficulty.display_name());
                }
            }
            "2" => {
                settings.difficulty = Difficulty::Hard;
                if let Err(e) = settings.save() {
                    eprintln!("❌ Failed to save settings: {}", e);
                } else {
                    println!("\n✅ Difficulty set to: {}", settings.difficulty.display_name());
                }
            }
            "3" => {
                settings.incorrect_note_behavior = IncorrectNoteBehavior::Wait;
                if let Err(e) = settings.save() {
                    eprintln!("❌ Failed to save settings: {}", e);
                } else {
                    println!("\n✅ Incorrect Note Behavior set to: Wait");
                }
            }
            "4" => {
                settings.incorrect_note_behavior = IncorrectNoteBehavior::Skip;
                if let Err(e) = settings.save() {
                    eprintln!("❌ Failed to save settings: {}", e);
                } else {
                    println!("\n✅ Incorrect Note Behavior set to: Skip");
                }
            }
            "5" => break,
            _ => println!("\n❌ Invalid choice."),
        }

        if choice.trim() != "5" {
            println!("\nPress Enter to continue...");
            let _ = io::stdin().read_line(&mut String::new());
        }
    }
}
