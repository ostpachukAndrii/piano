# Piano Lesson System

A modular system for creating interactive piano lessons where users learn to play songs by recognizing and playing the correct keys.

## Features

- ✅ **Trait-based Lessons** - Easy to create new lessons
- ✅ **Progress Tracking** - Know how many notes learned
- ✅ **Real-time Feedback** - Immediate correct/incorrect feedback
- ✅ **Extensible** - Add more songs easily
- ✅ **MIDI Integration** - Works with any MIDI device

## Project Structure

```
crates/
└── lesson/
    ├── Cargo.toml
    ├── src/
    │   ├── lib.rs           # Core traits and types
    │   └── alphabet.rs      # Alphabet Song lesson
    └── examples/
        └── alphabet_lesson.rs  # Example binary
```

## Available Lessons

### AlphabetSong
Teaches the alphabet using the famous "Twinkle Twinkle Little Star" melody.

```
Notes: C C G A | G F E D | C D E F | G G G | (repeat pattern)
Letters: A B C D | E F G H | I J K L | M N O | (repeat pattern)
```

Running the lesson:
```bash
cd crates/lesson
cargo run --example alphabet_lesson
```

## Architecture

### Core Types

```rust
// Single note in a lesson
pub struct LessonNote {
    pub midi_note: u8,  // MIDI note number (0-127)
    pub name: &'static str,  // Name (e.g., "C", "G")
}

// Progress tracking
pub struct LessonManager {
    state: LessonState,  // Tracks current position
}

// Lesson trait - implement this for new lessons
pub trait Lesson: Send + Sync {
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn notes(&self) -> &[LessonNote];
    fn current_index(&self) -> usize;
}
```

### Lesson Flow

```
User plays key
    ↓
LessonEventHandler receives MidiEvent
    ↓
Checks: Does note match current lesson note?
    ↓
YES: ✅ Correct! Advance to next note
NO:  ❌ Wrong note, try again
    ↓
Update progress display
    ↓
All notes completed? → Congratulations!
```

## Creating a New Lesson

### Step 1: Define the Lesson Struct

```rust
// src/my_song.rs
use crate::{Lesson, LessonNote};

pub struct MySong {
    notes: Vec<LessonNote>,
}

impl MySong {
    pub fn new() -> Self {
        MySong {
            notes: vec![
                LessonNote::new(60, "C"),  // C4
                LessonNote::new(62, "D"),  // D4
                LessonNote::new(64, "E"),  // E4
            ],
        }
    }
}
```

### Step 2: Implement the Lesson Trait

```rust
impl Lesson for MySong {
    fn name(&self) -> &str {
        "My Song"
    }

    fn description(&self) -> &str {
        "Learn to play my special song"
    }

    fn notes(&self) -> &[LessonNote] {
        &self.notes
    }

    fn current_index(&self) -> usize {
        0  // Fixed for this simple implementation
    }
}
```

### Step 3: Export from lib.rs

```rust
// src/lib.rs
pub mod my_song;
pub use my_song::MySong;
```

### Step 4: Use in Your Application

```rust
let lesson = MySong::new();
let mut manager = LessonManager::new();

// When user plays a key:
if manager.check_note(&midi_event, &lesson) {
    println!("✅ Correct!");
    println!("Progress: {}%", manager.progress(&lesson));
}
```

## Example: Alphabet Lesson

See [alphabet_lesson.rs](examples/alphabet_lesson.rs) for a complete working example.

**Features:**
- Lists all MIDI inputs
- Auto-selects if only one device connected
- Waits for correct note presses
- Displays progress in real-time
- Shows completion message when done

**Running it:**
```bash
cargo run --example alphabet_lesson
```

**Output:**
```
╔════════════════════════════════════════╗
║   Piano Lesson - Alphabet Song        ║
╚════════════════════════════════════════╝

📚 Lesson: ABC Song
📝 Learn the alphabet by playing...

Available MIDI Inputs:
0: Roland Digital Piano

✓ Automatically selected: Roland Digital Piano

Connecting to: Roland Digital Piano

═══════════════════════════════════════
🎹 Ready to play! Press the keys in order:

C C G A G F E D C D E F G G G E F G A A A G F G F E
═══════════════════════════════════════

Press Ctrl+C to exit.

📊 Progress: 0% | Next note: A (C)
✅ Correct! A - C
📊 Progress: 3% | Next note: B (C)
❌ Wrong note! Expected: B (C), got note: 67
✅ Correct! B - C
...
🎉 Congratulations! You completed the Alphabet Song!
```

## MIDI Note Reference

Common notes in Alphabet Song:

| Note | MIDI | Octave |
|------|------|--------|
| C    | 60   | 4      |
| D    | 62   | 4      |
| E    | 64   | 4      |
| F    | 65   | 4      |
| G    | 67   | 4      |
| A    | 69   | 4      |

## Advanced Features

### Tracking Accuracy
You can extend `LessonManager` to track:
- Number of wrong notes
- Time taken per note
- Accuracy percentage

### Voice Feedback
Add text-to-speech to announce:
- "Play A!"
- "Correct!"
- "Try again"

### Multiple Difficulty Levels
Create lesson variations:
- `AlphabetSongEasy` - Slower, louder hints
- `AlphabetSongHard` - Strict timing

### Scoring System
Add points for:
- Correct first attempt
- Speed bonus
- Perfect runs

## Dependencies

- `roland_piano_reader` - MIDI reading library

## Testing

```bash
# Build lesson crate
cargo build -p lesson

# Run tests
cargo test -p lesson

# Run example
cargo run --example alphabet_lesson -p lesson
```

## Future Lessons

Ideas for lessons to add:
- Happy Birthday
- Twinkle Twinkle Little Star
- Mary Had a Little Lamb
- Simple melodies (one octave)
- Scales (C major, minor, etc.)
- Chord recognition
- Rhythm exercises

## Integration with Main App

To create a full application with both MIDI reader and lessons:

```bash
# Workspace structure
.
├── Cargo.toml (workspace)
├── src/
│   └── main.rs (MIDI reader)
└── crates/
    └── lesson/
        ├── src/lib.rs
        ├── examples/
        │   └── alphabet_lesson.rs
        └── Cargo.toml
```

Both crates can coexist and share the `roland_piano_reader` library.

## Contributing

To add a new lesson:

1. Create `src/your_song.rs`
2. Implement `Lesson` trait
3. Export from `src/lib.rs`
4. (Optional) Add example in `examples/`
5. Test with your MIDI device

Happy learning! 🎹🎵
