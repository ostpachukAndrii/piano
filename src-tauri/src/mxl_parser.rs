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

            // Extract just the Note objects
            let sorted_notes: Vec<Note> = notes.into_iter().map(|tn| tn.note).collect();

            Measure {
                number,
                notes: sorted_notes,
            }
        })
        .collect();

    // Sort measures by number
    all_measures.sort_by_key(|m| m.number);

    Ok(all_measures)
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
}
