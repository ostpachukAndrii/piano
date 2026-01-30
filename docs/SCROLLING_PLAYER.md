# Scrolling Player Component

Guitar Hero / Synthesia style scrolling music notation player for piano lessons.

## Features

- **3-Zone Layout**:
  - Top Control Bar (15%): Progress, tempo, play/pause, mode toggle
  - Scrolling Stage (60%): Grand staff with scrolling notes
  - Virtual Keyboard (25%): Interactive piano keys with hints

- **Playback Modes**:
  - **Flow Mode**: Continuous playback, notes scroll automatically
  - **Wait Mode**: Step-by-step, waits for correct input before advancing

- **Visual Feedback**:
  - Notes change color based on state (upcoming, active, hit, missed)
  - Keyboard keys highlight to show what to play
  - Playhead at 25% from left with glow effect

## Usage

### In Parent Component

```typescript
<app-scrolling-player
  [lesson]="lesson"
  [activeNotes]="activeNotesArray"
  (completed)="onLessonComplete()"
  (paused)="onPaused()">
</app-scrolling-player>
```

### Inputs

- `lesson: LessonDTO | null` - Lesson data with measures and notes
- `activeNotes: number[]` - Currently pressed MIDI note numbers

### Outputs

- `completed: void` - Emitted when lesson finishes
- `paused: void` - Emitted when play/pause is toggled

## Storybook

Run Storybook to see interactive examples:

```bash
npm run storybook
```

Navigate to **Components > ScrollingPlayer** to see:

1. **Default** - C Major scale (right hand)
2. **TwoHands** - Coordination exercise
3. **WithChords** - Chord progression
4. **FastTempo** - Speed exercise (180 BPM)
5. **WideRange** - Notes across multiple octaves
6. **NoLesson** - Empty state
7. **WithActiveNotes** - Shows active keyboard feedback

### Manual Testing in Storybook

1. Click the **play button (▶)** to start
2. Adjust **tempo slider** (25% to 150%)
3. Toggle **Flow/Wait mode**
4. Watch notes scroll from right to left
5. Observe keyboard highlights

## Testing

Run unit tests:

```bash
npm test -- scrolling-player.component.spec.ts
```

### Test Coverage

- ✅ Component initialization
- ✅ Lesson loading and note parsing
- ✅ Playback control (start/stop/toggle)
- ✅ Tempo adjustment
- ✅ Play mode switching
- ✅ Virtual keyboard generation
- ✅ Progress tracking
- ✅ Edge cases (empty lesson, no notes)
- ✅ Cleanup on destroy

## Architecture

### Signals (Reactive State)

- `isPlaying` - Boolean playback state
- `playMode` - 'flow' | 'wait'
- `tempoPercent` - 25 to 150
- `progressPercent` - 0 to 100
- `currentBeat` - Current position in beats
- `playheadX` - X position of playhead (300px = 25% of 1200)
- `keyboardWidth` - Width of virtual keyboard (800px)
- `keyStates` - Map of MIDI numbers to key states
- `keyboardRange` - { min, max } MIDI range

### Computed Values

- `visibleKeys` - Array of piano keys to render

### Animation Loop

The `gameLoop()` method:
1. Calculates delta time
2. Advances beat position based on tempo
3. Updates note states (upcoming → active → hit/missed)
4. Updates keyboard hints
5. Checks for completion
6. Renders canvas
7. Requests next frame

### Canvas Rendering

Layered rendering approach:
- Background (dark blue gradient)
- Staff lines (treble + bass)
- Notes (colored rectangles with state-based colors)
- Playhead glow (gradient effect)

## Known Issues & Future Improvements

- [ ] Add ledger lines for notes outside staff range
- [ ] Implement note stems and beams for proper notation
- [ ] Add clefs, time signature, key signature symbols
- [ ] Implement proper rest symbols
- [ ] Add fingering numbers display
- [ ] Implement score evaluation with feedback
- [ ] Add sound playback (integrate with PianoSoundService)
- [ ] Responsive layout for different screen sizes
- [ ] Accessibility: keyboard navigation and screen reader support

## Performance

- Target: 60 FPS during playback
- Canvas size: 1200x400px
- Animation uses `requestAnimationFrame`
- Notes outside viewport are skipped during rendering

## Dependencies

- Angular 18 (signals, standalone components)
- Angular Material (buttons, sliders, progress bar)
- Canvas API for rendering
- RxJS effects for MIDI input reactivity
