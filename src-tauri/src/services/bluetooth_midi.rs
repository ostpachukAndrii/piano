// Bluetooth MIDI Service
// Handles BLE MIDI device discovery, connection, and event processing
// Uses btleplug for cross-platform Bluetooth Low Energy support

use crate::models::MidiEvent;
use btleplug::api::{
    Central, Characteristic, Manager as _, Peripheral as _, ScanFilter,
};
use btleplug::platform::{Adapter, Manager, Peripheral};
use futures::stream::StreamExt;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tokio::sync::mpsc;
use uuid::Uuid;

/// Standard BLE MIDI Service UUID
const MIDI_SERVICE_UUID: Uuid = Uuid::from_u128(0x03B80E5A_EDE8_4B33_A751_6CE34EC4C700);
/// Standard BLE MIDI Characteristic UUID
const MIDI_CHARACTERISTIC_UUID: Uuid = Uuid::from_u128(0x7772E5DB_3868_4112_A1A9_F2669D106BF3);

/// Bluetooth device info for frontend display
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BluetoothDeviceInfo {
    /// Unique device identifier (address or UUID)
    pub id: String,
    /// Device name
    pub name: String,
    /// Whether device supports MIDI
    pub is_midi_device: bool,
    /// Signal strength (RSSI) if available
    pub rssi: Option<i16>,
}

/// Bluetooth connection status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum BluetoothStatus {
    Disconnected,
    Scanning,
    Connecting,
    Connected,
    Error(String),
}

/// Bluetooth MIDI Service - manages BLE MIDI connections
pub struct BluetoothMidiService {
    /// Bluetooth adapter
    adapter: Option<Adapter>,
    /// Currently connected peripheral
    connected_peripheral: Option<Peripheral>,
    /// MIDI characteristic for notifications
    midi_characteristic: Option<Characteristic>,
    /// Event buffer shared with polling thread
    event_buffer: Arc<Mutex<Vec<MidiEvent>>>,
    /// Current connection status
    status: BluetoothStatus,
    /// Discovered devices cache
    discovered_devices: Vec<(Peripheral, BluetoothDeviceInfo)>,
    /// Start time for timestamp calculations
    start_time: Instant,
}

impl BluetoothMidiService {
    /// Create a new Bluetooth MIDI service
    pub fn new() -> Self {
        Self {
            adapter: None,
            connected_peripheral: None,
            midi_characteristic: None,
            event_buffer: Arc::new(Mutex::new(Vec::new())),
            status: BluetoothStatus::Disconnected,
            discovered_devices: Vec::new(),
            start_time: Instant::now(),
        }
    }

    /// Get a clone of the event buffer for external processing
    pub fn get_event_buffer(&self) -> Arc<Mutex<Vec<MidiEvent>>> {
        Arc::clone(&self.event_buffer)
    }

    /// Get current connection status
    pub fn get_status(&self) -> BluetoothStatus {
        self.status.clone()
    }

    /// Check if Bluetooth adapter is initialized
    pub fn is_initialized(&self) -> bool {
        self.adapter.is_some()
    }

    /// Initialize the Bluetooth adapter
    pub async fn initialize(&mut self) -> Result<(), String> {
        tracing::info!("Creating Bluetooth manager...");

        let manager = Manager::new()
            .await
            .map_err(|e| {
                tracing::error!("Failed to create Bluetooth manager: {}", e);
                format!("Bluetooth not available. Make sure Bluetooth is enabled in Windows Settings. Error: {}", e)
            })?;

        tracing::info!("Getting Bluetooth adapters...");

        let adapters = manager
            .adapters()
            .await
            .map_err(|e| {
                tracing::error!("Failed to get Bluetooth adapters: {}", e);
                format!("Could not access Bluetooth adapter: {}", e)
            })?;

        if adapters.is_empty() {
            tracing::error!("No Bluetooth adapters found on this system");
            return Err("No Bluetooth adapter found. Make sure your PC has Bluetooth hardware and it's enabled.".to_string());
        }

        self.adapter = Some(adapters.into_iter().next().unwrap());
        tracing::info!("Bluetooth adapter initialized successfully");
        Ok(())
    }

