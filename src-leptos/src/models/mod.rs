// Models - Frontend data structures (mirror of backend)
// Used for type safety when calling Tauri commands

pub mod evaluation;
pub mod lesson;
pub mod note;
pub mod playback;

#[allow(unused_imports)] // Phase 4+: will be used when evaluation is implemented
pub use evaluation::*;
pub use lesson::*;
pub use note::*;
#[allow(unused_imports)] // Phase 4+: will be used when playback is implemented
pub use playback::*;
