# Testing Strategy - Piano Learning App

## Current State vs. Ideal State

### What We Have Now ✅
- **Unit tests**: 51 tests for core logic
- **Pure functions**: Testable services
- **Mock backend**: For frontend testing

### What We're Missing ❌
- Integration tests (end-to-end flows)
- Test fixtures (standardized test data)
- Structured error types (using String everywhere)
- Test coverage reporting
- Property-based tests
- Performance benchmarks

---

## 🎯 Testing Pyramid

```
        ┌─────────────────┐
        │  E2E Tests      │  ← Missing
        │  (Full flows)   │
        └─────────────────┘
              ▲
    ┌─────────────────────────┐
    │  Integration Tests      │  ← Missing
    │  (Module interactions)  │
    └─────────────────────────┘
              ▲
    ┌───────────────────────────────┐
    │     Unit Tests               │  ✅ Have 51
    │  (Individual functions)      │
    └───────────────────────────────┘
```

---

## 🔧 Improvements Needed

### 1. **Structured Error Types** (HIGH PRIORITY)

**Problem**: Using `String` for errors makes testing imprecise
```rust
Err("Failed to load lesson".to_string())  // Can't test specific error types
```

**Solution**: Create typed errors
```rust
pub enum LessonError {
    NotFound(String),
    InvalidFormat(String),
    IoError(std::io::Error),
}

pub enum MidiError {
    DeviceNotFound,
    ConnectionFailed,
    BufferOverflow,
}
```

**Benefits**:
- ✅ Can assert specific error types in tests
- ✅ Better error handling in frontend
- ✅ Easier debugging
- ✅ IDE autocomplete for error cases

### 2. **Test Fixtures** (HIGH PRIORITY)

**Problem**: Each test creates its own data
```rust
#[test]
fn test_something() {
    let config = LessonConfig {
        name: "Test".to_string(),
        description: "...".to_string(),
        // ... 20 lines of setup
    };
}
```

**Solution**: Centralized test data
```rust
// tests/fixtures/lessons.rs
pub fn simple_lesson() -> LessonConfig { /* ... */ }
pub fn chord_lesson() -> LessonConfig { /* ... */ }
pub fn invalid_lesson() -> LessonConfig { /* ... */ }

#[test]
fn test_something() {
    let lesson = fixtures::simple_lesson();
    // Test it
}
```

### 3. **Integration Tests** (HIGH PRIORITY)

**Problem**: No tests for full workflows

**Solution**: Add integration test suite
```rust
// tests/integration/lesson_loading.rs
#[test]
fn test_load_lesson_full_flow() {
    // 1. Create test YAML file
    // 2. Call load_lesson command
    // 3. Verify DTO structure
    // 4. Cleanup
}

// tests/integration/midi_flow.rs
#[test]
fn test_midi_chord_detection_flow() {
    // 1. Mock MIDI device
    // 2. Send note events
    // 3. Verify chord detection
    // 4. Check frontend events
}
```

### 4. **Test Coverage Reporting** (MEDIUM PRIORITY)

**Problem**: Don't know what's untested

**Solution**: Add tarpaulin for coverage
```toml
# .cargo/config.toml
[target.x86_64-pc-windows-msvc]
rustflags = ["-C", "instrument-coverage"]
```

```bash
# Run coverage
cargo tarpaulin --out Html --output-dir coverage
```

### 5. **Property-Based Tests** (MEDIUM PRIORITY)

**Problem**: Only testing specific cases

**Solution**: Use proptest for random inputs
```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn test_chord_grouper_never_panics(
        notes in prop::collection::vec(0u8..127u8, 1..10),
        window_ms in 10u64..1000u64
    ) {
        let grouper = ChordGrouper::new(window_ms);
        let events: Vec<_> = notes.iter()
            .map(|&n| MidiEvent::note_on(n, 100))
            .collect();

        // Should never panic regardless of input
        let _ = grouper.group_events(&events);
    }
}
```

### 6. **Builder Pattern for Test Data** (LOW PRIORITY)

**Problem**: Hard to create variations

**Solution**: Test builders
```rust
pub struct LessonConfigBuilder {
    name: String,
    tempo: Option<u16>,
    measures: Vec<Measure>,
}

impl LessonConfigBuilder {
    pub fn new(name: &str) -> Self { /* ... */ }
    pub fn tempo(mut self, bpm: u16) -> Self { /* ... */ }
    pub fn measure(mut self, m: Measure) -> Self { /* ... */ }
    pub fn build(self) -> LessonConfig { /* ... */ }
}

// Usage
let lesson = LessonConfigBuilder::new("Test")
    .tempo(120)
    .measure(/* ... */)
    .build();
```

