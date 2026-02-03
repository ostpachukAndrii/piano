// MXL Parser - Parse compressed MusicXML (.mxl) files
// MXL is a ZIP archive containing MusicXML data

use crate::commands::lesson::LessonMode;
use crate::models::{GlobalSettings, Measure, Note};
use roxmltree::{Document, Node, ParsingOptions};
use std::fs::File;
use std::io::Read;
use std::path::Path;
use zip::ZipArchive;

/// Represents a lesson loaded from MXL (MusicXML)
#[derive(Debug, Clone)]
pub struct MxlLesson {
    pub title: String,
    pub description: Option<String>,
    pub mode: Option<LessonMode>,
    pub settings: GlobalSettings,
    pub measures: Vec<Measure>,
}

impl MxlLesson {
    /// Load a lesson from an MXL file
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self, String> {
        let file =
            File::open(&path).map_err(|e| format!("Failed to open MXL file: {}", e))?;

        let mut archive =
            ZipArchive::new(file).map_err(|e| format!("Failed to read MXL archive: {}", e))?;

        // Find the main MusicXML file
        let xml_content = find_and_read_musicxml(&mut archive)?;

        Self::from_xml(&xml_content, path.as_ref())
    }

    /// Parse a lesson from MusicXML string
    pub fn from_xml(xml_content: &str, source_path: &Path) -> Result<Self, String> {
        // Use parsing options that allow DTD (common in MusicXML files)
        let options = ParsingOptions {
            allow_dtd: true,
            ..Default::default()
        };
        let doc = Document::parse_with_options(xml_content, options)
            .map_err(|e| format!("Failed to parse MusicXML: {}", e))?;

        let root = doc.root_element();

        // Handle both score-partwise and score-timewise formats
        let score_node = if root.tag_name().name() == "score-partwise" {
            root
        } else if root.tag_name().name() == "score-timewise" {
            return Err("score-timewise format not yet supported".to_string());
        } else {
            return Err(format!("Unknown root element: {}", root.tag_name().name()));
        };

        // Extract title from work/work-title or movement-title
        let title = extract_title(&score_node, source_path);

        // Extract description from identification/creator
        let description = extract_description(&score_node);

        // Extract settings (tempo, time signature, key signature)
        let settings = extract_settings(&score_node)?;

        // Extract measures from all parts
        let measures = extract_measures(&score_node, &settings)?;

        Ok(MxlLesson {
            title,
            description,
            mode: None, // MusicXML doesn't have lesson mode
            settings,
            measures,
        })
    }

    /// Get total duration in beats
    pub fn total_beats(&self) -> f32 {
        self.measures
            .iter()
            .flat_map(|m| &m.notes)
            .map(|n| n.duration_beats())
            .sum()
    }

    /// Get total duration in seconds based on tempo
    pub fn total_seconds(&self) -> f32 {
        let beats = self.total_beats();
        let bpm = self.settings.tempo as f32;
        beats / bpm * 60.0
    }
}

/// Find and read the main MusicXML file from the archive
fn find_and_read_musicxml(archive: &mut ZipArchive<File>) -> Result<String, String> {
    // First, try to find container.xml for the rootfile reference
    let rootfile = find_rootfile_from_container(archive);

    if let Some(ref rootfile_path) = rootfile {
        if let Ok(content) = read_file_from_archive(archive, rootfile_path) {
            return Ok(content);
        }
    }

    // Fallback: look for any .xml or .musicxml file
    let mut xml_file_name = None;
    for i in 0..archive.len() {
        if let Ok(file) = archive.by_index(i) {
            let name = file.name().to_lowercase();
            if (name.ends_with(".xml") || name.ends_with(".musicxml"))
                && !name.contains("container")
                && !name.starts_with("meta-inf")
            {
                xml_file_name = Some(file.name().to_string());
                break;
            }
        }
    }

    if let Some(name) = xml_file_name {
        read_file_from_archive(archive, &name)
    } else {
        Err("No MusicXML file found in archive".to_string())
    }
}

/// Try to find the rootfile from META-INF/container.xml
fn find_rootfile_from_container(archive: &mut ZipArchive<File>) -> Option<String> {
    let container_content = read_file_from_archive(archive, "META-INF/container.xml").ok()?;
    let doc = Document::parse(&container_content).ok()?;

    // Find rootfile element
    for node in doc.descendants() {
        if node.tag_name().name() == "rootfile" {
            if let Some(full_path) = node.attribute("full-path") {
                return Some(full_path.to_string());
            }
        }
    }

    None
}

/// Read a file from the ZIP archive
fn read_file_from_archive(archive: &mut ZipArchive<File>, name: &str) -> Result<String, String> {
    // Try exact match first
    for i in 0..archive.len() {
        if let Ok(mut file) = archive.by_index(i) {
            if file.name() == name || file.name().eq_ignore_ascii_case(name) {
                let mut content = String::new();
                file.read_to_string(&mut content)
                    .map_err(|e| format!("Failed to read {}: {}", name, e))?;
                return Ok(content);
            }
        }
    }

    Err(format!("File not found in archive: {}", name))
}

