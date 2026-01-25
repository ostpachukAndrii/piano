use actix::{Actor, ActorContext, AsyncContext, StreamHandler};
use actix_cors::Cors;
use actix_web::{middleware, web, App, HttpRequest, HttpResponse, HttpServer};
use actix_web_actors::ws;
use piano_lessons::repository::LessonRepository;
use piano_midi::{ConnectedMidiDevice, MidiDeviceManager};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NoteEventDto {
    pub event_index: usize,
    pub event_type: String,
    pub note_numbers: Option<Vec<u8>>,
    pub note_names: Option<Vec<String>>,
    pub chord_name: Option<String>,
    pub duration_ms: u64,
    pub hand: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LessonDto {
    pub id: String,
    pub name: String,
    pub description: String,
    pub difficulty: String,
    pub tempo: u16,
    pub duration_seconds: u64,
    pub note_events: Vec<NoteEventDto>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SessionRequest {
    pub lesson_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SessionResponse {
    pub id: String,
    pub lesson_id: String,
    pub status: String,
    pub current_index: usize,
    pub total_events: usize,
    pub progress_percent: f32,
    pub started_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NoteEventRequest {
    pub session_id: String,
    pub note: u8,
    pub velocity: u8,
    pub timestamp_ms: u64,
}

// Helper function to convert MIDI number to note name
fn midi_to_note_name(midi_number: u8) -> String {
    let notes = [
        "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
    ];
    let octave = (midi_number / 12) as i32 - 1;
    let note_index = (midi_number % 12) as usize;
    format!("{}{}", notes[note_index], octave)
}

// Session state tracking
#[derive(Debug, Clone)]
pub struct SessionState {
    pub lesson_id: String,
    pub lesson: LessonDto,
    pub current_index: usize,
    pub pressed_notes: HashSet<u8>, // Currently pressed notes (for chord detection)
    pub started_at: String,
}

impl SessionState {
    fn new(lesson_id: String, lesson: LessonDto) -> Self {
        Self {
            lesson_id,
            lesson,
            current_index: 0,
            pressed_notes: HashSet::new(),
            started_at: chrono::Utc::now().to_rfc3339(),
        }
    }
}

// MIDI Device DTO for API responses
#[derive(Debug, Serialize, Clone)]
pub struct MidiDeviceDto {
    pub index: usize,
    pub name: String,
}

// MIDI connection state
pub struct MidiState {
    pub connected_device: Option<String>,
    pub connection: Option<ConnectedMidiDevice>,
}

// Application state
pub struct AppState {
    lessons: Mutex<Vec<LessonDto>>,
    sessions: Arc<Mutex<HashMap<String, SessionState>>>,
    midi: Arc<Mutex<MidiState>>,
}

// WebSocket actor for streaming MIDI events
struct MidiWebSocket {
    heartbeat: std::time::Instant,
    midi: Arc<Mutex<MidiState>>,
}

impl MidiWebSocket {
    fn new(midi: Arc<Mutex<MidiState>>) -> Self {
        Self {
            heartbeat: std::time::Instant::now(),
            midi,
        }
    }

    fn start_polling(&self, ctx: &mut ws::WebsocketContext<Self>) {
        // Poll MIDI events every 10ms
        ctx.run_interval(std::time::Duration::from_millis(10), |act, ctx| {
            // Try to receive MIDI events
            let mut midi = act.midi.lock().unwrap();
            if let Some(ref mut connection) = midi.connection {
                while let Some(event) = connection.try_recv() {
                    // Convert event to JSON and send
                    use piano_midi::MidiEvent;
                    let event_json = match event {
                        MidiEvent::NoteOn { note, velocity } => {
                            log::info!("🎹 MIDI Note On: {} velocity {}", note, velocity);
                            serde_json::json!({
                                "type": "midi_event",
                                "event_type": "note_on",
                                "note": note,
                                "velocity": velocity,
                                "timestamp": chrono::Utc::now().timestamp_millis()
                            })
                        }
                        MidiEvent::NoteOff { note } => {
                            log::info!("🎹 MIDI Note Off: {}", note);
                            serde_json::json!({
                                "type": "midi_event",
                                "event_type": "note_off",
                                "note": note,
                                "timestamp": chrono::Utc::now().timestamp_millis()
                            })
                        }
                        MidiEvent::ControlChange { controller, value } => {
                            serde_json::json!({
                                "type": "midi_event",
                                "event_type": "control_change",
                                "controller": controller,
                                "value": value,
                                "timestamp": chrono::Utc::now().timestamp_millis()
                            })
                        }
                        MidiEvent::PitchBend { value } => {
                            serde_json::json!({
                                "type": "midi_event",
                                "event_type": "pitch_bend",
                                "value": value,
                                "timestamp": chrono::Utc::now().timestamp_millis()
                            })
                        }
                        MidiEvent::Other { status, data } => {
                            serde_json::json!({
                                "type": "midi_event",
                                "event_type": "other",
                                "status": status,
                                "data": data,
                                "timestamp": chrono::Utc::now().timestamp_millis()
                            })
                        }
                    };
                    ctx.text(event_json.to_string());
                }
            }
        });
    }

    fn heartbeat(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(std::time::Duration::from_secs(5), |act, ctx| {
            if std::time::Instant::now().duration_since(act.heartbeat)
                > std::time::Duration::from_secs(30)
            {
                log::warn!("MIDI WebSocket client heartbeat timeout");
                ctx.stop();
                return;
            }
            ctx.ping(b"");
        });
    }
}

impl Actor for MidiWebSocket {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        log::info!("🎹 MIDI WebSocket connected");
        self.heartbeat(ctx);
        self.start_polling(ctx);

        // Send welcome message
        let welcome = serde_json::json!({
            "type": "connected",
            "message": "Connected to MIDI stream"
        });
        ctx.text(welcome.to_string());
    }

    fn stopped(&mut self, _ctx: &mut Self::Context) {
        log::info!("🎹 MIDI WebSocket disconnected");
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for MidiWebSocket {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(ws::Message::Ping(msg)) => {
                self.heartbeat = std::time::Instant::now();
                ctx.pong(&msg);
            }
            Ok(ws::Message::Pong(_)) => {
                self.heartbeat = std::time::Instant::now();
            }
            Ok(ws::Message::Close(reason)) => {
                log::info!("MIDI WebSocket close requested: {:?}", reason);
                ctx.stop();
            }
            _ => (),
        }
    }
}

// MIDI WebSocket route handler
async fn midi_websocket_handler(
    req: HttpRequest,
    stream: web::Payload,
    data: web::Data<AppState>,
) -> Result<HttpResponse, actix_web::Error> {
    log::info!("MIDI WebSocket connection request");
    let ws_actor = MidiWebSocket::new(data.midi.clone());
    ws::start(ws_actor, &req, stream)
}

// WebSocket actor for handling real-time session updates
struct SessionWebSocket {
    session_id: String,
    heartbeat: std::time::Instant,
    sessions: Arc<Mutex<HashMap<String, SessionState>>>,
}

impl SessionWebSocket {
    fn new(session_id: String, sessions: Arc<Mutex<HashMap<String, SessionState>>>) -> Self {
        Self {
            session_id,
            heartbeat: std::time::Instant::now(),
            sessions,
        }
    }

    fn heartbeat(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(std::time::Duration::from_secs(5), |act, ctx| {
            // Check if client has sent anything recently
            if std::time::Instant::now().duration_since(act.heartbeat)
                > std::time::Duration::from_secs(30)
            {
                log::warn!("Client heartbeat timeout, disconnecting");
                ctx.stop();
                return;
            }

            // Send ping
            ctx.ping(b"");
        });
    }

    fn handle_midi_event(
        &mut self,
        data: &serde_json::Value,
        ctx: &mut ws::WebsocketContext<Self>,
    ) {
        let event = match data.get("event") {
            Some(e) => e,
            None => {
                log::warn!("⚠️ MIDI event missing 'event' field");
                return;
            }
        };

        let event_type = event.get("event_type").and_then(|v| v.as_str());
        let midi_number = event
            .get("midi_number")
            .and_then(|v| v.as_u64())
            .map(|n| n as u8);

        log::info!(
            "🎹 MIDI event: type={:?}, note={:?}",
            event_type,
            midi_number
        );

        // Get session state
        let mut sessions = self.sessions.lock().unwrap();
        let session = match sessions.get_mut(&self.session_id) {
            Some(s) => s,
            None => {
                log::warn!("⚠️ Session not found: {}", self.session_id);
                return;
            }
        };

        // Handle note on/off
        match (event_type, midi_number) {
            (Some("note_on"), Some(note)) => {
                session.pressed_notes.insert(note);
                log::info!(
                    "👆 Note pressed: {}, currently pressed: {:?}",
                    note,
                    session.pressed_notes
                );
                self.check_notes(session, ctx);
            }
            (Some("note_off"), Some(note)) => {
                session.pressed_notes.remove(&note);
                log::info!(
                    "👇 Note released: {}, currently pressed: {:?}",
                    note,
                    session.pressed_notes
                );
            }
            _ => {
                log::warn!("⚠️ Invalid MIDI event");
            }
        }
    }

    fn check_notes(&self, session: &mut SessionState, ctx: &mut ws::WebsocketContext<Self>) {
        if session.current_index >= session.lesson.note_events.len() {
            log::info!("🏁 Lesson complete!");
            self.send_session_complete(session, ctx);
            return;
        }

        let current_event = &session.lesson.note_events[session.current_index];
        log::info!("🎯 Expected event: {:?}", current_event);

        // Get expected notes
        let expected_notes: HashSet<u8> = current_event
            .note_numbers
            .as_ref()
            .map(|notes| notes.iter().copied().collect())
            .unwrap_or_default();

        log::info!("   Expected notes: {:?}", expected_notes);
        log::info!("   Pressed notes: {:?}", session.pressed_notes);

        // Check if pressed notes match expected notes
        let is_correct = !expected_notes.is_empty() && expected_notes == session.pressed_notes;

        if is_correct {
            log::info!("✅ CORRECT! Advancing to next event");

            // Send feedback
            self.send_feedback(true, &session.pressed_notes, ctx);

            // Advance to next event
            session.current_index += 1;

            // Send progress update
            self.send_progress_update(session, ctx);
        } else if !session.pressed_notes.is_empty() {
            log::info!("❌ INCORRECT notes");
            self.send_feedback(false, &session.pressed_notes, ctx);
        }
    }

    fn send_progress_update(&self, session: &SessionState, ctx: &mut ws::WebsocketContext<Self>) {
        let next_event = if session.current_index < session.lesson.note_events.len() {
            Some(&session.lesson.note_events[session.current_index])
        } else {
            None
        };

        let progress = serde_json::json!({
            "type": "progress_update",
            "current_index": session.current_index,
            "total_events": session.lesson.note_events.len(),
            "progress_percent": (session.current_index as f32 / session.lesson.note_events.len() as f32 * 100.0),
            "current_expected_event": next_event,
            "next_event": if session.current_index + 1 < session.lesson.note_events.len() {
                Some(&session.lesson.note_events[session.current_index + 1])
            } else {
                None
            }
        });

        log::info!(
            "📊 Sending progress update: current_index={}, progress={}%",
            session.current_index,
            (session.current_index as f32 / session.lesson.note_events.len() as f32 * 100.0)
        );
        ctx.text(progress.to_string());
    }

    fn send_feedback(
        &self,
        is_correct: bool,
        played_notes: &HashSet<u8>,
        ctx: &mut ws::WebsocketContext<Self>,
    ) {
        let message = if is_correct {
            "Perfect! ✨"
        } else {
            "Try again"
        };

        let feedback = serde_json::json!({
            "type": "feedback",
            "is_correct": is_correct,
            "message": message,
            "should_advance": is_correct,
            "played_notes": played_notes.iter().copied().collect::<Vec<u8>>()
        });

        log::info!("💬 Sending feedback: {}", message);
        ctx.text(feedback.to_string());
    }

    fn send_session_complete(&self, session: &SessionState, ctx: &mut ws::WebsocketContext<Self>) {
        let complete = serde_json::json!({
            "type": "session_complete",
            "session_id": self.session_id,
            "statistics": {
                "session_id": self.session_id,
                "lesson_name": session.lesson.name,
                "total_events": session.lesson.note_events.len(),
                "events_correct": session.current_index,
                "overall_accuracy_percent": 100.0,
                "started_at": session.started_at,
                "completed_at": chrono::Utc::now().to_rfc3339()
            }
        });

        log::info!("🎉 Sending session complete!");
        ctx.text(complete.to_string());
    }
}

impl Actor for SessionWebSocket {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        log::info!(
            "WebSocket connection opened for session: {}",
            self.session_id
        );

        // Start heartbeat
        self.heartbeat(ctx);

        // Send welcome message with session info
        let welcome = serde_json::json!({
            "type": "connected",
            "session_id": self.session_id,
            "message": "Connected to lesson session"
        });
        ctx.text(welcome.to_string());
    }

    fn stopped(&mut self, _ctx: &mut Self::Context) {
        log::info!(
            "WebSocket connection closed for session: {}",
            self.session_id
        );
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for SessionWebSocket {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(ws::Message::Ping(msg)) => {
                self.heartbeat = std::time::Instant::now();
                ctx.pong(&msg);
            }
            Ok(ws::Message::Pong(_)) => {
                self.heartbeat = std::time::Instant::now();
            }
            Ok(ws::Message::Text(text)) => {
                self.heartbeat = std::time::Instant::now();
                log::info!("📨 WebSocket received message: {}", text);

                // Parse and handle MIDI events
                if let Ok(data) = serde_json::from_str::<serde_json::Value>(&text) {
                    log::info!("✅ Parsed JSON: {:?}", data);
                    if let Some(msg_type) = data.get("type").and_then(|t| t.as_str()) {
                        log::info!("📋 Message type: {}", msg_type);
                        match msg_type {
                            "midi_event" => {
                                self.handle_midi_event(&data, ctx);
                            }
                            _ => {
                                log::warn!("❌ Unknown message type: {}", msg_type);
                            }
                        }
                    } else {
                        log::warn!("⚠️ Message has no 'type' field");
                    }
                } else {
                    log::error!("❌ Failed to parse JSON: {}", text);
                }
            }
            Ok(ws::Message::Binary(bin)) => {
                self.heartbeat = std::time::Instant::now();
                ctx.binary(bin);
            }
            Ok(ws::Message::Close(reason)) => {
                log::info!("WebSocket close requested: {:?}", reason);
                ctx.stop();
            }
            _ => (),
        }
    }
}

// WebSocket route handler
async fn websocket_handler(
    req: HttpRequest,
    stream: web::Payload,
    session_id: web::Path<String>,
    data: web::Data<AppState>,
) -> Result<HttpResponse, actix_web::Error> {
    let session_id = session_id.into_inner();
    log::info!("WebSocket connection request for session: {}", session_id);

    let ws_actor = SessionWebSocket::new(session_id.clone(), data.sessions.clone());

    ws::start(ws_actor, &req, stream)
}

// GET /api/v1/midi/devices - List available MIDI devices
async fn get_midi_devices() -> HttpResponse {
    match MidiDeviceManager::new() {
        Ok(manager) => match manager.list_devices() {
            Ok(devices) => {
                let device_dtos: Vec<MidiDeviceDto> = devices
                    .iter()
                    .enumerate()
                    .map(|(idx, device)| MidiDeviceDto {
                        index: idx,
                        name: device.name.clone(),
                    })
                    .collect();
                log::info!("🎹 Found {} MIDI devices", device_dtos.len());
                HttpResponse::Ok().json(device_dtos)
            }
            Err(e) => {
                log::error!("Failed to list MIDI devices: {:?}", e);
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": format!("Failed to list MIDI devices: {:?}", e)
                }))
            }
        },
        Err(e) => {
            log::error!("Failed to create MIDI manager: {:?}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("Failed to create MIDI manager: {:?}", e)
            }))
        }
    }
}