    /// Scan for Bluetooth MIDI devices
    pub async fn scan_devices(&mut self, timeout_secs: u64) -> Result<Vec<BluetoothDeviceInfo>, String> {
        tracing::info!("=== BLUETOOTH SCAN START ===");

        let adapter = self.adapter.as_ref().ok_or("Bluetooth not initialized")?;
        tracing::info!("Bluetooth adapter is initialized");

        self.status = BluetoothStatus::Scanning;
        self.discovered_devices.clear();

        // Start scanning
        tracing::info!("Starting BLE scan with default filter...");
        adapter
            .start_scan(ScanFilter::default())
            .await
            .map_err(|e| format!("Failed to start scan: {}", e))?;

        tracing::info!("Scanning for {} seconds...", timeout_secs);

        // Wait for scan duration
        tokio::time::sleep(Duration::from_secs(timeout_secs)).await;

        // Stop scanning
        tracing::info!("Stopping scan...");
        adapter
            .stop_scan()
            .await
            .map_err(|e| format!("Failed to stop scan: {}", e))?;

        // Get discovered peripherals
        let peripherals = adapter
            .peripherals()
            .await
            .map_err(|e| format!("Failed to get peripherals: {}", e))?;

        tracing::info!("Found {} raw peripherals", peripherals.len());

        let mut devices = Vec::new();

        for (i, peripheral) in peripherals.iter().enumerate() {
            tracing::info!("--- Peripheral {} ---", i);
            tracing::info!("  Peripheral ID: {}", peripheral.id());

            let properties = peripheral.properties().await.ok().flatten();

            if let Some(props) = properties {
                let name = props.local_name.clone().unwrap_or_else(|| "Unknown Device".to_string());
                let id = peripheral.id().to_string();

                tracing::info!("  Name: {}", name);
                tracing::info!("  Address: {}", props.address);
                tracing::info!("  RSSI: {:?}", props.rssi);
                tracing::info!("  Services advertised: {}", props.services.len());

                // Log all advertised services
                for service in &props.services {
                    tracing::info!("    Service: {}", service);
                    if *service == MIDI_SERVICE_UUID {
                        tracing::info!("    ^^^ THIS IS MIDI SERVICE!");
                    }
                }

                // Check if device advertises MIDI service
                let is_midi = props
                    .services
                    .iter()
                    .any(|uuid| *uuid == MIDI_SERVICE_UUID);

                tracing::info!("  Is MIDI device: {}", is_midi);

                let info = BluetoothDeviceInfo {
                    id: id.clone(),
                    name: name.clone(),
                    is_midi_device: is_midi,
                    rssi: props.rssi,
                };

                // Store peripheral reference for later connection
                self.discovered_devices.push((peripheral.clone(), info.clone()));

                // Only include devices that might be MIDI (have name or advertise MIDI)
                if is_midi || !name.contains("Unknown") {
                    tracing::info!("  -> Adding to device list");
                    devices.push(info);
                } else {
                    tracing::info!("  -> Skipping (no name and not MIDI)");
                }
            } else {
                tracing::info!("  No properties available for this peripheral");
            }
        }

        self.status = BluetoothStatus::Disconnected;
        tracing::info!("=== BLUETOOTH SCAN COMPLETE ===");
        tracing::info!("Total devices to show: {}", devices.len());
        tracing::info!("Total peripherals stored: {}", self.discovered_devices.len());

        Ok(devices)
    }

