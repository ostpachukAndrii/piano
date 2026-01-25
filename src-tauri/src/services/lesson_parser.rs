// Lesson Parser Service
// Single responsibility: Load YAML lesson files and parse them into Lesson structures
// Uses: serde_yaml for parsing, piano-domain for models
// Output: Lesson struct (id, metadata, measures with notes)

// TODO: Implement YAML parsing
// - Read YAML file
// - Deserialize to Lesson struct
// - Validate structure
// - Return Result<Lesson, ParseError>
