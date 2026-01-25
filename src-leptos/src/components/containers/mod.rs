// Containers - Smart components with logic and hooks
// Phase 3: Implemented main containers with full logic
// 4 containers total (these HAVE state and logic):
// 1. lesson_stage - Main game container ✅ IMPLEMENTED
// 2. lesson_select - Lesson picker
// 3. results_view - Show results after session
// 4. practice_mode - Game mode selector

pub mod lesson_stage;
pub mod lesson_select;
pub mod results_view;
pub mod practice_mode;

pub use lesson_stage::LessonStage;
pub use lesson_select::LessonSelect;
pub use results_view::ResultsView;
pub use practice_mode::PracticeMode;
