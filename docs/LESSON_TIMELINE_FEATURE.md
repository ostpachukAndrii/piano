# Lesson Runner Timeline & Statistics Implementation

Date: January 25, 2026

## 🎯 Overview

Modified the lesson runner algorithm to implement a **song timeline** with:

1. ✅ **3-second countdown** before the song starts with user indication
2. ✅ **Flexible duration tracking** - not strict requirements, but shown for feedback and learning
3. ✅ **Comprehensive statistics collection** - tracks how well the user played the song

## 📋 Changes Made

### 1. New Statistics Module
**File:** `crates/piano-app/src/statistics.rs`

Created two main structures:

#### EventStatistics
Tracks performance for each individual note/chord:

```rust
pub struct EventStatistics {
    pub event_index: usize,
    pub expected_event: NoteEvent,
    pub played_notes: Vec<u8>,
    pub actual_duration_ms: Option<u64>,
    pub expected_duration_ms: Option<u64>,
    pub notes_correct: bool,
    pub timing_offset_ms: Option<i64>,
    pub attempts: u32,
}
```

Methods:
- `duration_accuracy_percent()` - Calculate accuracy (100% = perfect)
- `duration_variance_ms()` - How much longer/shorter than expected

#### LessonStatistics
Overall session statistics:

```rust
pub struct LessonStatistics {
    pub events: Vec<EventStatistics>,
    pub total_attempts: u32,
    pub completed_correctly: u32,
    pub overall_accuracy_percent: u8,
    pub average_duration_accuracy_percent: Option<u8>,
    pub start_timestamp_ms: u64,
    pub end_timestamp_ms: u64,
}
```

Methods:
- `record_attempt()` - Track when user plays a note/chord
- `record_duration()` - Track how long they held it
- `finalize()` - Calculate final statistics
- `generate_report()` - Create beautiful text report

### 2. Modified LessonPlayer
**File:** `crates/piano-app/src/lesson_player.rs`

Changes:
- Added `statistics` field to track performance
- Added `lesson_start_time` for overall timing
- Modified duration handling: **no longer strict**, just tracks and reports
- When user releases notes, automatically advance (no longer waits for perfect duration)
- Record actual duration for statistics

**Before:**
```
User plays note → Check duration → If wrong duration, wait for retry
```

**After:**
```
User plays note → Record actual duration → Always advance
User sees feedback like: "held for 520ms (expected 500ms, +20ms)"
```

### 3. Updated LessonRunner
**File:** `crates/piano-app/src/lesson_runner.rs`

Changes:
- Added `show_countdown()` function that:
  - Shows "🎹 Get ready to play!" message
  - Counts down from 3 to 1 with 1-second delays
  - Says "GO!" when ready to start
- Added countdown call before MIDI input loop
- Modified feedback messages to show duration variance instead of pass/fail
- Added `finalize_statistics()` and report generation at lesson end

### 4. Timeline Flow

```
START LESSON
    ↓
DISPLAY LESSON INFO
    ↓
SHOW 3-SECOND COUNTDOWN
    ├─ "Get ready to play!"
    ├─ "    3"  (wait 1s)
    ├─ "    2"  (wait 1s)
    ├─ "    1"  (wait 1s)
    └─ "GO! Playing in 3 seconds..."
    ↓
WAIT 500ms
    ↓
START MIDI INPUT LOOP
    ├─ User plays note
    ├─ Show feedback with actual vs expected duration
    ├─ Automatically advance to next note
    └─ Record statistics
    ↓
LESSON COMPLETE
    ↓
FINALIZE STATISTICS
    ↓
DISPLAY STATISTICS REPORT
    └─ Overall accuracy
    └─ Event-by-event details with timing
    └─ Duration accuracy for each note
    ↓
RETURN TO MENU
```

## 📊 Statistics Report Example

