# Piano UI Application - Architecture & Plan

Date: January 25, 2026

## 📋 Requirements

### User Interface Features
1. **Musical Score Display**
   - Show notes on a musical staff (treble clef)
   - Highlight current note to play
   - Show expected duration with visual indicator
   - Chord visualization

2. **Real-time Feedback**
   - Current note indicator (what to play now)
   - Next note preview (what comes next)
   - Duration bar (how long to hold)
   - Timing accuracy feedback

3. **Lesson Timeline**
   - Visual timeline of all events
   - Current position indicator
   - Progress bar
   - Event markers (note, chord, rest)

4. **Statistics & Performance**
   - Accuracy percentage
   - Notes played correctly
   - Timing variance display
   - Attempt counter

### Technical Requirements
- Real-time communication (WebSocket/SignalR)
- REST API client for lesson data
- Beautiful, responsive UI
- Cross-platform support
- Low latency for real-time feedback

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser / Web App                     │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐   ┌────────────┐ │
│  │  UI Layer    │    │  Components  │   │  Services  │ │
│  │  (Vue/React/ │    │ ┌──────────┐ │   │ ┌────────┐ │ │
│  │   Angular)   │    │ │Score     │ │   │ │API     │ │ │
│  │              │    │ │Timeline  │ │   │ │Service │ │ │
│  │              │    │ │Notes     │ │   │ │WebSocket│ │ │
│  │              │    │ │Stats     │ │   │ │         │ │ │
│  │              │    │ └──────────┘ │   │ └────────┘ │ │
│  └──────────────┘    └──────────────┘   └────────────┘ │
└────────────────────────────────────────────────────────┘
         │                                    │
         │ REST + WebSocket                   │
         ▼                                    ▼
┌─────────────────────────────────────────────────────────┐
│            Backend API Server (Rust)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  REST Endpoints (GET /lessons, POST /sessions)  │  │
│  │  WebSocket (WS /ws/sessions/{id})               │  │
│  │  Lesson Data & Statistics                       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Technology Stack

### Frontend Options

#### Option 1: Vue 3 (Recommended for simplicity)
- **Why:** Lightweight, easy to learn, great for real-time apps
- **Libraries:**
  - `vite` - Build tool
  - `socket.io-client` or native WebSocket
  - `vexflow` or `staff.js` - Musical notation
  - `pinia` - State management
  - `tailwindcss` - Styling

#### Option 2: React 18 (Recommended for scalability)
- **Why:** Mature, large ecosystem, performance
- **Libraries:**
  - `vite` - Build tool
  - `useCallback` hooks for real-time updates
  - `vexflow` - Musical notation
  - `zustand` or `redux` - State management
  - `tailwindcss` - Styling

#### Option 3: Angular (Full-featured)
- **Why:** Complete framework, TypeScript out of the box
- **Libraries:**
  - `@angular/core` - Framework
  - `ngx-socket-io` - WebSocket
  - `vexflow` - Musical notation
  - `ngrx` - State management
  - `tailwindcss` - Styling

### My Recommendation: **Vue 3 with TypeScript**
- Simplicity + Power
- VexFlow for musical notation
- Socket.IO for real-time communication
- Tailwind CSS for styling

## 📦 Project Structure

```
piano-ui/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── App.vue
│   ├── main.ts
│   ├── components/
│   │   ├── MusicalScore.vue      # Staff with notes
│   │   ├── Timeline.vue          # Lesson timeline
│   │   ├── NoteIndicator.vue     # Current note display
│   │   ├── DurationBar.vue       # Duration visualization
│   │   └── Statistics.vue        # Performance stats
│   ├── views/
│   │   ├── LessonSelect.vue      # Choose lesson
│   │   ├── LessonPlay.vue        # Main playing screen
│   │   └── Results.vue           # Statistics results
│   ├── services/
│   │   ├── api.ts                # REST API client
│   │   ├── websocket.ts          # WebSocket handler
│   │   └── midiInput.ts          # MIDI device access
│   ├── stores/
│   │   ├── lessonStore.ts        # Lesson state
│   │   └── sessionStore.ts       # Session state
│   ├── styles/
│   │   └── main.css              # Global styles
│   └── types/
│       └── index.ts              # TypeScript types
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## 🔌 Communication Protocol

### REST API Endpoints (Initial data)
```
GET  /api/v1/lessons               # List all lessons
GET  /api/v1/lessons/{id}          # Get lesson details
POST /api/v1/sessions              # Start session
GET  /api/v1/sessions/{id}         # Get session status
POST /api/v1/sessions/{id}/events  # Submit MIDI event
```

### WebSocket Messages

**Client → Server (MIDI Events)**
```json
{
  "type": "midi_event",
  "event": {
    "event_type": "note_on",
    "midi_number": 60,
    "velocity": 80,
    "timestamp": "2026-01-25T10:30:05Z"
  }
}
```

**Server → Client (Progress Updates)**
```json
{
  "type": "progress_update",
  "current_index": 3,
  "total_events": 8,
  "progress_percent": 37,
  "current_expected_event": {
    "type": "chord",
    "notes": [60, 64, 67],
    "note_names": ["C4", "E4", "G4"],
    "chord_name": "C Major",
    "duration_ms": 800
  }
}
```

**Server → Client (Feedback)**
```json
{
  "type": "feedback",
  "is_correct": true,
  "message": "Perfect timing!",
  "should_advance": true,
  "played_notes": [60, 64, 67],
  "chord_timing_ms": 95
}
```

## 🎨 UI Components

### 1. MusicalScore Component
- Display staff with treble clef
- Render all lesson notes
- Highlight current note
- Show chord groupings
- Color coding for status (correct/incorrect/pending)

### 2. Timeline Component
- Horizontal timeline of events
- Show event types (note, chord, rest)
- Current position indicator
- Color-coded progress
- Clicking jumps to event

### 3. NoteIndicator Component
- Large display of current note
- Note name + MIDI number
- Hand indication (L/R/Both)
- Chord name if applicable
- Visual keyboard representation

### 4. DurationBar Component
- Visual bar showing time held
- Expected duration marker
- Real-time progress
- Variance indicator (early/late)
- Color feedback (green/yellow/red)

### 5. Statistics Panel
- Overall accuracy %
- Notes correct / Total notes
- Timing accuracy %
- Attempts counter
- Mini statistics cards

## 🔄 Data Flow

```
User starts lesson
    ↓
