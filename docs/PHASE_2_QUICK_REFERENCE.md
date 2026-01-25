# Phase 2: Quick Developer Reference

## File Locations

### Core Implementation
```
src-tauri/src/
├── models/
│   ├── measure.rs          # Data structures (Measure, Note, GlobalSettings)
│   └── mod.rs              # Module exports
├── lesson_parser.rs        # YAML parsing logic
└── commands/
    └── lesson.rs           # Tauri command implementations

docs/
├── PHASE_2_YAML_STRUCTURE_GUIDE.md    # Full YAML specification
└── PHASE_2_COMPLETION_SUMMARY.md      # Detailed completion report

lessons/
├── happy_birthday.yaml     # ✅ Migrated
├── simple_chords.yaml      # ✅ Migrated
├── two_hand_chords.yaml    # ✅ Migrated
├── alphabet.yaml           # ✅ Migrated
└── example_features.yaml   # ✅ Migrated
```

## Quick API Reference

### Load a Lesson (Rust Backend)

```rust
use piano_tauri_backend::YamlLesson;

// From file
let lesson = YamlLesson::from_file("lessons/happy_birthday.yaml")?;

// From string
let yaml_content = r#"
title: Test
settings:
  tempo: 120
  time_signature: "4/4"
  key_signature: "C major"
measures:
  - notes:
      - midi: 60
        duration: 1.0
"#;
let lesson = YamlLesson::from_str(yaml_content)?;

// Access data
println!("Title: {}", lesson.title);
println!("Total beats: {}", lesson.total_beats());
println!("Duration: {}s", lesson.total_seconds());
```

### Tauri Commands (Frontend -> Backend)

```typescript
// Load a single lesson
const lesson = await invoke('load_lesson', { lessonId: 'happy_birthday' });

// List all lessons
const lessons = await invoke('list_lessons');
```

## YAML Lesson Format (Quick Reference)

### Minimal Lesson
```yaml
title: My Lesson
settings:
  tempo: 120
  time_signature: "4/4"
  key_signature: "C major"
measures:
  - notes:
      - midi: 60
        duration: 1.0
```

### Single Note
```yaml
- midi: 60              # MIDI number (0-127)
  duration: 1.0         # Duration in beats
  hand: right           # "left" or "right" (optional, default: right)
  accidental: sharp     # "sharp", "flat", "natural" (optional)
```

### Chord
```yaml
- midi: [60, 64, 67]    # Array of MIDI numbers
  duration: 2.0
  hand: left            # (optional)
  chord: C Major        # Chord name for display (optional)
```

### Rest
```yaml
- rest: 1.0             # Duration in beats
```

## Common Chord MIDI Numbers

| Chord | MIDI Array |
|-------|-----------|
| C Major | [60, 64, 67] |
| D Major | [62, 66, 69] |
| E Major | [64, 68, 71] |
| F Major | [65, 69, 72] |
| G Major | [67, 71, 74] |
| A Major | [69, 73, 76] |
| C Minor | [60, 63, 67] |
| D Minor | [62, 65, 69] |
| A Minor | [69, 72, 76] |

## MIDI Note Numbers (Quick Ref)

```
Octave 3:  C3=36, D3=38, E3=40, F3=41, G3=43, A3=45, B3=47
Octave 4:  C4=60 (Middle C)
           D4=62, E4=64, F4=65, G4=67, A4=69, B4=71
Octave 5:  C5=72, D5=74, E5=76, F5=77, G5=79, A5=81, B5=83
```

## Data Structures

### Note Enum (3 Variants)
```rust
// Single note
Note::Single {
    midi: u8,
    duration_beats: f32,
    hand: String,
    accidental: Option<String>,
}

// Chord (multiple notes)
Note::Chord {
    midi_set: Vec<u8>,
    duration_beats: f32,
    hand: String,
    chord_name: Option<String>,
}

// Rest/silence
Note::Rest {
    duration_beats: f32,
}
```

