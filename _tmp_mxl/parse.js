// MusicXML Parser - Extracts note data from score.xml
// Mirrors the Rust mxl_parser.rs logic
// Run: node parse.js  |  Output: mad-world.json

const fs = require("fs");
const path = require("path");
const INPUT = path.join(__dirname, "score.xml");
const OUTPUT = path.join(__dirname, "mad-world.json");

function gfc(xml, tag) {
  const re = new RegExp("<" + tag + "[^>]*>(.*?)</" + tag + ">", "s");
  const m = xml.match(re);
  return m ? m[1].trim() : null;
}

function gtc(xml, tag) {
  const re = new RegExp("<" + tag + "[^>]*>(.*?)</" + tag + ">", "gs");
  const r = []; let m;
  while ((m = re.exec(xml)) !== null) r.push(m[1].trim());
  return r;
}

function hst(xml, tag) { return new RegExp("<" + tag + "\\s*/>").test(xml); }
function ht(xml, tag) { return new RegExp("<" + tag + "[\\s/>]").test(xml); }

function smc(mxml) {
  const children = [];
  const re = /<(note|backup|forward|attributes|direction|harmony|print|barline)(\s[^>]*)?>.*?<\/\1>/gs;
  let m;
  while ((m = re.exec(mxml)) !== null) children.push({ tag: m[1], xml: m[0] });
  return children;
}

function stepToValue(step) {
  const map = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  return map[step.toUpperCase()] !== undefined ? map[step.toUpperCase()] : null;
}

function pitchToMidi(step, octave, alter) {
  const sv = stepToValue(step);
  if (sv === null) return null;
  const o = parseInt(octave, 10);
  const a = alter ? parseInt(alter, 10) : 0;
  return (o + 1) * 12 + sv + a;
}

function fifthsToKey(fifths, mode) {
  const mj = ["Cb","Gb","Db","Ab","Eb","Bb","F","C","G","D","A","E","B","F#","C#"];
  const mn = ["Ab","Eb","Bb","F","C","G","D","A","E","B","F#","C#","G#","D#","A#"];
  const idx = fifths + 7;
  const keys = (mode || "major").toLowerCase() === "minor" ? mn : mj;
  return (keys[idx] || "C") + " " + (mode || "major");
}

function midiToName(midi) {
  const notes = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  return notes[midi % 12] + (Math.floor(midi / 12) - 1);
}

// --- Main Parsing ---
const xml = fs.readFileSync(INPUT, "utf8");
let tempo = 120, timeSignature = "4/4", keySignature = "C major", divisions = 2;

const titleMatch = xml.match(/<credit-type>title<\/credit-type>\s*<credit-words[^>]*>([^<]+)<\/credit-words>/);
const title = titleMatch ? titleMatch[1].trim() : "Mad World";

const partContent = gtc(xml, "part");
if (!partContent.length) { console.error("No part found"); process.exit(1); }

const allMeasures = new Map();