Fetch lesson data via REST
    ↓
Create session via POST /sessions
    ↓
Open WebSocket connection
    ↓
Display lesson (score, notes, timeline)
    ↓
User plays MIDI notes
    ↓
Send MIDI events via WebSocket
    ↓
Receive feedback via WebSocket
    ↓
Update UI in real-time
    ↓
Record statistics
    ↓
Lesson complete
    ↓
Display results with stats
```

## 🚀 Implementation Phases

### Phase 1: Project Setup (1 hour)
- [ ] Create Vue 3 + TypeScript project
- [ ] Set up build configuration
- [ ] Basic project structure
- [ ] Dependencies installation

### Phase 2: API Integration (1.5 hours)
- [ ] Create API client service
- [ ] Implement REST endpoints
- [ ] WebSocket connection handler
- [ ] Type definitions

### Phase 3: Core Components (2 hours)
- [ ] NoteIndicator component
- [ ] DurationBar component
- [ ] Statistics panel
- [ ] Basic styling

### Phase 4: Musical Score (1.5 hours)
- [ ] VexFlow integration
- [ ] Staff rendering
- [ ] Note placement
- [ ] Current note highlighting

### Phase 5: Timeline Component (1 hour)
- [ ] Timeline visualization
- [ ] Position tracking
- [ ] Interactive jumping
- [ ] Progress indication

### Phase 6: Real-time Updates (1 hour)
- [ ] WebSocket event handling
- [ ] State updates
- [ ] UI refresh
- [ ] Feedback display

### Phase 7: Polish & Testing (1 hour)
- [ ] Responsive design
- [ ] Performance optimization
- [ ] Error handling
- [ ] Testing

## 📊 State Management

Using Vue's Composition API + Pinia:

```typescript
// Lesson Store
interface LessonState {
  lessons: Lesson[]
  currentLesson: Lesson | null
  loading: boolean
  error: string | null
}

// Session Store
interface SessionState {
  sessionId: string | null
  currentIndex: number
  totalEvents: number
  progressPercent: number
  currentEvent: NoteEvent | null
  nextEvent: NoteEvent | null
  statistics: SessionStatistics
  connected: boolean
}

// UI Store
interface UIState {
  showScore: boolean
  showTimeline: boolean
  showStats: boolean
  theme: 'light' | 'dark'
}
```

## 🎯 Feature Priorities

### Must Have (MVP)
- ✅ Lesson selection
- ✅ Real-time note display
- ✅ Duration bar
- ✅ Progress indication
- ✅ Statistics display

### Should Have (v1)
- ✅ Musical score rendering
- ✅ Timeline visualization
- ✅ Keyboard representation
- ✅ Chord visualization
- ✅ Timing feedback

### Nice to Have (v2)
- Playback mode (hear lesson)
- Slow-down/speed-up tempo
- Settings panel
- Dark mode
- Audio waveform display
- Video tutorials

## 🔧 Development Setup

```bash
# Create project
npm create vite@latest piano-ui -- --template vue-ts

# Install dependencies
cd piano-ui
npm install

# Add packages
npm install -D tailwindcss postcss autoprefixer
npm install socket.io-client vexflow pinia axios

# Start dev server
npm run dev

# Build for production
npm run build
```

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: 640px, 768px, 1024px, 1280px
- Touch support for mobile
- Landscape orientation for playing
- Adaptive layouts

## ♿ Accessibility

- ARIA labels for all components
- Keyboard navigation
- High contrast mode
- Screen reader support
- Clear visual feedback

## 📈 Performance Targets

- Initial load: < 2 seconds
- WebSocket latency: < 100ms
- Real-time update rate: 60 FPS
- Bundle size: < 500KB (gzipped)

## 🧪 Testing Strategy

- Unit tests for services (Jest)
- Component tests (Vue Test Utils)
- E2E tests (Cypress or Playwright)
- Performance testing
- Accessibility testing (axe)

## 🔐 Security

- CORS configuration
- Authentication tokens (JWT)
- Secure WebSocket (WSS)
- Input validation
- XSS protection

## 📚 Next Steps

1. Confirm technology choice (Vue 3 recommended)
2. Create project structure
3. Set up build and dependencies
4. Begin with API integration
5. Build core components
6. Add musical score rendering
7. Implement real-time features

Would you like me to proceed with creating the Vue 3 UI application?
