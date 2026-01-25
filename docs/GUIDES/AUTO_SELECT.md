# Auto-Selection Feature

## Change Summary

Updated `src/main.rs` to automatically select the MIDI device when only one is available, while still printing a message showing which device was selected.

## Behavior

### Before (Multiple Devices)
```
Available MIDI Inputs:
0: Roland Digital Piano
1: Yamaha Keyboard

Select MIDI input (enter number or press Enter for first available):
```
User must select a device.

### After (Single Device)
```
Available MIDI Inputs:
0: Roland Digital Piano

✓ Automatically selected: Roland Digital Piano

Connecting to: Roland Digital Piano
...
```
Device is selected automatically - no user input needed!

### With Multiple Devices
Behavior unchanged - user still selects manually.

## Implementation Details

```rust
let port_index = if ports.len() == 1 {
    println!("\n✓ Automatically selected: {}\n", ports[0]);
    0
} else {
    // Get user input for port selection
    println!("\nSelect MIDI input (enter number or press Enter for first available):");
    let mut input = String::new();
    stdin().read_line(&mut input).expect("Failed to read input");
    input.trim().parse().unwrap_or(0)
};
```

## Benefits

- ✅ **Faster startup** - No user interaction needed for single device
- ✅ **Better UX** - Clear message showing what was auto-selected
- ✅ **Backward compatible** - Multiple devices still work as before
- ✅ **User informed** - Message shows the choice made

## Testing

Run with your Roland FP E50:
```bash
cargo run --release
```

Expected output with single device:
```
Roland Piano MIDI Reader
========================

Available MIDI Inputs:
0: Roland Digital Piano

✓ Automatically selected: Roland Digital Piano

Connecting to: Roland Digital Piano

Listening for MIDI events. Press Ctrl+C to exit.

Playing keys on your Roland FP E50...
```

Then play keys - no manual selection needed!