// POST /api/v1/midi/connect - Connect to a MIDI device
#[derive(Debug, Deserialize)]
struct MidiConnectRequest {
    device_index: usize,
}

async fn connect_midi_device(
    req: web::Json<MidiConnectRequest>,
    data: web::Data<AppState>,
) -> HttpResponse {
    log::info!("🎹 Connecting to MIDI device at index {}", req.device_index);

    match MidiDeviceManager::new() {
        Ok(manager) => {
            // First list devices to get the name
            let device_name = match manager.list_devices() {
                Ok(devices) => {
                    if req.device_index >= devices.len() {
                        return HttpResponse::BadRequest().json(serde_json::json!({
                            "error": format!("Invalid device index: {}. Only {} devices available.",
                                           req.device_index, devices.len())
                        }));
                    }
                    devices[req.device_index].name.clone()
                }
                Err(e) => {
                    return HttpResponse::InternalServerError().json(serde_json::json!({
                        "error": format!("Failed to list MIDI devices: {:?}", e)
                    }));
                }
            };

            // Need a new manager to connect (the previous was consumed by list_devices borrow)
            let manager = match MidiDeviceManager::new() {
                Ok(m) => m,
                Err(e) => {
                    return HttpResponse::InternalServerError().json(serde_json::json!({
                        "error": format!("Failed to create MIDI manager: {:?}", e)
                    }));
                }
            };

            match manager.connect(req.device_index) {
                Ok(connected) => {
                    // Store the connected device
                    {
                        let mut midi = data.midi.lock().unwrap();
                        midi.connected_device = Some(device_name.clone());
                        midi.connection = Some(connected);
                    }

                    log::info!("✅ Connected to MIDI device: {}", device_name);
                    HttpResponse::Ok().json(serde_json::json!({
                        "status": "connected",
                        "device_name": device_name
                    }))
                }
                Err(e) => {
                    log::error!("Failed to connect to MIDI device: {:?}", e);
                    HttpResponse::InternalServerError().json(serde_json::json!({
                        "error": format!("Failed to connect: {:?}", e)
                    }))
                }
            }
        }
        Err(e) => {
            log::error!("Failed to create MIDI manager: {:?}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("Failed to create MIDI manager: {:?}", e)
            }))
        }
    }
}