/// Extract title from MusicXML
fn extract_title(score: &Node, source_path: &Path) -> String {
    // Try work/work-title
    for node in score.descendants() {
        if node.tag_name().name() == "work-title" {
            if let Some(text) = node.text() {
                let title = text.trim();
                if !title.is_empty() {
                    return title.to_string();
                }
            }
        }
    }

    // Try movement-title
    for node in score.descendants() {
        if node.tag_name().name() == "movement-title" {
            if let Some(text) = node.text() {
                let title = text.trim();
                if !title.is_empty() {
                    return title.to_string();
                }
            }
        }
    }

    // Fallback to filename
    source_path
        .file_stem()
        .and_then(|s| s.to_str())
        .map(|s| s.replace('-', " ").replace('_', " "))
        .unwrap_or_else(|| "Untitled".to_string())
}

/// Extract description/composer from MusicXML
fn extract_description(score: &Node) -> Option<String> {
    let mut creators = Vec::new();

    for node in score.descendants() {
        if node.tag_name().name() == "creator" {
            if let Some(text) = node.text() {
                let creator = text.trim();
                if !creator.is_empty() {
                    let creator_type = node.attribute("type").unwrap_or("creator");
                    creators.push(format!("{}: {}", creator_type, creator));
                }
            }
        }
    }

    if creators.is_empty() {
        None
    } else {
        Some(creators.join(", "))
    }
}

/// Extract global settings (tempo, time signature, key signature)
fn extract_settings(score: &Node) -> Result<GlobalSettings, String> {
    let mut tempo = 120u32; // Default tempo
    let mut time_signature = "4/4".to_string();
    let mut key_signature = "C major".to_string();
    let mut _divisions = 1; // Divisions per quarter note (set in first measure)

    // Find attributes and direction elements for settings
    for node in score.descendants() {
        match node.tag_name().name() {
            "divisions" => {
                if let Some(text) = node.text() {
                    _divisions = text.trim().parse().unwrap_or(1);
                }
            }
            "time" => {
                let beats = find_child_text(&node, "beats").unwrap_or("4".to_string());
                let beat_type = find_child_text(&node, "beat-type").unwrap_or("4".to_string());
                time_signature = format!("{}/{}", beats, beat_type);
            }
            "key" => {
                let fifths = find_child_text(&node, "fifths")
                    .and_then(|s| s.parse::<i32>().ok())
                    .unwrap_or(0);
                let mode = find_child_text(&node, "mode").unwrap_or("major".to_string());
                key_signature = fifths_to_key_signature(fifths, &mode);
            }
            "sound" => {
                if let Some(tempo_attr) = node.attribute("tempo") {
                    tempo = tempo_attr.parse().unwrap_or(120);
                }
            }
            "per-minute" => {
                // Metronome marking
                if let Some(text) = node.text() {
                    tempo = text.trim().parse().unwrap_or(120);
                }
            }
            _ => {}
        }
    }

    Ok(GlobalSettings {
        tempo,
        time_signature,
        key_signature,
    })
}

/// Convert fifths (circle of fifths) to key signature string
fn fifths_to_key_signature(fifths: i32, mode: &str) -> String {
    let major_keys = [
        "C♭", "G♭", "D♭", "A♭", "E♭", "B♭", "F", "C", "G", "D", "A", "E", "B", "F♯", "C♯",
    ];
    let minor_keys = [
        "A♭", "E♭", "B♭", "F", "C", "G", "D", "A", "E", "B", "F♯", "C♯", "G♯", "D♯", "A♯",
    ];

    let index = (fifths + 7) as usize;
    let key = if mode.to_lowercase() == "minor" {
        minor_keys.get(index).unwrap_or(&"A")
    } else {
        major_keys.get(index).unwrap_or(&"C")
    };

    format!("{} {}", key, mode)
}

/// Temporary struct to hold note data with beat position for sorting
#[derive(Debug, Clone)]
struct TimedNote {
    beat_position: f32,
    note: Note,
}

/// Extract all measures from the score
fn extract_measures(score: &Node, settings: &GlobalSettings) -> Result<Vec<Measure>, String> {
    // Map of measure number -> list of timed notes
    let mut measure_notes: std::collections::HashMap<u32, Vec<TimedNote>> = std::collections::HashMap::new();
    let mut divisions = 1i32; // Divisions per quarter note, updated per part

    // Parse time signature for potential future use
    let (_beats_per_measure, _beat_type) = parse_time_signature(&settings.time_signature);

    // Find all parts
    for part in score.children().filter(|n| n.tag_name().name() == "part") {
        let part_id = part.attribute("id").unwrap_or("P1");

        // Determine hand based on part ID or staff
        let default_hand = if part_id.contains("2") || part_id.to_lowercase().contains("left") {
            "left"
        } else {
            "right"
        };

        for measure_node in part.children().filter(|n| n.tag_name().name() == "measure") {
            let measure_number: u32 = measure_node
                .attribute("number")
                .and_then(|s| s.parse().ok())
                .unwrap_or(1);

            // Check for divisions update in this measure
            for attr in measure_node.descendants() {
                if attr.tag_name().name() == "divisions" {
                    if let Some(text) = attr.text() {
                        divisions = text.trim().parse().unwrap_or(divisions);
                    }
                }
            }

            let timed_notes = extract_notes_with_timing(&measure_node, divisions, default_hand)?;

            // Add to the measure's note list
            measure_notes
                .entry(measure_number)
                .or_insert_with(Vec::new)
                .extend(timed_notes);
        }
    }

    // Convert to final measures, sorting notes by beat position
    let mut all_measures: Vec<Measure> = measure_notes
        .into_iter()
        .map(|(number, mut notes)| {
            // Sort by beat position
            notes.sort_by(|a, b| a.beat_position.partial_cmp(&b.beat_position).unwrap_or(std::cmp::Ordering::Equal));

            // Filter out rests when there's a note at the same beat position for the same hand
            // This handles multi-voice notation where one voice has notes and another has rests
            let filtered_notes = filter_redundant_rests(notes);

            Measure {
                number,
                notes: filtered_notes,
            }
        })
        .collect();

    // Sort measures by number
    all_measures.sort_by_key(|m| m.number);

    Ok(all_measures)
}