### 7. **Snapshot Testing** (LOW PRIORITY)

**Problem**: Hard to verify complex output

**Solution**: Use insta for snapshots
```rust
use insta::assert_yaml_snapshot;

#[test]
fn test_lesson_dto_conversion() {
    let lesson = load_lesson("test-lesson".to_string()).unwrap();
    assert_yaml_snapshot!(lesson);
}
```

---

## 📋 Implementation Plan

### Phase 1: Foundation (2-3 hours)

**Priority**: HIGH
**Impact**: Makes all future testing easier

#### 1.1 Create Error Types
```rust
// src-tauri/src/errors.rs
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Lesson not found: {0}")]
    LessonNotFound(String),

    #[error("Invalid lesson format: {0}")]
    InvalidLessonFormat(String),

    #[error("MIDI device error: {0}")]
    MidiDevice(String),

    #[error("Configuration error: {0}")]
    Config(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

// Convert to String for Tauri commands
impl From<AppError> for String {
    fn from(err: AppError) -> String {
        err.to_string()
    }
}
```

#### 1.2 Create Test Fixtures Module
```rust
// src-tauri/tests/fixtures/mod.rs
pub mod lessons;
pub mod midi;

// src-tauri/tests/fixtures/lessons.rs
use piano_lessons::LessonConfig;

pub fn simple_lesson() -> LessonConfig { /* ... */ }
pub fn chord_lesson() -> LessonConfig { /* ... */ }
pub fn complex_lesson() -> LessonConfig { /* ... */ }
```

#### 1.3 Add Test Helpers
```rust
// src-tauri/tests/helpers/mod.rs
pub fn temp_lessons_dir() -> TempDir { /* ... */ }
pub fn write_test_yaml(dir: &Path, id: &str, lesson: &LessonConfig) { /* ... */ }
pub fn cleanup_test_files() { /* ... */ }
```

### Phase 2: Integration Tests (3-4 hours)

**Priority**: HIGH
**Impact**: Catches bugs in component interactions

```rust
// tests/integration/lesson_loading_test.rs
#[test]
fn test_load_lesson_from_file() {
    let temp_dir = temp_lessons_dir();
    write_test_yaml(&temp_dir, "test", &fixtures::simple_lesson());

    let result = load_lesson("test".to_string());
    assert!(result.is_ok());

    let lesson = result.unwrap();
    assert_eq!(lesson.title, "Test Lesson");
    assert_eq!(lesson.tempo, 120);
}

#[test]
fn test_load_nonexistent_lesson() {
    let result = load_lesson("nonexistent".to_string());
    assert!(matches!(result, Err(AppError::LessonNotFound(_))));
}
```

### Phase 3: Property-Based Tests (2-3 hours)

**Priority**: MEDIUM
**Impact**: Finds edge cases

```toml
[dev-dependencies]
proptest = "1.0"
```

```rust
// tests/property/chord_grouper_test.rs
proptest! {
    #[test]
    fn test_chord_grouper_properties(
        window_ms in 10u64..1000u64,
        note_count in 1usize..20
    ) {
        let grouper = ChordGrouper::new(window_ms);
        let notes: Vec<u8> = (60..60+note_count as u8).collect();
        let events: Vec<_> = notes.iter()
            .map(|&n| MidiEvent::note_on(n, 100))
            .collect();

        let chord = grouper.group_events(&events);

        // Properties that should always hold
        assert_eq!(chord.notes.len(), note_count);
        assert!(chord.notes.iter().all(|&n| n >= 60));
        assert_eq!(chord.velocity, 100);
    }
}
```

### Phase 4: Coverage & Benchmarks (1-2 hours)

**Priority**: MEDIUM
**Impact**: Visibility into test quality

#### 4.1 Coverage Setup
```bash
# Install tarpaulin
cargo install cargo-tarpaulin

# Run coverage
cargo tarpaulin --out Html --output-dir coverage

# Open coverage/index.html
```

#### 4.2 Benchmarks
```toml
[[bench]]
name = "chord_grouping"
harness = false
```

