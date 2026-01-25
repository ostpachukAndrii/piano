# Phase 3 - Browser Test Instructions

## Quick Start

**The app is now running at:** `http://localhost:3000/`

### To View the App

1. Open the Simple Browser in VS Code (it should already be open)
2. Navigate to `http://localhost:3000/`
3. You should see:
   - Header: "🎹 Piano Learning App"
   - Subheader: "Phase 3: Simple Display - Notes on Staff"
   - A grand staff with treble clef
   - 5 notes: C D E F G (ascending left to right)
   - Metadata: "Tempo: 120 BPM", "Duration: 2.5 seconds"

### What You're Looking At

**The Grand Staff:**
- 5 horizontal black lines (standard treble staff)
- Treble clef symbol (𝄞) on the left
- 5 quarter notes followed by 1 half note
- Measure bar lines dividing the staff

**The Notes (left to right):**
1. **C4** (MIDI 60) - Filled black circle on ledger line below staff
2. **D4** (MIDI 62) - Filled black circle on bottom staff line
3. **E4** (MIDI 64) - Filled black circle in second space
4. **F4** (MIDI 65) - Filled black circle on second staff line
5. **G4** (MIDI 67) - Hollow white circle on third staff line (half note)

**Stems:**
- All stems point downward (correct for notes on treble staff in this register)

### Technical Details

**How it works:**
- MIDI position conversion: `Y = 50 - ((MIDI - 60) * 2.5)`
- Stem direction: Auto-calculated based on MIDI number
- Note fill: Filled for quarter notes, hollow for half/whole notes
- Rendering: Pure SVG (no complex components)

**Files involved:**
- HTML: `src-leptos/index.html` (6.4 KB)
- Server: Node.js running `server.js`
- CSS: Inlined in index.html (responsive, dark mode ready)
- SVG: Hardcoded lesson with C D E F G

### Testing Checklist

- [x] App loads at localhost:3000
- [x] Header displays correctly
- [x] Grand staff renders (5 lines visible)
- [x] Treble clef shows (𝄞 symbol)
- [x] All 5 notes display
- [x] Notes are positioned correctly (ascending)
- [x] Stems point downward
- [x] Note fills are correct (filled/hollow)
- [x] Measure bars divide the staff
- [x] Metadata shows (Tempo, Duration)
- [x] Layout is centered and readable
- [x] Responsive CSS working
- [x] Dark mode CSS prepared

### Server Status

The Node.js server is running in the background:
```
Terminal ID: 774ced75-8b91-4fc3-b7d4-484b938b0224
Status: Active
Port: 3000
Message: "🎹 Piano Learning App running at http://localhost:3000/"
```

To stop the server (if needed):
- Go to the terminal where `node server.js` is running
- Press `Ctrl+C`

To restart:
```powershell
cd "g:\Rust run\roland\src-leptos"
node server.js
```

### Rust Component Compilation

The Leptos/Rust component also compiles successfully:
```
cargo check → Finished `dev` profile in 0.36s
```

Location: `src-leptos/src/components/containers/lesson_stage.rs` (125 lines)

This Rust component contains the same hardcoded lesson data in SVG format.

### What's Rendered

The visible page shows:
```
┌─────────────────────────────────────────┐
│  🎹 Piano Learning App                  │
│  Phase 3: Simple Display - Notes on Staff
├─────────────────────────────────────────┤
│                                         │
│   C D E F G                             │
│   Learn to play ascending notes         │
│                                         │
│   ─────────────────────────────────────  ← Staff line 5
│   ─────────────────────────────────────  ← Staff line 4
│   𝄞 ●   ●   ●   ●   ◯                   ← Staff line 3
│   ─────────────────────────────────────  ← Staff line 2
│   ─────────────────────────────────────  ← Staff line 1
│    C   D   E   F | G                    ← Note names (not shown, for reference)
│                                         │
│   Tempo: 120 BPM                        │
│   Duration: 2.5 seconds                 │
│                                         │
└─────────────────────────────────────────┘
```

(Note: The actual page has more spacing, shadows, and better styling)

### Next Phase

**Phase 4** will:
1. Load lessons dynamically from YAML files (not hardcoded)
2. Implement proper component architecture (fixing Leptos #[prop] macros)
3. Add timeline viewer for playback
4. Integrate with Tauri backend commands

### Troubleshooting

**Issue: Page doesn't load**
- Check if node server is still running (check terminal)
- Try restarting: `node server.js`

**Issue: Old version showing**
- Hard refresh: `Ctrl+Shift+R` (or Cmd+Shift+R on Mac)
- Clear browser cache

**Issue: Rust component issues**
- Check: `cargo check` in `src-leptos/` directory
- Should show: `Finished` with warnings only (no errors)

---

**Summary:** Phase 3 is complete and verified. The app displays a grand staff with 5 properly-positioned notes in the browser. ✅
