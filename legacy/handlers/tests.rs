/// Tests for MIDI handlers and event processing
#[cfg(test)]
mod tests {
    use roland_piano_reader::midi::{MidiEvent, MidiEventHandler};
    use std::sync::{Arc, Mutex};

    /// Mock handler for testing
    struct MockHandler {
        events: Arc<Mutex<Vec<MidiEvent>>>,
    }

    impl MockHandler {
        fn new() -> Self {
            MockHandler {
                events: Arc::new(Mutex::new(Vec::new())),
            }
        }

        fn get_events(&self) -> Vec<MidiEvent> {
            self.events.lock().unwrap().clone()
        }
    }

    impl MidiEventHandler for MockHandler {
        fn handle_event(&self, event: MidiEvent) {
            self.events.lock().unwrap().push(event);
        }
    }

    #[test]
    fn test_handler_receives_note_on() {
        let handler = MockHandler::new();
        let event = MidiEvent::NoteOn {
            note: 60,
            velocity: 100,
        };
        handler.handle_event(event.clone());

        let events = handler.get_events();
        assert_eq!(events.len(), 1);
        match &events[0] {
            MidiEvent::NoteOn { note, velocity } => {
                assert_eq!(*note, 60);
                assert_eq!(*velocity, 100);
            }
            _ => panic!("Expected NoteOn event"),
        }
    }

    #[test]
    fn test_handler_receives_multiple_events() {
        let handler = MockHandler::new();

        handler.handle_event(MidiEvent::NoteOn {
            note: 60,
            velocity: 100,
        });
        handler.handle_event(MidiEvent::NoteOn {
            note: 64,
            velocity: 80,
        });
        handler.handle_event(MidiEvent::NoteOff { note: 60 });

        let events = handler.get_events();
        assert_eq!(events.len(), 3);
    }

    #[test]
    fn test_handler_receives_control_change() {
        let handler = MockHandler::new();
        let event = MidiEvent::ControlChange {
            controller: 64, // Sustain
            value: 127,
        };
        handler.handle_event(event);

        let events = handler.get_events();
        assert_eq!(events.len(), 1);
    }

    #[test]
    fn test_handler_thread_safe() {
        use std::thread;

        let handler = Arc::new(MockHandler::new());
        let mut handles = vec![];

        // Spawn multiple threads sending events
        for i in 0..5 {
            let handler_clone = Arc::clone(&handler);
            let handle = thread::spawn(move || {
                handler_clone.handle_event(MidiEvent::NoteOn {
                    note: 60 + i,
                    velocity: 64,
                });
            });
            handles.push(handle);
        }

        // Wait for all threads to complete
        for handle in handles {
            handle.join().unwrap();
        }

        let events = handler.get_events();
        assert_eq!(events.len(), 5);
    }
}
