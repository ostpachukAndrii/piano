# API Timing Examples

## Real-World Usage Examples

### Example 1: Simple Lesson with Timing

**Request:**
```
GET /api/v1/lessons/alphabet
```

**Response:**
```json
{
  "id": "alphabet",
  "name": "Alphabet Song",
  "description": "Learn the alphabet with timing",
  "total_events": 5,
  "note_events": [
    {
      "type": "single",
      "note": 60,
      "note_name": "C4",
      "duration_ms": 500
    },
    {
      "type": "single",
      "note": 62,
      "note_name": "D4",
      "duration_ms": 500
    },
    {
      "type": "single",
      "note": 64,
      "note_name": "E4",
      "duration_ms": 1000
    },
    {
      "type": "single",
      "note": 65,
      "note_name": "F4",
      "duration_ms": 500
    },
    {
      "type": "single",
      "note": 67,
      "note_name": "G4",
      "duration_ms": null
    }
  ]
}
```

### Example 2: Chord Practice Lesson

**Request:**
```
GET /api/v1/lessons/two_hand_chords
```

**Response:**
```json
{
  "id": "two_hand_chords",
  "name": "Two Hand Chord Practice",
  "total_events": 3,
  "note_events": [
    {
      "type": "chord",
      "notes": [60, 64, 67],
      "note_names": ["C4", "E4", "G4"],
      "chord_name": "C Major",
      "hand": "both",
      "duration_ms": 1000
    },
    {
      "type": "chord",
      "notes": [65, 69, 72],
      "note_names": ["F4", "A4", "C5"],
      "chord_name": "F Major",
      "hand": "both",
      "duration_ms": 1000
    },
    {
      "type": "chord",
      "notes": [67, 71, 74],
      "note_names": ["G4", "B4", "D5"],
      "chord_name": "G Major",
      "hand": "both",
      "duration_ms": 1500
    }
  ]
}
```

### Example 3: Session Status with Current Timing

**Request:**
```
GET /api/v1/sessions/sess_abc123
```

**Response:**
```json
{
  "session_id": "sess_abc123",
  "lesson_id": "two_hand_chords",
  "lesson_name": "Two Hand Chord Practice",
  "current_index": 1,
  "total_events": 3,
  "progress_percent": 33,
  "status": "active",
  "current_expected_event": {
    "type": "chord",
    "notes": [65, 69, 72],
    "note_names": ["F4", "A4", "C5"],
    "chord_name": "F Major",
    "hand": "both",
    "duration_ms": 1000
  },
  "statistics": {
    "correct_notes": 1,
    "accuracy_percent": 100,
    "elapsed_time_seconds": 5
  }
}
```

### Example 4: MIDI Event Validation with Timing Feedback

**Request:**
```
POST /api/v1/sessions/sess_abc123/events

{
  "event_type": "note_on",
  "midi_number": 65,
  "velocity": 80,
  "timestamp": "2026-01-24T10:30:05Z"
}
```

**Response:**
```json
{
  "is_correct": true,
  "expected_event": {
    "type": "chord",
    "notes": [65, 69, 72],
    "note_names": ["F4", "A4", "C5"],
    "chord_name": "F Major",
    "hand": "both",
    "duration_ms": 1000
  },
  "message": "Correct chord! Now hold for 1000ms",
  "should_advance": false,
  "timing_required_ms": 1000,
  "notes_played": [65],
  "notes_missing": [69, 72]
}
```

### Example 5: WebSocket Progress Update with Timing

**Server → Client Message:**
```json
{
  "type": "progress_update",
  "current_index": 2,
  "total_events": 3,
  "progress_percent": 67,
  "current_expected_event": {
    "type": "chord",
    "notes": [67, 71, 74],
    "note_names": ["G4", "B4", "D5"],
    "chord_name": "G Major",
    "hand": "both",
    "duration_ms": 1500
  }
}
```

## Client Implementation Examples

### Example 1: Display Duration Timer (JavaScript/React)

```javascript
// Show user how long they need to hold the note
function displayNoteWithTimer({ noteEvent }) {
  const { note_name, duration_ms } = noteEvent;
  
  if (duration_ms === null) {
    return <p>Press {note_name}</p>;
  }
  
  const seconds = (duration_ms / 1000).toFixed(1);
  return (
    <div>
      <p>Hold {note_name} for {seconds} seconds</p>
      <ProgressBar duration={duration_ms} />
    </div>
  );
}
```

### Example 2: Validate Timing Accuracy (TypeScript)

```typescript
function checkTimingAccuracy(
  expectedDuration: number | null,
  actualDuration: number,
  tolerance: number = 200
): { isCorrect: boolean; feedback: string } {
  if (expectedDuration === null) {
    return { isCorrect: true, feedback: "No timing requirement" };
  }
  
  const diff = Math.abs(expectedDuration - actualDuration);
  
  if (diff <= tolerance) {
    return { isCorrect: true, feedback: "Perfect timing!" };
  } else if (actualDuration < expectedDuration) {
    return { isCorrect: false, feedback: "Hold longer" };
  } else {
    return { isCorrect: false, feedback: "Release sooner" };
  }
}
```

### Example 3: Create Practice Report (Python)

```python
def analyze_lesson_timing(lesson_events, user_performance):
    """Generate timing accuracy report"""
    report = {
        "total_notes": len(lesson_events),
        "notes_with_timing": 0,
        "perfect_timing": 0,
        "timing_errors": [],
        "average_timing_error_ms": 0
    }
    
    total_error = 0
    count = 0
    
    for i, event in enumerate(lesson_events):
        if event['duration_ms'] is not None:
            report['notes_with_timing'] += 1
            expected = event['duration_ms']
            actual = user_performance[i]['actual_duration_ms']
            
            error = abs(expected - actual)
            total_error += error
            count += 1
            
            if error <= 200:
                report['perfect_timing'] += 1
            else:
                report['timing_errors'].append({
                    'note_index': i,
                    'expected_ms': expected,
                    'actual_ms': actual,
                    'error_ms': error
                })
    
    if count > 0:
        report['average_timing_error_ms'] = total_error / count
    
    return report
```

### Example 4: Auto-Play with Timing (Rust)

```rust
async fn auto_play_lesson(lesson: &Lesson, midi_device: &MidiDevice) {
    for event in lesson.note_events() {
        // Send note on
        for midi_number in event.midi_numbers() {
            midi_device.send_note_on(midi_number, 80).await;
        }
        
        // Hold for specified duration
        if let Some(duration_ms) = event.duration_ms() {
            tokio::time::sleep(Duration::from_millis(duration_ms)).await;
        } else {
            // Default hold time if not specified
            tokio::time::sleep(Duration::from_millis(500)).await;
        }
        
        // Send note off
        for midi_number in event.midi_numbers() {
            midi_device.send_note_off(midi_number).await;
        }
    }
}
```

## Summary

With timing information in the API, you can now build:

- ✅ Visual progress indicators showing required note duration
- ✅ Automatic timing validation and feedback
- ✅ Educational reports on timing accuracy
- ✅ Auto-play functionality that respects note durations
- ✅ Rhythm and tempo-based practice exercises
- ✅ Rhythm game modes with timing scoring