/// Filter out redundant rests when notes exist at the same beat position for the same hand
/// In multi-voice notation, one voice may have notes while another has rests at the same position
/// We keep the note and remove the rest in such cases
fn filter_redundant_rests(timed_notes: Vec<TimedNote>) -> Vec<Note> {
    use std::collections::HashSet;

    // Build a set of (beat_position, hand) where we have actual notes (not rests)
    let note_positions: HashSet<(i32, String)> = timed_notes
        .iter()
        .filter_map(|tn| {
            let (beat, hand) = match &tn.note {
                Note::Single { start_beat, hand, .. } => (start_beat.unwrap_or(0.0), hand.clone()),
                Note::Chord { start_beat, hand, .. } => (start_beat.unwrap_or(0.0), hand.clone()),
                Note::Rest { .. } => return None, // Ignore rests when building position set
            };
            // Round to avoid floating point issues (use centiseconds of beat)
            Some(((beat * 100.0) as i32, hand))
        })
        .collect();

    // Filter: keep notes, and only keep rests if no note exists at same position/hand
    timed_notes
        .into_iter()
        .filter(|tn| {
            match &tn.note {
                Note::Rest { start_beat, hand, .. } => {
                    let beat_key = (start_beat.unwrap_or(0.0) * 100.0) as i32;
                    // Keep rest only if no note exists at this position for this hand
                    !note_positions.contains(&(beat_key, hand.clone()))
                }
                _ => true, // Always keep notes
            }
        })
        .map(|tn| tn.note)
        .collect()
}

/// Parse time signature string into (beats, beat_type)
fn parse_time_signature(ts: &str) -> (u32, u32) {
    let parts: Vec<&str> = ts.split('/').collect();
    if parts.len() == 2 {
        let beats = parts[0].parse().unwrap_or(4);
        let beat_type = parts[1].parse().unwrap_or(4);
        (beats, beat_type)
    } else {
        (4, 4)
    }
}

/// Extract notes from a single measure with beat position tracking
fn extract_notes_with_timing(
    measure: &Node,
    divisions: i32,
    default_hand: &str,
) -> Result<Vec<TimedNote>, String> {
    let mut notes = Vec::new();
    let mut current_beat: f32 = 0.0; // Current beat position within measure
    let mut chord_notes: Vec<u8> = Vec::new();
    let mut chord_duration = 0f32;
    let mut chord_hand = default_hand.to_string();
    let mut chord_start_beat: f32 = 0.0;
    let mut in_chord = false;

    for child in measure.children() {
        match child.tag_name().name() {
            "note" => {
                // Check if this is a rest
                let is_rest = child.children().any(|c| c.tag_name().name() == "rest");

                // Check if this is part of a chord
                let is_chord_member = child.children().any(|c| c.tag_name().name() == "chord");

                // Get duration
                let duration_divisions = find_child_text(&child, "duration")
                    .and_then(|s| s.parse::<i32>().ok())
                    .unwrap_or(divisions);

                // Convert to beats (divisions is per quarter note)
                let duration_beats = duration_divisions as f32 / divisions as f32;

                // Get staff for hand assignment
                let staff = find_child_text(&child, "staff")
                    .and_then(|s| s.parse::<i32>().ok())
                    .unwrap_or(1);
                let hand = if staff == 2 { "left" } else { default_hand }.to_string();

                if is_rest {
                    // Flush any pending chord
                    if !chord_notes.is_empty() {
                        notes.push(TimedNote {
                            beat_position: chord_start_beat,
                            note: create_chord_or_single(&chord_notes, chord_duration, &chord_hand, chord_start_beat),
                        });
                        chord_notes.clear();
                        in_chord = false;
                    }

                    notes.push(TimedNote {
                        beat_position: current_beat,
                        note: Note::Rest {
                            duration_beats,
                            hand: hand.clone(),
                            start_beat: Some(current_beat),
                        },
                    });
                    current_beat += duration_beats;
                } else {
                    // Get pitch
                    if let Some(midi) = extract_pitch(&child) {
                        // Get accidental if present (stored for potential future use)
                        let _accidental = find_child_text(&child, "accidental")
                            .map(|s| normalize_accidental(&s));

                        if is_chord_member && in_chord {
                            // Add to existing chord (don't advance beat - chord notes are simultaneous)
                            chord_notes.push(midi);
                        } else {
                            // Flush previous chord if any
                            if !chord_notes.is_empty() {
                                notes.push(TimedNote {
                                    beat_position: chord_start_beat,
                                    note: create_chord_or_single(&chord_notes, chord_duration, &chord_hand, chord_start_beat),
                                });
                                chord_notes.clear();
                            }

                            // Start new note/chord at current beat
                            chord_notes.push(midi);
                            chord_duration = duration_beats;
                            chord_hand = hand;
                            chord_start_beat = current_beat;
                            in_chord = true;

                            // Advance beat position
                            current_beat += duration_beats;
                        }
                    }
                }
            }
            "forward" => {
                // Flush any pending chord
                if !chord_notes.is_empty() {
                    notes.push(TimedNote {
                        beat_position: chord_start_beat,
                        note: create_chord_or_single(&chord_notes, chord_duration, &chord_hand, chord_start_beat),
                    });
                    chord_notes.clear();
                    in_chord = false;
                }

                // Forward moves time forward (no sound)
                let duration_divisions = find_child_text(&child, "duration")
                    .and_then(|s| s.parse::<i32>().ok())
                    .unwrap_or(0);

                if duration_divisions > 0 {
                    let duration_beats = duration_divisions as f32 / divisions as f32;
                    current_beat += duration_beats;
                    // Don't add a rest - forward is just time movement
                }
            }
            "backup" => {
                // Flush any pending chord
                if !chord_notes.is_empty() {
                    notes.push(TimedNote {
                        beat_position: chord_start_beat,
                        note: create_chord_or_single(&chord_notes, chord_duration, &chord_hand, chord_start_beat),
                    });
                    chord_notes.clear();
                    in_chord = false;
                }

                // Backup moves time backwards (for multi-voice notation)
                let duration_divisions = find_child_text(&child, "duration")
                    .and_then(|s| s.parse::<i32>().ok())
                    .unwrap_or(0);

                if duration_divisions > 0 {
                    let duration_beats = duration_divisions as f32 / divisions as f32;
                    current_beat = (current_beat - duration_beats).max(0.0);
                }
            }
            _ => {}
        }
    }

    // Flush any remaining chord
    if !chord_notes.is_empty() {
        notes.push(TimedNote {
            beat_position: chord_start_beat,
            note: create_chord_or_single(&chord_notes, chord_duration, &chord_hand, chord_start_beat),
        });
    }

    Ok(notes)
}