// POST /api/v1/midi/disconnect - Disconnect from MIDI device
async fn disconnect_midi_device(data: web::Data<AppState>) -> HttpResponse {
    let mut midi = data.midi.lock().unwrap();

    if midi.connected_device.is_some() {
        let device_name = midi.connected_device.take();
        midi.connection = None;

        log::info!("🔌 Disconnected from MIDI device: {:?}", device_name);
        HttpResponse::Ok().json(serde_json::json!({
            "status": "disconnected",
            "device_name": device_name
        }))
    } else {
        HttpResponse::Ok().json(serde_json::json!({
            "status": "not_connected"
        }))
    }
}

// GET /api/v1/midi/status - Get MIDI connection status
async fn get_midi_status(data: web::Data<AppState>) -> HttpResponse {
    let midi = data.midi.lock().unwrap();

    HttpResponse::Ok().json(serde_json::json!({
        "connected": midi.connected_device.is_some(),
        "device_name": midi.connected_device
    }))
}

// GET /api/v1/lessons
async fn get_lessons(data: web::Data<AppState>) -> HttpResponse {
    let lessons = data.lessons.lock().unwrap();
    HttpResponse::Ok().json(lessons.clone())
}

// POST /api/v1/sessions
async fn create_session(req: web::Json<SessionRequest>, data: web::Data<AppState>) -> HttpResponse {
    let lesson = {
        let lessons = data.lessons.lock().unwrap();

        // Find the lesson and clone it
        match lessons.iter().find(|l| l.id == req.lesson_id) {
            Some(l) => l.clone(),
            None => {
                return HttpResponse::NotFound().json(serde_json::json!({
                    "error": "Lesson not found"
                }));
            }
        }
    };

    let session_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    // Create and store session state
    let session_state = SessionState::new(req.lesson_id.clone(), lesson.clone());
    {
        let mut sessions = data.sessions.lock().unwrap();
        sessions.insert(session_id.clone(), session_state);
    }

    log::info!(
        "✨ Created session {} for lesson {}",
        session_id,
        lesson.name
    );

    HttpResponse::Created().json(SessionResponse {
        id: session_id,
        lesson_id: req.lesson_id.clone(),
        status: "playing".to_string(),
        current_index: 0,
        total_events: lesson.note_events.len(),
        progress_percent: 0.0,
        started_at: now.clone(),
        updated_at: now,
    })
}