for (const partXml of partContent) {
  const mRe = /<measure\s[^>]*number="(\d+)"[^>]*>(.*?)<\/measure>/gs;
  let mm;
  while ((mm = mRe.exec(partXml)) !== null) {
    const measureNum = parseInt(mm[1], 10);
    const mXml = mm[2];

    const dv = gfc(mXml, "divisions");
    if (dv) divisions = parseInt(dv, 10) || divisions;

    if (ht(mXml, "key")) {
      const kx = mXml.match(/<key>(.*?)<\/key>/s);
      if (kx) {
        const fifths = parseInt(gfc(kx[1], "fifths") || "0", 10);
        const mode = gfc(kx[1], "mode") || "major";
        keySignature = fifthsToKey(fifths, mode);
      }
    }

    if (ht(mXml, "time")) {
      const tx = mXml.match(/<time>(.*?)<\/time>/s);
      if (tx) {
        const beats = gfc(tx[1], "beats") || "4";
        const bt = gfc(tx[1], "beat-type") || "4";
        timeSignature = beats + "/" + bt;
      }
    }

    const stm = mXml.match(/<sound[^>]*tempo="(\d+)"/);
    if (stm) tempo = parseInt(stm[1], 10);

    const children = smc(mXml);
    let cb = 0, cn = [], cd = 0, ch = "right", csb = 0, ic = false;

    function flushChord() {
      if (!cn.length) return;
      const entry = allMeasures.get(measureNum) || [];
      if (cn.length === 1) {
        entry.push({ midi: cn[0], duration: cd, hand: ch, start_beat: csb, _name: midiToName(cn[0]) });
      } else {
        const sorted = [...cn].sort((a,b) => a-b);
        entry.push({ midi_set: sorted, duration: cd, hand: ch, start_beat: csb, _names: sorted.map(midiToName) });
      }
      allMeasures.set(measureNum, entry);
      cn = []; ic = false;
    }

    for (const child of children) {
      if (["attributes","direction","harmony","print","barline"].includes(child.tag)) continue;

      if (child.tag === "backup") {
        flushChord();
        const dur = parseInt(gfc(child.xml, "duration") || "0", 10);
        cb = Math.max(0, cb - dur / divisions);
        continue;
      }
      if (child.tag === "forward") {
        flushChord();
        const dur = parseInt(gfc(child.xml, "duration") || "0", 10);
        cb += dur / divisions;
        continue;
      }

      if (child.tag === "note") {
        const nx = child.xml;
        const isRest = ht(nx, "rest") || hst(nx, "rest");
        const isChordMember = ht(nx, "chord") || hst(nx, "chord");
        const dd = parseInt(gfc(nx, "duration") || String(divisions), 10);
        const db = dd / divisions;
        const staff = parseInt(gfc(nx, "staff") || "1", 10);
        const hand = staff === 2 ? "left" : "right";

        if (isRest) {
          flushChord();
          const entry = allMeasures.get(measureNum) || [];
          entry.push({ type: "rest", duration: db, hand, start_beat: cb });
          allMeasures.set(measureNum, entry);
          cb += db;
          continue;
        }

        const pm = nx.match(/<pitch>(.*?)<\/pitch>/s);
        if (!pm) { if (!isChordMember) cb += db; continue; }
        const px = pm[1];
        const step = gfc(px, "step");
        const octave = gfc(px, "octave");
        const alter = gfc(px, "alter");
        if (!step || !octave) { if (!isChordMember) cb += db; continue; }
        const midi = pitchToMidi(step, octave, alter);
        if (midi === null) { if (!isChordMember) cb += db; continue; }

        if (isChordMember && ic) {
          cn.push(midi);
        } else {
          flushChord();
          cn.push(midi);
          cd = db; ch = hand; csb = cb; ic = true;
          cb += db;
        }
      }
    }
    flushChord();
  }
}

// --- Filter redundant rests and build output ---
function filterRedundantRests(notes) {
  const np = new Set();
  for (const n of notes) {
    if (n.type === "rest") continue;
    np.add(Math.round((n.start_beat || 0) * 100) + ":" + n.hand);
  }
  return notes.filter(n => {
    if (n.type !== "rest") return true;
    return !np.has(Math.round((n.start_beat || 0) * 100) + ":" + n.hand);
  });
}

const sortedNums = [...allMeasures.keys()].sort((a,b) => a-b);
const measures = sortedNums.map(num => {
  let notes = allMeasures.get(num);
  notes.sort((a,b) => (a.start_beat||0) - (b.start_beat||0));
  notes = filterRedundantRests(notes);
  return { number: num, notes: notes.map(n => {
    if (n.type === "rest") return { type: "rest", duration: n.duration, hand: n.hand, start_beat: n.start_beat };
    if (n.midi_set) return { midi_set: n.midi_set, duration: n.duration, hand: n.hand, start_beat: n.start_beat, _names: n._names };
    return { midi: n.midi, duration: n.duration, hand: n.hand, start_beat: n.start_beat, _name: n._name };
  })};
});

let totalBeats = 0;
measures.forEach(m => m.notes.forEach(n => { totalBeats += n.duration; }));

const output = {
  title, tempo, time_signature: timeSignature, key_signature: keySignature,
  total_beats: totalBeats, total_seconds: Math.round(totalBeats / tempo * 60),
  measure_count: measures.length, measures
};

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2));

console.log("Title: " + output.title);
console.log("Tempo: " + output.tempo + " BPM");
console.log("Time Signature: " + output.time_signature);
console.log("Key Signature: " + output.key_signature);
console.log("Measures: " + output.measure_count);
console.log("Total beats: " + output.total_beats);
console.log("Total seconds: ~" + output.total_seconds + "s");
console.log("Output saved to: " + OUTPUT);