### Helper Methods on Note
```rust
note.duration_beats()      // f32 - works for all variants
note.hand()                // Option<&str> - Some/None for rest
note.is_rest()             // bool - true if rest
note.midi_notes()          // Vec<u8> - [midi] or midi_set or []
```

## Testing

### Run All Tests
```bash
cd src-tauri
cargo test --lib
```

### Test Specific Module
```bash
cargo test models::measure::tests
cargo test lesson_parser::tests
cargo test commands::lesson::tests
```

### Test Lesson Parsing
```bash
cargo test from_file  # Tests file loading
cargo test from_str   # Tests YAML parsing
```

## Common Tasks

### Add a New Lesson
1. Create `lessons/my_lesson.yaml` with proper format
2. Run `cargo test` to verify parser accepts it
3. Lesson automatically available via `list_lessons` command

### Modify Note Types
1. Edit `src-tauri/src/models/measure.rs` (Note enum)
2. Update parser in `src-tauri/src/lesson_parser.rs` if needed
3. Update DTOs in `src-tauri/src/commands/lesson.rs`
4. Add unit tests

### Update YAML Format
1. Document new format in `docs/PHASE_2_YAML_STRUCTURE_GUIDE.md`
2. Update parser in `lesson_parser.rs`
3. Migrate existing YAML files
4. Add test cases

## Compilation & Debugging

### Check for Errors
```bash
cd src-tauri
cargo check
```

### Build Library
```bash
cargo build --lib
```

### View Documentation
```bash
cargo doc --open
```

## Integration Checklist for Phase 3

- [ ] Register lesson.rs commands in Tauri app builder
- [ ] Create Angular service for lesson API calls
- [ ] Add lesson list UI component
- [ ] Add lesson player UI component
- [ ] Connect to MIDI input system
- [ ] Test end-to-end lesson flow
- [ ] Update frontend documentation

## Troubleshooting

### YAML Parse Error: "Missing 'title' field"
- Ensure lesson file has `title: String` at root level

### YAML Parse Error: "Missing 'settings' in settings"
- Ensure `settings` has all 3 required fields: tempo, time_signature, key_signature

### YAML Parse Error: "'measures' must be a list"
- Ensure `measures:` contains a list of note containers

### Lesson Not Found
- Check file exists: `ls lessons/*.yaml`
- Check filename matches lesson_id parameter
- Remove `.yaml` extension from lesson_id

### Invalid MIDI Numbers
- MIDI range is 0-127
- Middle C = 60
- Higher octaves use higher numbers
- See MIDI Note Numbers table above

## Performance Notes

### Parsing Speed
- Full lesson parse: < 1ms (typical)
- Large lesson (100+ notes): < 5ms
- No pre-compilation needed

### Memory Usage
- Measure struct: ~24 bytes + note data
- Note enum: ~24-32 bytes each
- Typical lesson: <10KB in memory

## Version Compatibility

- **Rust Edition:** 2021
- **Serde:** 1.0+ (for derive macros)
- **Serde YAML:** 0.9+
- **Tauri:** 2.0+

## Useful Commands

```bash
# View all available lessons
ls -la lessons/

# Validate YAML syntax
cat lessons/happy_birthday.yaml | head -20

# Count notes in a lesson
grep -c "midi:" lessons/simple_chords.yaml

# List all chords used
grep "chord:" lessons/*.yaml

# Rebuild without cache
cargo clean && cargo build
```

## Next Phase Tasks

When starting Phase 3:
1. Check out [PHASE_2_COMPLETION_SUMMARY.md](PHASE_2_COMPLETION_SUMMARY.md)
2. Review "Integration Points" section
3. Register commands in Tauri app initialization
4. Create frontend service layer
5. Build UI components

## Support & Questions

For questions about:
- **YAML Format:** See [PHASE_2_YAML_STRUCTURE_GUIDE.md](PHASE_2_YAML_STRUCTURE_GUIDE.md)
- **Implementation:** See module doc comments in source files
- **Testing:** Run `cargo test -- --nocapture` for detailed output
- **Architecture:** See docs/ARCHITECTURE/ folder
