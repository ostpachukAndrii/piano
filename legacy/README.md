# Legacy Code

This directory contains the original MIDI implementation that has been replaced by the new clean architecture.

## Contents

- `handlers/` - Console event handlers (replaced by piano-app)
- `midi/` - MIDI event definitions (replaced by piano-midi)
- `sources/` - USB MIDI sources (replaced by piano-midi)
- `utils/` - Helper functions (replaced by domain utilities)
- `main.rs` - Binary entry point (delegates to piano-cli)
- `lib.rs` - Deprecated library exports

## Why It's Preserved

This code is kept for:
1. Historical reference
2. Understanding the evolution of the architecture
3. Binary compatibility (main.rs delegation)

## Migration Status

All functionality has been reimplemented in:
- `crates/piano-midi/` - MIDI infrastructure
- `crates/piano-domain/` - Domain models
- `crates/piano-app/` - Application logic
- `crates/piano-cli/` - User interface

**Do not add new features to this legacy code.**