```rust
// benches/chord_grouping.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn chord_grouping_benchmark(c: &mut Criterion) {
    c.bench_function("group 3 notes", |b| {
        let grouper = ChordGrouper::new(50);
        let events = vec![
            MidiEvent::note_on(60, 100),
            MidiEvent::note_on(64, 100),
            MidiEvent::note_on(67, 100),
        ];

        b.iter(|| {
            grouper.group_events(black_box(&events))
        });
    });
}

criterion_group!(benches, chord_grouping_benchmark);
criterion_main!(benches);
```

---

## 🎯 Specific Improvements for Each Module

### Config Module
```rust
// Current
#[cfg(test)]
mod tests {
    #[test]
    fn test_default_config() { /* ... */ }
}

// Add
#[test]
fn test_load_from_file() { /* ... */ }

#[test]
fn test_env_var_override() {
    std::env::set_var("ROLAND_MIDI__CHORD_GROUPING_MS", "100");
    let config = AppConfig::load().unwrap();
    assert_eq!(config.midi.chord_grouping_ms, 100);
}

#[test]
fn test_invalid_config_file() {
    let result = AppConfig::load_from_str("invalid yaml");
    assert!(matches!(result, Err(AppError::Config(_))));
}
```

### Lesson Adapter
```rust
// Add
#[test]
fn test_adapter_error_handling() {
    let result = LessonAdapter::load_from_yaml("invalid: [[[");
    assert!(result.is_err());
}

#[test]
fn test_adapter_empty_lesson() {
    let yaml = r#"
name: Empty
description: No notes
"#;
    let result = LessonAdapter::load_from_yaml(yaml);
    assert!(matches!(result, Err(AppError::InvalidLessonFormat(_))));
}

#[test]
fn test_adapter_tempo_defaults() {
    let yaml = r#"
name: No Tempo
description: Should default to 120
notes: [60, 62, 64]
"#;
    let lesson = LessonAdapter::load_from_yaml(yaml).unwrap();
    assert_eq!(lesson.tempo, 120);
}
```

### MIDI Services
```rust
// Add
#[test]
fn test_chord_grouper_timing_edge_cases() {
    let grouper = ChordGrouper::new(50);

    // Notes exactly at window boundary
    let mut event1 = MidiEvent::note_on(60, 100);
    event1.timestamp = Instant::now() - Duration::from_millis(50);

    let events = vec![event1];
    assert!(grouper.is_ready_to_group(&events));
}

#[test]
fn test_event_processor_concurrent_access() {
    let processor = EventProcessor::new(50);
    let buffer = Arc::new(Mutex::new(Vec::new()));

    // Simulate concurrent access
    let handles: Vec<_> = (0..10).map(|_| {
        let b = buffer.clone();
        let p = processor.clone();
        std::thread::spawn(move || {
            p.process_buffer(&b)
        })
    }).collect();

    for handle in handles {
        assert!(handle.join().is_ok());
    }
}
```

---

## 📊 Test Organization Structure

```
roland/
├── src-tauri/
│   ├── src/
│   │   ├── errors.rs              # NEW: Structured errors
│   │   └── ...
│   │
│   ├── tests/
│   │   ├── fixtures/              # NEW: Test data
│   │   │   ├── mod.rs
│   │   │   ├── lessons.rs
│   │   │   └── midi.rs
│   │   │
│   │   ├── helpers/               # NEW: Test utilities
│   │   │   ├── mod.rs
│   │   │   └── temp_files.rs
│   │   │
│   │   ├── integration/           # NEW: Integration tests
│   │   │   ├── lesson_loading.rs
│   │   │   ├── midi_flow.rs
│   │   │   └── config_loading.rs
│   │   │
│   │   └── property/              # NEW: Property tests
│   │       ├── chord_grouper.rs
│   │       └── event_processor.rs
│   │
│   ├── benches/                   # NEW: Benchmarks
│   │   ├── chord_grouping.rs
│   │   └── lesson_loading.rs
│   │
│   └── Cargo.toml                 # Update with dev-dependencies
│
└── .github/
    └── workflows/
        └── test.yml               # NEW: CI/CD pipeline
```

---

## 🚀 Quick Wins (Can Implement Now)

### 1. Add Error Types (30 minutes)

Create `src-tauri/src/errors.rs`:
```rust
use thiserror::Error;

#[derive(Error, Debug, PartialEq)]
pub enum AppError {
    #[error("Lesson not found: {0}")]
    LessonNotFound(String),

    #[error("Invalid lesson format: {0}")]
    InvalidFormat(String),

    #[error("MIDI error: {0}")]
    Midi(String),
}

// Easy conversion for Tauri
impl From<AppError> for String {
    fn from(e: AppError) -> String {
        e.to_string()
    }
}
```