// GET /api/v1/lessons/{id}
async fn get_lesson(lesson_id: web::Path<String>, data: web::Data<AppState>) -> HttpResponse {
    let lessons = data.lessons.lock().unwrap();
    let id = lesson_id.into_inner();

    match lessons.iter().find(|l| l.id == id) {
        Some(lesson) => HttpResponse::Ok().json(lesson.clone()),
        None => HttpResponse::NotFound().finish(),
    }
}

// POST /api/v1/sessions/{id}/events
async fn post_note_event(
    session_id: web::Path<String>,
    _req: web::Json<NoteEventRequest>,
) -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "recorded",
        "session_id": session_id.into_inner(),
    }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    // Load lessons from repository
    let repo = LessonRepository::new("./lessons");
    let lesson_names = repo.list_available().unwrap_or_else(|_| Vec::new());

    let lessons: Vec<LessonDto> = lesson_names
        .iter()
        .filter_map(|name| {
            // Load the YAML config to get metadata
            let config_path = format!("./lessons/{}.yaml", name);
            let yaml_content = std::fs::read_to_string(&config_path).ok()?;
            let config: piano_lessons::LessonConfig = serde_yaml::from_str(&yaml_content).ok()?;

            // Load the lesson to get note events
            let lesson = repo.load_by_name(name).ok()?;
            let note_events_domain = lesson.note_events();

            // Convert NoteEvents to DTOs
            let note_events: Vec<NoteEventDto> = note_events_domain
                .iter()
                .enumerate()
                .map(|(idx, event)| {
                    use piano_domain::NoteEvent;
                    match event {
                        NoteEvent::Single { note, duration_ms } => NoteEventDto {
                            event_index: idx,
                            event_type: "note".to_string(),
                            note_numbers: Some(vec![note.midi_number]),
                            note_names: Some(vec![midi_to_note_name(note.midi_number)]),
                            chord_name: None,
                            duration_ms: duration_ms.unwrap_or(500),
                            hand: None,
                        },
                        NoteEvent::Chord {
                            notes,
                            name,
                            hand,
                            duration_ms,
                        } => NoteEventDto {
                            event_index: idx,
                            event_type: "chord".to_string(),
                            note_numbers: Some(notes.iter().map(|n| n.midi_number).collect()),
                            note_names: Some(
                                notes
                                    .iter()
                                    .map(|n| midi_to_note_name(n.midi_number))
                                    .collect(),
                            ),
                            chord_name: name.clone(),
                            duration_ms: duration_ms.unwrap_or(500),
                            hand: hand.as_ref().map(|h| match h {
                                piano_domain::Hand::Left => "left".to_string(),
                                piano_domain::Hand::Right => "right".to_string(),
                                piano_domain::Hand::Both => "both".to_string(),
                            }),
                        },
                    }
                })
                .collect();

            // Calculate total duration in seconds
            let total_duration_ms: u64 = note_events.iter().map(|e| e.duration_ms).sum();
            let duration_seconds = total_duration_ms / 1000;
            let tempo = config.tempo.unwrap_or(120);

            Some(LessonDto {
                id: lesson.name().to_string(),
                name: lesson.name().to_string(),
                description: lesson.description().to_string(),
                difficulty: config.difficulty.unwrap_or_else(|| "beginner".to_string()),
                tempo,
                duration_seconds,
                note_events,
            })
        })
        .collect();

    let app_state = web::Data::new(AppState {
        lessons: Mutex::new(lessons),
        sessions: Arc::new(Mutex::new(HashMap::new())),
        midi: Arc::new(Mutex::new(MidiState {
            connected_device: None,
            connection: None,
        })),
    });

    log::info!("Starting Piano API Server on http://localhost:8080");

    HttpServer::new(move || {
        let cors = Cors::permissive();

        App::new()
            .app_data(app_state.clone())
            .wrap(middleware::Logger::default())
            .wrap(cors)
            .service(
                web::scope("/api/v1")
                    .route("/lessons", web::get().to(get_lessons))
                    .route("/lessons/{id}", web::get().to(get_lesson))
                    .route("/sessions", web::post().to(create_session))
                    .route("/sessions/{id}/events", web::post().to(post_note_event))
                    // MIDI device endpoints
                    .route("/midi/devices", web::get().to(get_midi_devices))
                    .route("/midi/connect", web::post().to(connect_midi_device))
                    .route("/midi/disconnect", web::post().to(disconnect_midi_device))
                    .route("/midi/status", web::get().to(get_midi_status)),
            )
            .route(
                "/ws/sessions/{session_id}",
                web::get().to(websocket_handler),
            )
            .route("/ws/midi", web::get().to(midi_websocket_handler))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