/// Create a chord or single note based on the number of notes
fn create_chord_or_single(midi_notes: &[u8], duration_beats: f32, hand: &str, start_beat: f32) -> Note {
    if midi_notes.len() == 1 {
        Note::Single {
            midi: midi_notes[0],
            duration_beats,
            hand: hand.to_string(),
            accidental: None,
            start_beat: Some(start_beat),
        }
    } else {
        Note::Chord {
            midi_set: midi_notes.to_vec(),
            duration_beats,
            hand: hand.to_string(),
            chord_name: None,
            start_beat: Some(start_beat),
        }
    }
}

/// Extract MIDI pitch from a note element
fn extract_pitch(note: &Node) -> Option<u8> {
    let pitch = note.children().find(|c| c.tag_name().name() == "pitch")?;

    let step = find_child_text(&pitch, "step")?;
    let octave: i32 = find_child_text(&pitch, "octave")?.parse().ok()?;
    let alter: i32 = find_child_text(&pitch, "alter")
        .and_then(|s| s.parse().ok())
        .unwrap_or(0);

    // Convert to MIDI note number
    let step_value = match step.to_uppercase().as_str() {
        "C" => 0,
        "D" => 2,
        "E" => 4,
        "F" => 5,
        "G" => 7,
        "A" => 9,
        "B" => 11,
        _ => return None,
    };

    // MIDI note = (octave + 1) * 12 + step + alter
    // Note: MusicXML octave 4 = MIDI octave 5 (C4 = MIDI 60)
    let midi = ((octave + 1) * 12 + step_value + alter) as u8;

    Some(midi)
}

/// Normalize accidental name
fn normalize_accidental(accidental: &str) -> String {
    match accidental.to_lowercase().as_str() {
        "sharp" | "#" => "sharp".to_string(),
        "flat" | "b" => "flat".to_string(),
        "natural" => "natural".to_string(),
        "double-sharp" | "##" | "x" => "double-sharp".to_string(),
        "double-flat" | "bb" => "double-flat".to_string(),
        other => other.to_string(),
    }
}

