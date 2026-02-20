# Roland - Piano Learning App

## Project Overview
Interactive piano learning app: **Angular 18 frontend** + **Rust Tauri v2 backend**.
Real-time MIDI input, music notation rendering, lesson system, and gamification.

## Project Structure
- `src/` — Angular 18 frontend (root is `src/`, sources in `src/src/`)
- `src-tauri/` — Tauri v2 Rust backend (MIDI, Bluetooth, MusicXML, SQLite)
- `crates/` — Rust workspace crates (piano-domain, piano-midi, piano-lessons, piano-app, piano-cli)
- `lessons/` — YAML lesson files

## Build & Run Commands

### Frontend
```bash
cd src && npm start          # Dev server @ localhost:4200
cd src && npm run build      # Production build
cd src && npm test           # Karma + Jasmine tests
cd src && npm run storybook  # Storybook @ localhost:6006
```

### Rust Backend
```bash
cargo check                        # Verify all crates compile
cd src-tauri && cargo build        # Build Tauri backend
```

### Full App (Tauri)
```bash
cargo tauri dev      # Dev build with hot-reload
cargo tauri build    # Production build
```

## Angular Guidelines

### Architecture
- **Standalone components only** — no NgModules. Every component uses `standalone: true`
- **Feature-based structure**: `features/` for pages, `shared/` for reusable components, `core/` for services & models
- **Lazy loading** via route-level code splitting

### Components
- Use `standalone: true` with explicit `imports` array for every component
- Prefer **inline templates** for small components, separate `.html` for large ones
- Use **SCSS** for all component styles (configured in angular.json)
- Component prefix is `app-`
- Skip test file generation (configured in angular.json schematics: `skipTests: true`)

### State Management
- Use **Angular Signals** (`signal()`, `computed()`, `effect()`) for reactive state — not BehaviorSubject
- Use `_private = signal()` with `public = this._private.asReadonly()` pattern for encapsulation
- Use `inject()` function for dependency injection — not constructor injection

### Services
- All services use `@Injectable({ providedIn: 'root' })`
- Services hold state via signals, expose readonly versions
- Backend communication goes through `BackendClient` abstraction (`BACKEND_CLIENT` injection token)
- MIDI service handles device detection and event aggregation

### Routing
- Routes defined in `app.routes.ts`
- Key routes: `/` (home), `/lessons` (selector), `/lesson/:id` (player), `/settings`

### UI & Styling
- **Angular Material 18** (indigo-pink theme) for UI components
- Global styles in `src/styles.scss`
- **GSAP** for animations
- Use Material components (`mat-toolbar`, `mat-button`, etc.) for consistent UI

### TypeScript
- **Strict mode** enabled (strict, strictTemplates, strictInjectionParameters)
- Target: ES2022
- Use interfaces in `core/models/` for shared types

### Testing
- Karma + Jasmine for unit tests
- Playwright for E2E (root `package.json`)
- Storybook for component documentation and visual testing

## After Every Code Change

**Always run tests after modifying code.** This is mandatory — do not skip.

### Frontend changes (`src/`)
```bash
cd src && npm test              # Unit tests (Karma + Jasmine)
npm run e2e                     # E2E tests (Playwright, from project root)
```

### Rust changes (`src-tauri/`, `crates/`)
```bash
cargo check                     # Verify compilation
cargo test                      # Rust unit tests
npm run e2e                     # E2E tests if the change affects frontend behavior
```

**Important:** When modifying Rust backend commands (adding/changing/removing Tauri `invoke` commands, changing their arguments or return types), you **must** update the E2E mock to match:
- `src/src/app/core/services/mock-tauri.service.ts` — handles all mocked Tauri commands (`check_pitch`, `check_note`, `get_stats`, `reset_stats`, `list_lessons`, `load_lesson`). Add/update cases in the `invoke()` switch statement to match any backend changes.
- If new lesson data or models are added in Rust, update the mock lesson data in `MockTauriService` as well.

### E2E test details
- Tests live in `e2e/` directory at project root
- Run with `npm run e2e` (headless) or `npm run e2e:headed` (visible browser)
- E2E mode uses `?e2e` query param → loads `app.config.e2e.ts` with `MockTauriService` + `MockBackendClient`
- MIDI key presses are simulated via `window.__mockBackend.simulateChord()` — no real piano needed
- Fix any failing tests before considering the change complete

## Rust Guidelines

- Edition 2021, Clippy all=warn, unsafe_code=warn
- Serde for all serialization (JSON between Tauri↔Angular, YAML for lessons)
- Domain types live in `piano-domain` crate and are shared across all crates
- MIDI handling uses `midir` with winrt backend for Bluetooth support

## General Rules
- Do not modify `legacy/` folder — it contains old non-Angular code kept for reference
- Lesson data is YAML-based in `lessons/` directory
- Music notation rendering is custom SVG-based (not a library) in `features/lesson-player/notation-stage/`
