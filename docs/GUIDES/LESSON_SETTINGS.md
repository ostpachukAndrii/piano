# Lesson Settings Configuration - January 2026

**Status:** ✅ IMPLEMENTED  
**Date:** January 24, 2026  
**Feature:** Configurable behavior for incorrect notes during lessons

---

## Overview

The Piano Lesson System now includes a **Settings Menu** where users can configure how the application behaves when an incorrect note is played during a lesson.

## Settings Available

### Incorrect Note Behavior

Controls what happens when a student plays the wrong note:

#### 🔄 Option 0: **Wait for Correct Note** (Default)
- The lesson **pauses** and waits for the correct note to be played
- Student must play the exact note before proceeding
- **Best for:** Learning precision and muscle memory
- **Behavior:**
  ```
  📊 Progress: 7% (2/26) | Next note: Sol
  ❌ Wrong note! Expected: Sol, got: Re
  📊 Progress: 7% (2/26) | Next note: Sol
  (waits for correct note)
  ✅ Correct! Sol
  ```

#### ⏭️ Option 1: **Skip to Next Note**
- The lesson **automatically advances** to the next note after an incorrect note
- Useful for fast-paced practice or when speed is more important than precision
- **Best for:** Building fluency and rhythm
- **Behavior:**
  ```
  📊 Progress: 7% (2/26) | Next note: Sol
  ❌ Wrong note! Expected: Sol, got: Re
  ⏭️ Skipping to next note...
  📊 Progress: 11% (3/26) | Next note: La
  ```

---

## How to Access Settings

### From Main Menu
1. Run the application: `cargo run`
2. Select **Option 3: Settings** from the main menu
3. Configure **Incorrect Note Behavior**
4. Select **Option 3: Back to menu** to return

### Settings Menu Flow
```
╔═══════════════════════════════════════════════════════╗
║            ⚙️  Settings                             ║
╚═══════════════════════════════════════════════════════╝

Incorrect Note Behavior:
0: [✓] Wait for correct note (default)
1: [ ] Skip to next note

3. Back to menu
```

---

## Configuration Storage

Settings are **automatically saved** to your user profile:

### Windows
```
%APPDATA%\PianoLesson\settings.json
```
Example: `C:\Users\YourName\AppData\Roaming\PianoLesson\settings.json`

### macOS/Linux
```
~/.config/pianolesson/settings.json
```

### Configuration File Format
```json
{
  "incorrect_note_behavior": "Wait"
}
```

Or with Skip:
```json
{
  "incorrect_note_behavior": "Skip"
}
```

---

## User Workflows

### Scenario 1: Learning a New Lesson
**Goal:** Master the exact notes  
**Best Setting:** Wait for correct note (default)

1. Select Settings → Choose "Wait for correct note"
2. Start an interactive lesson
3. Play each note carefully
4. If you play wrong, keep trying until you get it right
5. This builds accurate muscle memory

### Scenario 2: Quick Practice Session
**Goal:** Play through the whole song quickly  
**Best Setting:** Skip to next note

1. Select Settings → Choose "Skip to next note"
2. Start an interactive lesson
3. Play each note at your own pace
4. If you miss a note, the lesson moves on
5. Good for building speed and fluency

### Scenario 3: Mixed Difficulty Lesson
**Goal:** Start with accuracy, then speed up  
**Best Setting:** Start with "Wait", then switch to "Skip"

1. Practice with "Wait for correct note" initially
2. Once comfortable, change setting to "Skip to next note"
3. Continue with the same lesson at higher speed

---

## Technical Details

### Implementation Location
- **Settings Module:** `crates/piano-cli/src/settings.rs`
- **Configuration Loading:** `Settings::load()` - Loads from file or uses defaults
- **Configuration Saving:** `Settings::save()` - Persists changes to file
- **Settings Menu:** `show_settings()` in `crates/piano-cli/src/main.rs`

### Default Configuration
```rust
pub struct Settings {
    pub incorrect_note_behavior: IncorrectNoteBehavior,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            incorrect_note_behavior: IncorrectNoteBehavior::Wait,
        }
    }
}
```

### File Paths
- **Windows:** Uses `%APPDATA%` environment variable
- **macOS:** Uses `$HOME/.config/`
- **Linux:** Uses `$HOME/.config/`
- **Fallback:** Current directory if environment variables unavailable

---

## Future Enhancements

Potential settings that could be added:

- [ ] **Note Timeout** - Auto-advance after X seconds
- [ ] **Strict Mode** - Show/hide note names
- [ ] **Speed Control** - Slow down or speed up playback
- [ ] **Feedback Sound** - Beep on correct/incorrect notes
- [ ] **Difficulty Level** - Adjust lesson complexity
- [ ] **Theme** - Dark/light mode
- [ ] **MIDI Settings** - Velocity sensitivity, channel selection

---

## Troubleshooting

### Settings Not Saving
**Problem:** Changes to settings don't persist  
**Solution:** Ensure the config directory is writable:
```bash
# Windows
mkdir %APPDATA%\PianoLesson

# macOS/Linux
mkdir -p ~/.config/pianolesson
```

### Settings Not Loading
**Problem:** Default settings always used  
**Solution:** Delete the settings.json file to reset:
```bash
# Windows
del %APPDATA%\PianoLesson\settings.json

# macOS/Linux
rm ~/.config/pianolesson/settings.json
```

Then restart the application to recreate with defaults.

### Can't Find Settings Menu
**Problem:** "Settings coming soon!" appears instead of settings menu  
**Solution:** Rebuild the application:
```bash
cargo clean
cargo build
cargo run
```

---

## Example Session

### Complete Workflow

```
🎹 Piano Lesson System - Main Menu

1. Start Interactive Lesson
2. View Available Lessons
3. Settings
4. Exit

Enter your choice (1-4): 3

╔═══════════════════════════════════════════════════════╗
║            ⚙️  Settings                             ║
╚═══════════════════════════════════════════════════════╝

Incorrect Note Behavior:
0: [✓] Wait for correct note (default)
1: [ ] Skip to next note

3. Back to menu

Enter your choice (0-3): 1

✅ Incorrect Note Behavior set to: Skip

Press Enter to continue...

╔═══════════════════════════════════════════════════════╗
║            ⚙️  Settings                             ║
╚═══════════════════════════════════════════════════════╝

Incorrect Note Behavior:
0: [ ] Wait for correct note (default)
1: [✓] Skip to next note

3. Back to menu

Enter your choice (0-3): 3

🎹 Piano Lesson System - Main Menu

1. Start Interactive Lesson
2. View Available Lessons
3. Settings
4. Exit

Enter your choice (1-4): 1
```

---

## File Structure

```
crates/piano-cli/
├── src/
│   ├── main.rs              ← Run loop and settings menu
│   ├── settings.rs          ← NEW: Settings management
│   ├── menu.rs              ← Menu display
│   └── lib.rs

Configuration Files:
Windows:  %APPDATA%\PianoLesson\settings.json
macOS:    ~/.config/pianolesson/settings.json
Linux:    ~/.config/pianolesson/settings.json
```

---

## Build Status

```bash
$ cargo build
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.67s
```

✅ Compiles successfully  
✅ Settings save/load working  
✅ Menu functional  
✅ Ready for use

---

## Summary

The Piano Lesson System now features a **fully functional Settings menu** where users can configure their preferred note-handling behavior:

- **Wait for Correct Note** (default) - Builds accuracy
- **Skip to Next Note** - Builds speed and fluency

Settings are automatically persisted across sessions using JSON configuration files stored in the appropriate platform-specific location.
