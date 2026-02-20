const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'mad-world.json'), 'utf8'));

function formatNote(n) {
  const parts = [];
  if (n.midi !== undefined) {
    parts.push(`midi: ${n.midi}`);
  } else if (n.midi_set !== undefined) {
    parts.push(`midi: [${n.midi_set.join(', ')}]`);
  }
  parts.push(`duration: ${n.duration}`);
  parts.push(`hand: '${n.hand}'`);
  parts.push(`start_beat: ${n.start_beat}`);
  return `{ ${parts.join(', ')} }`;
}

function formatMeasure(m, indent) {
  const notesStr = m.notes.map(n => `${indent}      ${formatNote(n)}`).join(',\n');
  return `${indent}  {\n${indent}    number: ${m.number},\n${indent}    notes: [\n${notesStr}\n${indent}    ]\n${indent}  }`;
}

const indent = '    ';
const measuresStr = data.measures.map(m => formatMeasure(m, indent)).join(',\n');

const output = `    measures: [
${measuresStr}
    ]`;

console.log(output);