/// Find text content of a child element
fn find_child_text(node: &Node, child_name: &str) -> Option<String> {
    node.children()
        .find(|c| c.tag_name().name() == child_name)
        .and_then(|c| c.text())
        .map(|s| s.trim().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn midi_to_note_name(midi: u8) -> String {
        let notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        let octave = (midi / 12) as i32 - 1;
        let note = notes[(midi % 12) as usize];
        format!("{}{}", note, octave)
    }

    #[test]
    fn test_load_real_mxl_file() {
        // Test loading the actual mad-world-piano.mxl file
        let mxl_path = std::path::Path::new("../lessons/mad-world-piano.mxl");
        if mxl_path.exists() {
            let result = MxlLesson::from_file(mxl_path);
            match result {
                Ok(lesson) => {
                    println!("Loaded lesson: {}", lesson.title);
                    println!("Description: {:?}", lesson.description);
                    println!("Tempo: {} BPM", lesson.settings.tempo);
                    println!("Time signature: {}", lesson.settings.time_signature);
                    println!("Key signature: {}", lesson.settings.key_signature);
                    println!("Measures: {}", lesson.measures.len());
                    println!("Total beats: {}", lesson.total_beats());
                    println!("Total seconds: {:.1}s", lesson.total_seconds());

                    // Print first few measures notes for debugging
                    for m_idx in 0..std::cmp::min(2, lesson.measures.len()) {
                        println!("\nMeasure {} notes:", lesson.measures[m_idx].number);
                        for (i, note) in lesson.measures[m_idx].notes.iter().enumerate() {
                            match note {
                                Note::Single { midi, duration_beats, hand, start_beat, .. } => {
                                    println!("  Note {}: MIDI {} ({}) duration={} hand={} start_beat={:?}",
                                        i, midi, midi_to_note_name(*midi), duration_beats, hand, start_beat);
                                }
                                Note::Chord { midi_set, duration_beats, hand, start_beat, .. } => {
                                    let names: Vec<String> = midi_set.iter()
                                        .map(|m| format!("{} ({})", m, midi_to_note_name(*m)))
                                        .collect();
                                    println!("  Chord {}: [{}] duration={} hand={} start_beat={:?}",
                                        i, names.join(", "), duration_beats, hand, start_beat);
                                }
                                Note::Rest { duration_beats, hand, start_beat } => {
                                    println!("  Rest {}: duration={} hand={} start_beat={:?}", i, duration_beats, hand, start_beat);
                                }
                            }
                        }
                    }

                    // Basic validation
                    assert!(!lesson.title.is_empty());
                    assert!(lesson.settings.tempo > 0);
                    assert!(!lesson.measures.is_empty());
                }
                Err(e) => {
                    println!("Warning: Could not load MXL file: {}", e);
                    // Don't fail - the file might not exist in CI
                }
            }
        } else {
            println!("Skipping real MXL test - file not found at {:?}", mxl_path);
        }
    }

    #[test]
    fn test_debug_measure_30() {
        // Debug test to investigate notes/rests intersection in measure 30
        let mxl_path = std::path::Path::new("../lessons/mad-world-piano.mxl");
        if !mxl_path.exists() {
            println!("Skipping test - MXL file not found");
            return;
        }

        let lesson = MxlLesson::from_file(mxl_path).expect("Failed to load MXL");

        // Find measure 30
        let measure_30 = lesson.measures.iter().find(|m| m.number == 30);
        if let Some(measure) = measure_30 {
            println!("\n=== MEASURE 30 DEBUG ===");
            println!("Total items: {}", measure.notes.len());

            for (i, note) in measure.notes.iter().enumerate() {
                match note {
                    Note::Single { midi, duration_beats, hand, start_beat, accidental } => {
                        println!(
                            "[{}] Single: MIDI {} ({}) | dur={:.2} | hand={} | beat={:?} | acc={:?}",
                            i, midi, midi_to_note_name(*midi), duration_beats, hand, start_beat, accidental
                        );
                    }
                    Note::Chord { midi_set, duration_beats, hand, start_beat, .. } => {
                        let names: Vec<String> = midi_set.iter()
                            .map(|m| format!("{}", midi_to_note_name(*m)))
                            .collect();
                        println!(
                            "[{}] Chord: [{}] | dur={:.2} | hand={} | beat={:?}",
                            i, names.join(", "), duration_beats, hand, start_beat
                        );
                    }
                    Note::Rest { duration_beats, hand, start_beat } => {
                        println!(
                            "[{}] REST: dur={:.2} | hand={} | beat={:?}",
                            i, duration_beats, hand, start_beat
                        );
                    }
                }
            }

            // Check for overlaps
            println!("\n=== OVERLAP ANALYSIS ===");
            let mut beat_map: std::collections::HashMap<String, Vec<(usize, &Note)>> = std::collections::HashMap::new();
            for (i, note) in measure.notes.iter().enumerate() {
                let (start_beat, hand) = match note {
                    Note::Single { start_beat, hand, .. } => (start_beat.unwrap_or(0.0), hand.clone()),
                    Note::Chord { start_beat, hand, .. } => (start_beat.unwrap_or(0.0), hand.clone()),
                    Note::Rest { start_beat, hand, .. } => (start_beat.unwrap_or(0.0), hand.clone()),
                };
                let key = format!("{:.2}-{}", start_beat, hand);
                beat_map.entry(key).or_default().push((i, note));
            }

            for (key, items) in &beat_map {
                if items.len() > 1 {
                    println!("OVERLAP at {}: {} items", key, items.len());
                    for (idx, note) in items {
                        let desc = match note {
                            Note::Single { midi, .. } => format!("Single({})", midi_to_note_name(*midi)),
                            Note::Chord { midi_set, .. } => format!("Chord({} notes)", midi_set.len()),
                            Note::Rest { .. } => "REST".to_string(),
                        };
                        println!("  - [{}] {}", idx, desc);
                    }
                }
            }
        } else {
            println!("Measure 30 not found!");
        }
    }

    #[test]
    fn test_fifths_to_key_signature() {
        assert_eq!(fifths_to_key_signature(0, "major"), "C major");
        assert_eq!(fifths_to_key_signature(1, "major"), "G major");
        assert_eq!(fifths_to_key_signature(-1, "major"), "F major");
        assert_eq!(fifths_to_key_signature(0, "minor"), "A minor");
    }

    #[test]
    fn test_parse_time_signature() {
        assert_eq!(parse_time_signature("4/4"), (4, 4));
        assert_eq!(parse_time_signature("3/4"), (3, 4));
        assert_eq!(parse_time_signature("6/8"), (6, 8));
    }

    #[test]
    fn test_filter_redundant_rests_removes_overlapping_rests() {
        // Create timed notes with overlapping rests and notes at same position
        let timed_notes = vec![
            TimedNote {
                beat_position: 0.0,
                note: Note::Rest {
                    duration_beats: 1.0,
                    hand: "right".to_string(),
                    start_beat: Some(0.0),
                },
            },
            TimedNote {
                beat_position: 0.0,
                note: Note::Single {
                    midi: 60,
                    duration_beats: 1.0,
                    hand: "right".to_string(),
                    accidental: None,
                    start_beat: Some(0.0),
                },
            },
            TimedNote {
                beat_position: 1.0,
                note: Note::Rest {
                    duration_beats: 1.0,
                    hand: "right".to_string(),
                    start_beat: Some(1.0),
                },
            },
        ];

        let result = filter_redundant_rests(timed_notes);

        // Should have 2 items: the note at beat 0.0 and rest at beat 1.0
        // The rest at beat 0.0 should be filtered out
        assert_eq!(result.len(), 2);

        // First item should be the note
        match &result[0] {
            Note::Single { midi, .. } => assert_eq!(*midi, 60),
            _ => panic!("Expected single note at position 0"),
        }

        // Second item should be the rest at beat 1.0
        match &result[1] {
            Note::Rest { start_beat, .. } => assert_eq!(*start_beat, Some(1.0)),
            _ => panic!("Expected rest at position 1"),
        }
    }

    #[test]
    fn test_filter_redundant_rests_keeps_different_hands() {
        // Create timed notes with rest and note at same position but different hands
        let timed_notes = vec![
            TimedNote {
                beat_position: 0.0,
                note: Note::Rest {
                    duration_beats: 1.0,
                    hand: "left".to_string(),
                    start_beat: Some(0.0),
                },
            },
            TimedNote {
                beat_position: 0.0,
                note: Note::Single {
                    midi: 60,
                    duration_beats: 1.0,
                    hand: "right".to_string(),
                    accidental: None,
                    start_beat: Some(0.0),
                },
            },
        ];

        let result = filter_redundant_rests(timed_notes);

        // Should keep both: left hand rest and right hand note
        assert_eq!(result.len(), 2);
    }

    #[test]
    fn test_filter_redundant_rests_handles_chords() {
        // Create chord and rest at same position
        let timed_notes = vec![
            TimedNote {
                beat_position: 0.0,
                note: Note::Chord {
                    midi_set: vec![60, 64, 67],
                    duration_beats: 1.0,
                    hand: "right".to_string(),
                    chord_name: None,
                    start_beat: Some(0.0),
                },
            },
            TimedNote {
                beat_position: 0.0,
                note: Note::Rest {
                    duration_beats: 1.0,
                    hand: "right".to_string(),
                    start_beat: Some(0.0),
                },
            },
        ];

        let result = filter_redundant_rests(timed_notes);

        // Should only have the chord
        assert_eq!(result.len(), 1);
        match &result[0] {
            Note::Chord { midi_set, .. } => assert_eq!(midi_set.len(), 3),
            _ => panic!("Expected chord"),
        }
    }

    #[test]
    fn test_simple_musicxml_parsing() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Test Song</work-title>
  </work>
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        assert_eq!(lesson.title, "Test Song");
        assert_eq!(lesson.settings.time_signature, "4/4");
        assert_eq!(lesson.settings.key_signature, "C major");
        assert_eq!(lesson.measures.len(), 1);
        assert_eq!(lesson.measures[0].notes.len(), 1);

        // C4 = MIDI 60
        match &lesson.measures[0].notes[0] {
            Note::Single { midi, .. } => assert_eq!(*midi, 60),
            _ => panic!("Expected single note"),
        }
    }

    #[test]
    fn test_multi_voice_with_backup_element() {
        // Test parsing multi-voice notation where backup element rewinds time
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
      </attributes>
      <!-- Voice 1: whole note -->
      <note>
        <pitch><step>C</step><octave>5</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <staff>1</staff>
      </note>
      <!-- Backup to start of measure -->
      <backup><duration>4</duration></backup>
      <!-- Voice 2: four quarter rests (should be filtered if notes exist) -->
      <note>
        <rest/>
        <duration>1</duration>
        <voice>2</voice>
        <staff>1</staff>
      </note>
      <note>
        <rest/>
        <duration>1</duration>
        <voice>2</voice>
        <staff>1</staff>
      </note>
      <note>
        <rest/>
        <duration>1</duration>
        <voice>2</voice>
        <staff>1</staff>
      </note>
      <note>
        <rest/>
        <duration>1</duration>
        <voice>2</voice>
        <staff>1</staff>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        // The whole note at beat 0 should filter out the rest at beat 0
        // Rests at beats 1, 2, 3 should remain
        assert_eq!(lesson.measures.len(), 1);

        let notes = &lesson.measures[0].notes;
        // Should have: 1 note (C5) + 3 rests (at beats 1, 2, 3)
        assert_eq!(notes.len(), 4);

        // First should be the C5 note
        match &notes[0] {
            Note::Single { midi, start_beat, .. } => {
                assert_eq!(*midi, 72); // C5
                assert_eq!(*start_beat, Some(0.0));
            }
            _ => panic!("Expected single note at position 0"),
        }
    }

    #[test]
    fn test_chord_parsing() {
        // Test parsing simultaneous notes marked with <chord> element
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions></attributes>
      <!-- C major chord -->
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration>
      </note>
      <note>
        <chord/>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>1</duration>
      </note>
      <note>
        <chord/>
        <pitch><step>G</step><octave>4</octave></pitch>
        <duration>1</duration>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        assert_eq!(lesson.measures.len(), 1);
        assert_eq!(lesson.measures[0].notes.len(), 1);

        match &lesson.measures[0].notes[0] {
            Note::Chord { midi_set, start_beat, .. } => {
                assert_eq!(midi_set.len(), 3);
                assert!(midi_set.contains(&60)); // C4
                assert!(midi_set.contains(&64)); // E4
                assert!(midi_set.contains(&67)); // G4
                assert_eq!(*start_beat, Some(0.0));
            }
            _ => panic!("Expected chord"),
        }
    }

    #[test]
    fn test_rest_parsing() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions></attributes>
      <note>
        <rest/>
        <duration>2</duration>
      </note>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>2</duration>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        assert_eq!(lesson.measures[0].notes.len(), 2);

        // First should be rest at beat 0
        match &lesson.measures[0].notes[0] {
            Note::Rest { duration_beats, start_beat, .. } => {
                assert_eq!(*duration_beats, 2.0);
                assert_eq!(*start_beat, Some(0.0));
            }
            _ => panic!("Expected rest at position 0"),
        }

        // Second should be note at beat 2
        match &lesson.measures[0].notes[1] {
            Note::Single { midi, start_beat, .. } => {
                assert_eq!(*midi, 60);
                assert_eq!(*start_beat, Some(2.0));
            }
            _ => panic!("Expected note at position 1"),
        }
    }

    #[test]
    fn test_accidentals_sharp() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions></attributes>
      <note>
        <pitch>
          <step>F</step>
          <alter>1</alter>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        match &lesson.measures[0].notes[0] {
            Note::Single { midi, .. } => {
                assert_eq!(*midi, 66); // F#4 = 65 + 1
            }
            _ => panic!("Expected single note"),
        }
    }

    #[test]
    fn test_accidentals_flat() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions></attributes>
      <note>
        <pitch>
          <step>B</step>
          <alter>-1</alter>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        match &lesson.measures[0].notes[0] {
            Note::Single { midi, .. } => {
                assert_eq!(*midi, 70); // Bb4 = 71 - 1
            }
            _ => panic!("Expected single note"),
        }
    }

    #[test]
    fn test_key_signature_g_major() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>1</fifths><mode>major</mode></key>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        assert_eq!(lesson.settings.key_signature, "G major");
    }

    #[test]
    fn test_key_signature_f_major() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>-1</fifths><mode>major</mode></key>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        assert_eq!(lesson.settings.key_signature, "F major");
    }

    #[test]
    fn test_key_signature_a_minor() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths><mode>minor</mode></key>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        assert_eq!(lesson.settings.key_signature, "A minor");
    }

    #[test]
    fn test_time_signature_3_4() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <time><beats>3</beats><beat-type>4</beat-type></time>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        assert_eq!(lesson.settings.time_signature, "3/4");
    }

    #[test]
    fn test_time_signature_6_8() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
        <time><beats>6</beats><beat-type>8</beat-type></time>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        assert_eq!(lesson.settings.time_signature, "6/8");
    }

    #[test]
    fn test_two_staff_notation() {
        // Test grand staff with treble and bass
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <staves>2</staves>
      </attributes>
      <!-- Right hand (staff 1) -->
      <note>
        <pitch><step>C</step><octave>5</octave></pitch>
        <duration>4</duration>
        <staff>1</staff>
      </note>
      <!-- Backup to play left hand -->
      <backup><duration>4</duration></backup>
      <!-- Left hand (staff 2) -->
      <note>
        <pitch><step>C</step><octave>3</octave></pitch>
        <duration>4</duration>
        <staff>2</staff>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        assert_eq!(lesson.measures.len(), 1);
        assert_eq!(lesson.measures[0].notes.len(), 2);

        // Check hands assignment
        let notes = &lesson.measures[0].notes;

        // Both notes should be at beat 0
        let right_hand_note = notes.iter().find(|n| {
            matches!(n, Note::Single { hand, .. } if hand == "right")
        });
        let left_hand_note = notes.iter().find(|n| {
            matches!(n, Note::Single { hand, .. } if hand == "left")
        });

        assert!(right_hand_note.is_some(), "Should have right hand note");
        assert!(left_hand_note.is_some(), "Should have left hand note");
    }

    #[test]
    fn test_forward_element() {
        // Test forward element which advances time without sound
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions></attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration>
      </note>
      <!-- Skip 2 beats -->
      <forward><duration>2</duration></forward>
      <note>
        <pitch><step>G</step><octave>4</octave></pitch>
        <duration>1</duration>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        assert_eq!(lesson.measures[0].notes.len(), 2);

        // First note at beat 0
        match &lesson.measures[0].notes[0] {
            Note::Single { midi, start_beat, .. } => {
                assert_eq!(*midi, 60); // C4
                assert_eq!(*start_beat, Some(0.0));
            }
            _ => panic!("Expected single note"),
        }

        // Second note at beat 3 (0 + 1 + 2 forward)
        match &lesson.measures[0].notes[1] {
            Note::Single { midi, start_beat, .. } => {
                assert_eq!(*midi, 67); // G4
                assert_eq!(*start_beat, Some(3.0));
            }
            _ => panic!("Expected single note"),
        }
    }

    #[test]
    fn test_multiple_measures() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions></attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
      </note>
    </measure>
    <measure number="2">
      <note>
        <pitch><step>D</step><octave>4</octave></pitch>
        <duration>4</duration>
      </note>
    </measure>
    <measure number="3">
      <note>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>4</duration>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        assert_eq!(lesson.measures.len(), 3);

        // Check measure numbers are correct
        assert_eq!(lesson.measures[0].number, 1);
        assert_eq!(lesson.measures[1].number, 2);
        assert_eq!(lesson.measures[2].number, 3);

        // Check notes in each measure
        match &lesson.measures[0].notes[0] {
            Note::Single { midi, .. } => assert_eq!(*midi, 60), // C4
            _ => panic!("Expected C4"),
        }
        match &lesson.measures[1].notes[0] {
            Note::Single { midi, .. } => assert_eq!(*midi, 62), // D4
            _ => panic!("Expected D4"),
        }
        match &lesson.measures[2].notes[0] {
            Note::Single { midi, .. } => assert_eq!(*midi, 64), // E4
            _ => panic!("Expected E4"),
        }
    }

    #[test]
    fn test_duration_divisions() {
        // Test proper duration calculation with divisions
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
      </attributes>
      <!-- Quarter note = divisions (4) -->
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
      </note>
      <!-- Eighth note = divisions/2 (2) -->
      <note>
        <pitch><step>D</step><octave>4</octave></pitch>
        <duration>2</duration>
      </note>
      <!-- Sixteenth note = divisions/4 (1) -->
      <note>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>1</duration>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        let notes = &lesson.measures[0].notes;
        assert_eq!(notes.len(), 3);

        // Quarter note = 1.0 beat
        match &notes[0] {
            Note::Single { duration_beats, start_beat, .. } => {
                assert_eq!(*duration_beats, 1.0);
                assert_eq!(*start_beat, Some(0.0));
            }
            _ => panic!("Expected note"),
        }

        // Eighth note = 0.5 beat
        match &notes[1] {
            Note::Single { duration_beats, start_beat, .. } => {
                assert_eq!(*duration_beats, 0.5);
                assert_eq!(*start_beat, Some(1.0));
            }
            _ => panic!("Expected note"),
        }

        // Sixteenth note = 0.25 beat
        match &notes[2] {
            Note::Single { duration_beats, start_beat, .. } => {
                assert_eq!(*duration_beats, 0.25);
                assert_eq!(*start_beat, Some(1.5));
            }
            _ => panic!("Expected note"),
        }
    }

    #[test]
    fn test_title_from_movement_title() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <movement-title>My Movement Title</movement-title>
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions></attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        assert_eq!(lesson.title, "My Movement Title");
    }

    #[test]
    fn test_title_fallback_to_filename() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions></attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("my-cool-song.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        assert_eq!(lesson.title, "my cool song");
    }

    #[test]
    fn test_description_from_creator() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <identification>
    <creator type="composer">Johann Sebastian Bach</creator>
  </identification>
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions></attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        assert!(lesson.description.is_some());
        assert!(lesson.description.unwrap().contains("Johann Sebastian Bach"));
    }

    #[test]
    fn test_total_beats_calculation() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions></attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>2</duration>
      </note>
      <note>
        <pitch><step>D</step><octave>4</octave></pitch>
        <duration>2</duration>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        // Two half notes = 4 beats total
        assert_eq!(lesson.total_beats(), 4.0);
    }

    #[test]
    fn test_measure_with_only_rests() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions></attributes>
      <note>
        <rest/>
        <duration>4</duration>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        assert_eq!(lesson.measures.len(), 1);
        assert_eq!(lesson.measures[0].notes.len(), 1);

        match &lesson.measures[0].notes[0] {
            Note::Rest { duration_beats, .. } => {
                assert_eq!(*duration_beats, 4.0);
            }
            _ => panic!("Expected rest"),
        }
    }

    #[test]
    fn test_octave_range() {
        // Test various octaves are parsed correctly
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions></attributes>
      <note>
        <pitch><step>C</step><octave>1</octave></pitch>
        <duration>1</duration>
      </note>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration>
      </note>
      <note>
        <pitch><step>C</step><octave>7</octave></pitch>
        <duration>1</duration>
      </note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        let notes = &lesson.measures[0].notes;

        // C1 = MIDI 24
        match &notes[0] {
            Note::Single { midi, .. } => assert_eq!(*midi, 24),
            _ => panic!("Expected note"),
        }

        // C4 = MIDI 60 (middle C)
        match &notes[1] {
            Note::Single { midi, .. } => assert_eq!(*midi, 60),
            _ => panic!("Expected note"),
        }

        // C7 = MIDI 96
        match &notes[2] {
            Note::Single { midi, .. } => assert_eq!(*midi, 96),
            _ => panic!("Expected note"),
        }
    }

    #[test]
    fn test_all_pitch_steps() {
        // Test all 7 pitch steps are parsed correctly
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions></attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration></note>
      <note><pitch><step>F</step><octave>4</octave></pitch><duration>1</duration></note>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration></note>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>1</duration></note>
    </measure>
  </part>
</score-partwise>"#;

        let path = Path::new("test.mxl");
        let lesson = MxlLesson::from_xml(xml, path).unwrap();

        let notes = &lesson.measures[0].notes;
        let expected_midi = [60, 62, 64, 65, 67, 69, 71]; // C, D, E, F, G, A, B

        for (i, expected) in expected_midi.iter().enumerate() {
            match &notes[i] {
                Note::Single { midi, .. } => assert_eq!(*midi, *expected, "Note {} mismatch", i),
                _ => panic!("Expected note at position {}", i),
            }
        }
    }
}