    /// Connect to a Bluetooth MIDI device by ID
    pub async fn connect(&mut self, device_id: &str) -> Result<(), String> {
        tracing::info!("=== BLUETOOTH CONNECTION START ===");
        tracing::info!("Device ID to connect: {}", device_id);
        tracing::info!("Number of discovered devices: {}", self.discovered_devices.len());

        // Log all discovered devices
        for (i, (_p, info)) in self.discovered_devices.iter().enumerate() {
            tracing::info!("  Device {}: id={}, name={}, is_midi={}",
                i, info.id, info.name, info.is_midi_device);
        }

        self.status = BluetoothStatus::Connecting;

        // Find the peripheral from discovered devices
        let peripheral = self
            .discovered_devices
            .iter()
            .find(|(_p, info)| info.id == device_id)
            .map(|(p, _)| p.clone())
            .ok_or_else(|| format!("Device {} not found. Try scanning again.", device_id))?;

        tracing::info!("Found peripheral for device_id: {}", device_id);

        // Connection timeout duration
        let timeout = Duration::from_secs(30); // Increased to 30 seconds

        // Step 1: Connect to peripheral with timeout
        tracing::info!("=== STEP 1/4: Connecting to BLE device ===");
        tracing::info!("Timeout set to {} seconds", timeout.as_secs());
        tracing::info!("Starting peripheral.connect()...");

        let connect_start = Instant::now();

        // Use simple async timeout without panic catching (was causing runtime issues)
        match tokio::time::timeout(timeout, peripheral.connect()).await {
            Ok(Ok(())) => {
                tracing::info!("Step 1/4: SUCCESS - BLE connection established in {:?}", connect_start.elapsed());
            }
            Ok(Err(e)) => {
                tracing::error!("Step 1/4: FAILED - Connection error: {}", e);
                self.status = BluetoothStatus::Disconnected;
                return Err(format!("Failed to connect: {}", e));
            }
            Err(_) => {
                tracing::error!("Step 1/4: FAILED - Connection timed out after {:?}", connect_start.elapsed());
                self.status = BluetoothStatus::Disconnected;
                return Err("Connection timed out. Try power cycling your piano and scanning again.".to_string());
            }
        }

        // Step 2: Discover services with timeout
        tracing::info!("=== STEP 2/4: Discovering services ===");
        let discover_start = Instant::now();

        match tokio::time::timeout(timeout, peripheral.discover_services()).await {
            Ok(Ok(())) => {
                tracing::info!("Step 2/4: SUCCESS - Services discovered in {:?}", discover_start.elapsed());
            }
            Ok(Err(e)) => {
                tracing::error!("Step 2/4: FAILED - Service discovery error: {}", e);
                let _ = peripheral.disconnect().await;
                self.status = BluetoothStatus::Disconnected;
                return Err(format!("Failed to discover services: {}", e));
            }
            Err(_) => {
                tracing::error!("Step 2/4: FAILED - Service discovery timed out after {:?}", discover_start.elapsed());
                let _ = peripheral.disconnect().await;
                self.status = BluetoothStatus::Disconnected;
                return Err("Service discovery timed out. Try reconnecting.".to_string());
            }
        }

        // List all services
        let services = peripheral.services();
        tracing::info!("Found {} services:", services.len());
        for service in &services {
            tracing::info!("  Service UUID: {}", service.uuid);
            tracing::info!("  Is MIDI service: {}", service.uuid == MIDI_SERVICE_UUID);
        }

        // Step 3: Find MIDI characteristic
        tracing::info!("=== STEP 3/4: Looking for MIDI characteristic ===");
        tracing::info!("Looking for MIDI characteristic UUID: {}", MIDI_CHARACTERISTIC_UUID);

        let characteristics = peripheral.characteristics();
        tracing::info!("Found {} total characteristics:", characteristics.len());

        for (i, char) in characteristics.iter().enumerate() {
            tracing::info!("  Characteristic {}: UUID={}", i, char.uuid);
            tracing::info!("    Is MIDI: {}", char.uuid == MIDI_CHARACTERISTIC_UUID);
        }

        let midi_char = match characteristics
            .iter()
            .find(|c| c.uuid == MIDI_CHARACTERISTIC_UUID)
            .cloned()
        {
            Some(char) => {
                tracing::info!("Step 3/4: SUCCESS - MIDI characteristic found!");
                char
            }
            None => {
                tracing::error!("Step 3/4: FAILED - MIDI characteristic NOT found!");
                tracing::error!("Expected UUID: {}", MIDI_CHARACTERISTIC_UUID);
                let _ = peripheral.disconnect().await;
                self.status = BluetoothStatus::Disconnected;
                return Err("Device does not support BLE MIDI. Make sure MIDI over Bluetooth is enabled on your piano.".to_string());
            }
        };

        // Step 4: Subscribe to MIDI notifications with timeout
        tracing::info!("=== STEP 4/4: Subscribing to MIDI notifications ===");
        let subscribe_start = Instant::now();

        match tokio::time::timeout(timeout, peripheral.subscribe(&midi_char)).await {
            Ok(Ok(())) => {
                tracing::info!("Step 4/4: SUCCESS - Subscribed to MIDI notifications in {:?}", subscribe_start.elapsed());
            }
            Ok(Err(e)) => {
                tracing::error!("Step 4/4: FAILED - Subscribe error: {}", e);
                let _ = peripheral.disconnect().await;
                self.status = BluetoothStatus::Disconnected;
                return Err(format!("Failed to subscribe to MIDI: {}", e));
            }
            Err(_) => {
                tracing::error!("Step 4/4: FAILED - Subscribe timed out after {:?}", subscribe_start.elapsed());
                let _ = peripheral.disconnect().await;
                self.status = BluetoothStatus::Disconnected;
                return Err("Subscription timed out. Try reconnecting.".to_string());
            }
        }

        self.connected_peripheral = Some(peripheral);
        self.midi_characteristic = Some(midi_char);
        self.status = BluetoothStatus::Connected;
        self.start_time = Instant::now();

        tracing::info!("=== BLUETOOTH CONNECTION SUCCESS ===");
        tracing::info!("Successfully connected to BLE MIDI device!");
        Ok(())
    }

