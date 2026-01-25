//! MIDI Device abstraction

use crate::error::MidiError;
use crate::event::MidiEvent;
use midir::{MidiInput, MidiInputConnection};
use std::sync::mpsc;

/// MIDI device information
#[derive(Debug, Clone)]
pub struct MidiDevice {
    /// Device name
    pub name: String,
    /// Device port index
    pub port: usize,
}

/// MIDI device manager
pub struct MidiDeviceManager {
    input: MidiInput,
}

/// Connected MIDI input device
pub struct ConnectedMidiDevice {
    _connection: MidiInputConnection<()>,
    rx: mpsc::Receiver<MidiEvent>,
}

impl ConnectedMidiDevice {
    /// Receive the next MIDI event (non-blocking)
    pub fn try_recv(&mut self) -> Option<MidiEvent> {
        self.rx.try_recv().ok()
    }

    /// Get a reference to the receiver for polling in a loop
    pub fn receiver(&self) -> &mpsc::Receiver<MidiEvent> {
        &self.rx
    }
}

impl MidiDeviceManager {
    /// Create a new MIDI device manager
    pub fn new() -> Result<Self, MidiError> {
        let input = MidiInput::new("Piano Lesson Input")
            .map_err(|e| MidiError::ConnectionFailed(e.to_string()))?;
        Ok(MidiDeviceManager { input })
    }

    /// List all available MIDI input devices
    pub fn list_devices(&self) -> Result<Vec<MidiDevice>, MidiError> {
        let mut devices = Vec::new();

        for (port, name) in self.input.ports().iter().enumerate() {
            if let Ok(name) = self.input.port_name(name) {
                devices.push(MidiDevice { name, port });
            }
        }

        if devices.is_empty() {
            return Err(MidiError::NoInputsFound);
        }

        Ok(devices)
    }

    /// Get a specific device by index
    pub fn get_device(&self, index: usize) -> Result<MidiDevice, MidiError> {
        let devices = self.list_devices()?;
        devices
            .get(index)
            .cloned()
            .ok_or(MidiError::InvalidDeviceIndex)
    }

    /// Connect to a MIDI device and return a receiver for events
    /// This consumes the MidiDeviceManager since the connection needs ownership of the MidiInput
    pub fn connect(self, device_index: usize) -> Result<ConnectedMidiDevice, MidiError> {
        let ports = self.input.ports();

        if device_index >= ports.len() {
            return Err(MidiError::InvalidDeviceIndex);
        }

        let (tx, rx) = mpsc::channel();
        let port_ref = &ports[device_index];

        let connection = self
            .input
            .connect(
                port_ref,
                "Piano Input",
                move |_stamp: u64, message: &[u8], _data: &mut ()| {
                    if let Some(event) = MidiEvent::from_bytes(message) {
                        let _ = tx.send(event);
                    }
                },
                (),
            )
            .map_err(|e| MidiError::ConnectionFailed(e.to_string()))?;

        Ok(ConnectedMidiDevice {
            _connection: connection,
            rx,
        })
    }
}

impl Default for MidiDeviceManager {
    fn default() -> Self {
        Self::new().expect("Failed to create MIDI device manager")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_device_creation() {
        // This test might fail if there are no MIDI devices, which is expected
        let _ = MidiDeviceManager::new();
    }
}