Update `Cargo.toml`:
```toml
[dependencies]
thiserror = "1.0"  # Already have it!
```

### 2. Create Test Fixtures (30 minutes)

Create `src-tauri/tests/fixtures/mod.rs`:
```rust
use piano_lessons::{LessonConfig, lesson_config::{Measure, NoteEvent}};

pub fn simple_c_scale() -> LessonConfig {
    LessonConfig {
        name: "C Major Scale".to_string(),
        description: "Simple scale for testing".to_string(),
        tempo: Some(120),
        time_signature: Some("4/4".to_string()),
        key_signature: Some("C major".to_string()),
        notes: vec![60, 62, 64, 65, 67, 69, 71, 72],
        measures: vec![],
        composer: None,
        difficulty: None,
    }
}

pub fn chord_progression() -> LessonConfig {
    // C - F - G - C progression
    LessonConfig {
        name: "Basic Chords".to_string(),
        description: "I-IV-V-I progression".to_string(),
        tempo: Some(100),
        time_signature: Some("4/4".to_string()),
        key_signature: Some("C major".to_string()),
        notes: vec![],
        measures: vec![
            Measure {
                number: 1,
                notes: vec![
                    NoteEvent::ChordReference {
                        chord: "C Major".to_string(),
                        duration: 4.0,
                        dynamic: None,
                        hand: Some("right".to_string()),
                    }
                ],
            }
        ],
        composer: None,
        difficulty: None,
    }
}
```

### 3. Add Integration Test (30 minutes)

Create `src-tauri/tests/integration/lesson_test.rs`:
```rust
use piano_tauri_backend::adapters::LessonAdapter;

mod fixtures;
use fixtures::simple_c_scale;

#[test]
fn test_load_simple_lesson() {
    let lesson_config = simple_c_scale();
    let dto = LessonAdapter::config_to_dto(lesson_config);

    assert_eq!(dto.title, "C Major Scale");
    assert_eq!(dto.tempo, 120);
    assert_eq!(dto.measures.len(), 1);
    assert_eq!(dto.measures[0].notes.len(), 8);
}
```

---

## 🎯 Benefits of These Improvements

| Improvement | Benefit | Priority |
|-------------|---------|----------|
| **Structured Errors** | Can assert specific error types | HIGH |
| **Test Fixtures** | Reusable, consistent test data | HIGH |
| **Integration Tests** | Catch interaction bugs | HIGH |
| **Property Tests** | Find edge cases automatically | MEDIUM |
| **Coverage Reports** | See what's untested | MEDIUM |
| **Benchmarks** | Detect performance regressions | LOW |
| **Test Builders** | Easy test data variations | LOW |

---

## 📈 Measuring Success

### Current Metrics
- 51 unit tests ✅
- 0 integration tests ❌
- 0 property tests ❌
- Unknown coverage ❌

### Target Metrics
- 51+ unit tests ✅
- 15+ integration tests 🎯
- 5+ property tests 🎯
- 80%+ coverage 🎯
- < 1ms chord grouping 🎯

---

## 🚦 Next Steps

### Immediate (This Week)
1. ✅ Add error types module
2. ✅ Create test fixtures
3. ✅ Add 3-5 integration tests

### Short-term (Next 2 Weeks)
4. Add property-based tests
5. Set up coverage reporting
6. Add benchmarks

### Long-term (Next Month)
7. CI/CD pipeline with automated tests
8. Snapshot testing for complex outputs
9. Performance regression detection

---

## 📝 Template for New Tests

```rust
// Template for integration test
#[test]
fn test_[feature_name]_[scenario]() {
    // Arrange: Set up test data
    let input = fixtures::simple_lesson();

    // Act: Execute the code
    let result = function_under_test(input);

    // Assert: Verify results
    assert!(result.is_ok());
    let output = result.unwrap();
    assert_eq!(output.field, expected_value);

    // Cleanup (if needed)
    cleanup_resources();
}
```

---

**Want me to implement any of these improvements right now?**

The quickest wins are:
1. Error types (30 min)
2. Test fixtures (30 min)
3. First integration tests (30 min)

Total: **90 minutes** for significant testability improvement! 🚀