    /// Start receiving MIDI events (call this in a separate task)
    pub async fn start_receiving(&self) -> Result<mpsc::Receiver<MidiEvent>, String> {
        let peripheral = self
            .connected_peripheral
            .as_ref()
            .ok_or("Not connected to any device")?;

        let (tx, rx) = mpsc::channel(256);
        let event_buffer = Arc::clone(&self.event_buffer);

        let mut notification_stream = peripheral
            .notifications()
            .await
            .map_err(|e| format!("Failed to get notification stream: {}", e))?;

        // Spawn task to process incoming MIDI data
        tokio::spawn(async move {
            while let Some(data) = notification_stream.next().await {
                // Parse BLE MIDI packet
                let events = parse_ble_midi_packet(&data.value);

                for event in events {
                    // Add to buffer
                    if let Ok(mut buffer) = event_buffer.lock() {
                        buffer.push(event.clone());
                    }

                    // Also send through channel
                    let _ = tx.send(event).await;
                }
            }
        });

        Ok(rx)
    }

    /// Disconnect from current device
    pub async fn disconnect(&mut self) -> Result<(), String> {
        if let Some(peripheral) = self.connected_peripheral.take() {
            // Unsubscribe from MIDI characteristic
            if let Some(char) = &self.midi_characteristic {
                let _ = peripheral.unsubscribe(char).await;
            }

            // Disconnect
            peripheral
                .disconnect()
                .await
                .map_err(|e| format!("Failed to disconnect: {}", e))?;

            tracing::info!("Disconnected from Bluetooth MIDI device");
        }

        self.midi_characteristic = None;
        self.status = BluetoothStatus::Disconnected;

        // Clear event buffer
        if let Ok(mut buffer) = self.event_buffer.lock() {
            buffer.clear();
        }

        Ok(())
    }

    /// Check if currently connected
    pub fn is_connected(&self) -> bool {
        self.status == BluetoothStatus::Connected
    }

    /// Clear the event buffer
    pub fn clear_event_buffer(&mut self) {
        if let Ok(mut buffer) = self.event_buffer.lock() {
            buffer.clear();
        }
    }
}

