//! # Legacy MIDI Code (Deprecated)
//!
//! This module contains the original MIDI implementation that has been
//! replaced by the new clean architecture in the `crates/` directory.
//!
//! ## Migration Path
//!
//! The functionality from this legacy code has been reimplemented in:
//! - `crates/piano-midi/` - MIDI device handling and events
//! - `crates/piano-domain/` - Core domain models
//! - `crates/piano-app/` - Application logic
//!
//! **Do not use this code for new features.**
//! This is preserved for reference only.

#![allow(dead_code)]
#![deprecated(
    since = "0.1.0",
    note = "Use crates/piano-midi and crates/piano-domain instead"
)]
