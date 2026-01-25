// Tauri integration - Call backend commands from frontend
// Each function calls a Tauri command and returns a Future

pub mod evaluation;
pub mod lesson;
pub mod midi;
pub mod playback;

#[allow(unused_imports)] // Phase 6: will be used when evaluation is connected
pub use evaluation::*;
#[allow(unused_imports)] // Phase 4: will be used when lesson loading is connected
pub use lesson::*;
#[allow(unused_imports)] // Phase 5: will be used when MIDI is connected
pub use midi::*;
#[allow(unused_imports)] // Phase 4+: will be used when playback is connected
pub use playback::*;