impl Default for BluetoothMidiService {
    fn default() -> Self {
        Self::new()
    }
}

/// Parse BLE MIDI packet into MIDI events
/// BLE MIDI format: [header] [timestamp] [status] [data1] [data2] ...
fn parse_ble_midi_packet(data: &[u8]) -> Vec<MidiEvent> {
    let mut events = Vec::new();

    if data.len() < 3 {
        return events;
    }

    // BLE MIDI packet structure:
    // Byte 0: Header (timestamp high bits + reserved)
    // Byte 1: Timestamp low bits
    // Following bytes: MIDI messages with optional timestamps

    let mut i = 1; // Skip header byte

    while i < data.len() {
        // Check if this byte is a timestamp
        if data[i] & 0x80 != 0 {
            // Timestamp byte, skip it
            i += 1;
            if i >= data.len() {
                break;
            }
        }

        // Parse MIDI message
        let status = data[i];
        let status_type = status & 0xF0;

        match status_type {
            0x90 => {
                // Note On
                if i + 2 < data.len() {
                    let note = data[i + 1] & 0x7F;
                    let velocity = data[i + 2] & 0x7F;

                    if velocity > 0 {
                        events.push(MidiEvent::note_on(note, velocity));
                    } else {
                        // Note On with velocity 0 = Note Off
                        events.push(MidiEvent::note_off(note));
                    }
                    i += 3;
                } else {
                    break;
                }
            }
            0x80 => {
                // Note Off
                if i + 2 < data.len() {
                    let note = data[i + 1] & 0x7F;
                    events.push(MidiEvent::note_off(note));
                    i += 3;
                } else {
                    break;
                }
            }
            _ => {
                // Skip other message types for now
                i += 1;
            }
        }
    }

    events
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_ble_midi_note_on() {
        // BLE MIDI packet: header, timestamp, Note On (channel 0), note 60, velocity 100
        let packet = vec![0x80, 0x80, 0x90, 60, 100];
        let events = parse_ble_midi_packet(&packet);

        assert_eq!(events.len(), 1);
        assert!(events[0].is_note_on);
        assert_eq!(events[0].midi, 60);
        assert_eq!(events[0].velocity, 100);
    }

    #[test]
    fn test_parse_ble_midi_note_off() {
        // BLE MIDI packet: header, timestamp, Note Off (channel 0), note 60, velocity 0
        let packet = vec![0x80, 0x80, 0x80, 60, 0];
        let events = parse_ble_midi_packet(&packet);

        assert_eq!(events.len(), 1);
        assert!(!events[0].is_note_on);
        assert_eq!(events[0].midi, 60);
    }

    #[test]
    fn test_parse_ble_midi_note_on_zero_velocity() {
        // Note On with velocity 0 should be treated as Note Off
        let packet = vec![0x80, 0x80, 0x90, 64, 0];
        let events = parse_ble_midi_packet(&packet);

        assert_eq!(events.len(), 1);
        assert!(!events[0].is_note_on);
    }

    #[test]
    fn test_parse_ble_midi_empty_packet() {
        let packet = vec![0x80];
        let events = parse_ble_midi_packet(&packet);
        assert!(events.is_empty());
    }

    #[test]
    fn test_bluetooth_device_info_serialization() {
        let info = BluetoothDeviceInfo {
            id: "test-id".to_string(),
            name: "Roland Piano".to_string(),
            is_midi_device: true,
            rssi: Some(-50),
        };

        let json = serde_json::to_string(&info).unwrap();
        assert!(json.contains("Roland Piano"));
        assert!(json.contains("is_midi_device"));
    }

    #[test]
    fn test_bluetooth_status_variants() {
        assert_eq!(
            BluetoothStatus::Disconnected,
            BluetoothStatus::Disconnected
        );
        assert_ne!(BluetoothStatus::Connected, BluetoothStatus::Disconnected);
    }
}