```
📊 Lesson Statistics: Simple Chord Practice
═════════════════════════════════════════════════════════
Overall Accuracy: 100%
Events Completed: 3/3
Total Attempts: 5
Total Duration: 0m 45s
Average Timing Accuracy: 95%

Detailed Results:
─────────────────────────────────────────────────────────
✅ Event 1: Note(60) - Attempts: 1, Duration: 500ms (expected 500ms, 0ms), Accuracy: 100%
✅ Event 2: Chord(C Major) - Attempts: 2, Duration: 800ms (expected 800ms, 0ms), Accuracy: 100%
✅ Event 3: Note(64) - Attempts: 2, Held: 520ms (expected 500ms, +20ms)
═════════════════════════════════════════════════════════
```

## 🎮 User Experience Flow

1. **Pre-Lesson**
   - See lesson info and required notes
   - Get ready physically

2. **Countdown** (3 seconds)
   - Clear visual/audio indicator
   - Time to get hands in position
   - Build anticipation

3. **Playing**
   - See "Next: C4" indicator updating
   - Get immediate feedback on timing
   - No frustration from "wrong duration"
   - Just play and have fun!

4. **Feedback During Play**
   ```
   User plays C4 and holds for 520ms
   System shows: "✅ Great! C4 - held for 520ms (expected: 500ms, +20ms)"
   ```

5. **End of Lesson**
   - See detailed statistics
   - Understand where they're strong/weak
   - Learn timing patterns

## 💻 Code Examples

### Playing with Duration Tracking

```rust
// User presses note
let result = player.handle_midi_event(MidiEvent::NoteOn { note: 60, velocity: 80 });
// result.is_correct = false (waiting for note release)

// User releases note after 520ms
let result = player.handle_midi_event(MidiEvent::NoteOff { note: 60 });
// result.is_correct = true (ALWAYS advances now!)
// result.held_duration_ms = Some(520)
// Statistics recorded: actual_duration = 520ms, expected = 500ms
```

### Getting Statistics Report

```rust
// At end of lesson
player.finalize_statistics();
let stats = player.statistics();

// Print report
println!("{}", stats.generate_report(player.lesson().name()));

// Or access individual data
println!("Overall accuracy: {}%", stats.overall_accuracy_percent);
println!("Average timing accuracy: {:?}%", stats.average_duration_accuracy_percent);

for event in &stats.events {
    println!("Event {} - Attempts: {}, Notes: {}", 
        event.event_index, 
        event.attempts, 
        event.notes_correct
    );
}
```

## 🔧 Configuration

The countdown duration is hardcoded to 3 seconds. To change:

In `lesson_runner.rs`:
```rust
fn show_countdown() {
    for i in (1..=3).rev() {  // Change 3 to desired seconds
        print!("    {} ", i);
        thread::sleep(Duration::from_secs(1));
    }
    thread::sleep(Duration::from_millis(500));
}
```

## 🎯 Benefits

✅ **More Fun** - No frustration from strict timing requirements  
✅ **Better Learning** - See exactly how you performed vs expected  
✅ **Engaging** - Countdown adds drama and anticipation  
✅ **Educational** - Statistics help identify timing patterns  
✅ **Flexible** - Optional duration tracking (null = no requirement)  
✅ **Encouraging** - Always positive feedback ("Great!" vs "Wrong!")

## 📝 Future Enhancements

Potential additions:
- Difficulty modes that affect countdown intensity
- Audio cues during countdown (beeps)
- Leaderboard tracking (best timing accuracy)
- Replay with playback of user's timing
- Tempo synchronization (count in, then play)
- Save statistics to file for progress tracking

## Related Files

- [statistics.rs](crates/piano-app/src/statistics.rs) - Statistics collection
- [lesson_player.rs](crates/piano-app/src/lesson_player.rs) - Duration tracking
- [lesson_runner.rs](crates/piano-app/src/lesson_runner.rs) - Countdown and report
- [lib.rs](crates/piano-app/src/lib.rs) - Module exports
