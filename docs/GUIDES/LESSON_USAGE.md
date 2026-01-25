# Piano Lesson System - Usage Guide

## Quick Start

### Launch the Main Menu
```bash
cargo run --example main_menu -p lesson
```

The main menu provides an interactive interface to:
- ✅ **Start Interactive Lesson** - Select a lesson and note naming system (Western or Solfege)
- 📋 **View Available Lessons** - See all available lessons with descriptions
- ⚙️ **Settings** - Access configuration options (future feature)
- 🚪 **Exit** - Close the application

### Available Lessons

1. **Alphabet Song** (26 notes)
   - File: `lessons/alphabet.yaml`
   - Description: Learn the alphabet using the Twinkle Twinkle melody
   - Perfect for beginners

2. **Happy Birthday** (25 notes)
   - File: `lessons/happy_birthday.yaml`
   - Description: Learn to play Happy Birthday melody
   - Good for intermediate learners

## Direct Launch (Advanced)

If you want to run the lesson system directly without the menu:

```bash
cargo run --example universal_lesson -p lesson
```

You'll be prompted to:
1. Select a note naming system (Western: C, D, E or Solfege: Do, Re, Mi)
2. Select a lesson to play
3. Choose a MIDI input device
4. Play the lesson!

## Note Naming Systems

### Western (C, D, E, F)
Traditional note names used in English-speaking countries.

### Solfege (Do, Re, Mi, Fa)
A moveable do system used in many music education programs.
**This is the default choice when you start a lesson.**

## MIDI Setup

Before starting a lesson, make sure:
1. ✅ Your piano/MIDI keyboard is connected via USB
2. ✅ Your operating system recognizes the device
3. ✅ No other application is using the MIDI port

The system will automatically detect and list available MIDI devices.

## Creating Custom Lessons

You can add your own lessons by creating YAML files in the `lessons/` directory:

```yaml
name: My Song Name
description: A description of the lesson
notes: [60, 62, 64, 65, 67, 69, 71, 72]  # MIDI note numbers (C4 through C5)
```

MIDI note reference:
- C4 = 60 (Middle C)
- D4 = 62
- E4 = 64
- F4 = 65
- G4 = 67
- A4 = 69
- B4 = 71
- C5 = 72

## Gameplay

When you start a lesson:
- 🎵 Notes are displayed in your chosen notation system
- 🎹 Play each note on your piano in order
- ✅ You'll see "Correct!" when you play the right note
- ❌ You'll see "Wrong note!" if you make a mistake
- 📊 Progress bar shows how far you've gotten
- 🎉 Celebration message when you complete the lesson!

## Troubleshooting

**"No MIDI inputs found"**
- Make sure your piano is connected
- Try disconnecting and reconnecting the USB cable
- Check your operating system's device manager to confirm the device is recognized

**"Failed to start lesson"**
- Make sure you're running commands from the workspace root directory
- Check that the `lessons/` directory exists with YAML files

**Slow response from piano**
- This is normal on slower systems
- The system processes events in real-time from your piano

## Tips & Tricks

- 💡 Use Solfege (Do, Re, Mi) if you're learning music theory
- 💡 Start with the Alphabet Song - it's easier to learn
- 💡 Progress bars update in real-time as you play
- 💡 You can exit any lesson at any time with Ctrl+C
