import { Injectable } from '@angular/core';

/**
 * Generic interface for notes that can be beamed
 * Works with both ScrollingNote and StaffNote types
 */
export interface BeamableNote {
    /** MIDI values (single note or chord) */
    midi: number[];
    /** Start position (beat or index) */
    startPosition: number;
    /** Duration in beats */
    durationBeats: number;
    /** Hand assignment */
    hand: 'left' | 'right';
    /** Whether this is a rest */
    isRest?: boolean;
    /** Original note reference (for tracking) */
    originalNote?: unknown;
}

/**
 * Beam group for rendering
 */
export interface BeamGroupResult {
    /** Notes in the beam group */
    notes: BeamableNote[];
    /** Stem direction (true = up, false = down) */
    stemUp: boolean;
    /** Number of beam lines (1 = 8th, 2 = 16th, 3 = 32nd) */
    beamCount: number;
    /** Indices of notes in the original array */
    noteIndices: number[];
}

/**
 * Shared service for note beaming logic
 * Ensures consistent note connection between classic and scrolling views
 */
@Injectable({
    providedIn: 'root'
})
export class BeamingService {
    /** Maximum notes allowed in a single beam group */
    readonly MAX_NOTES_PER_BEAM = 4;

    /**
     * Build beam groups from a collection of notes
     * Groups notes within the same measure that have duration < 1 beat
     *
     * @param notes Array of beamable notes
     * @param beatsPerMeasure Beats per measure (for grouping by measure)
     * @returns Array of beam groups
     */
    buildBeamGroups(notes: BeamableNote[], beatsPerMeasure: number = 4): BeamGroupResult[] {
        const groups: BeamGroupResult[] = [];

        // Filter notes that can be beamed (duration < 1 beat, not rests)
        const beamableNotes = notes
            .map((note, index) => ({ note, index }))
            .filter(({ note }) =>
                note.durationBeats < 1 &&
                !note.isRest &&
                note.durationBeats > 0 &&
                note.midi.length > 0
            );

        if (beamableNotes.length === 0) return groups;

        // Group notes by MEASURE and hand
        const measureGroups = new Map<string, { note: BeamableNote; index: number }[]>();

        for (const item of beamableNotes) {
            const measureIndex = Math.floor(item.note.startPosition / beatsPerMeasure);
            const key = `${measureIndex}-${item.note.hand}`;

            if (!measureGroups.has(key)) {
                measureGroups.set(key, []);
            }
            measureGroups.get(key)!.push(item);
        }

        // Process each measure group
        for (const [, items] of measureGroups) {
            if (items.length < 2) continue; // Need at least 2 notes to beam

            // Sort by start position
            items.sort((a, b) => a.note.startPosition - b.note.startPosition);

            // Split into consecutive groups, respecting MAX_NOTES_PER_BEAM limit
            let currentGroup: { note: BeamableNote; index: number }[] = [];

            for (let i = 0; i < items.length; i++) {
                const item = items[i];

                if (currentGroup.length === 0) {
                    currentGroup.push(item);
                } else {
                    const prevItem = currentGroup[currentGroup.length - 1];
                    const prevEnd = prevItem.note.startPosition + prevItem.note.durationBeats;
                    const gap = item.note.startPosition - prevEnd;

                    // Check if consecutive (allow small tolerance for floating point)
                    const isConsecutive = gap <= 0.01;
                    const atMaxLimit = currentGroup.length >= this.MAX_NOTES_PER_BEAM;

                    if (isConsecutive && !atMaxLimit) {
                        currentGroup.push(item);
                    } else {
                        // Finalize current group and start a new one
                        if (currentGroup.length >= 2) {
                            groups.push(this.createBeamGroup(currentGroup));
                        }
                        currentGroup = [item];
                    }
                }
            }

            // Finalize the last group
            if (currentGroup.length >= 2) {
                groups.push(this.createBeamGroup(currentGroup));
            }
        }

        return groups;
    }

    /**
     * Create a beam group from a set of note items
     */
    private createBeamGroup(items: { note: BeamableNote; index: number }[]): BeamGroupResult {
        const notes = items.map(item => item.note);
        const noteIndices = items.map(item => item.index);

        // Stem direction based on hand:
        // - Right hand: stems UP (traditional notation)
        // - Left hand: stems DOWN (traditional notation)
        const hand = notes[0].hand;
        const stemUp = hand === 'right';

        // Determine beam count based on shortest note duration
        const minDuration = Math.min(...notes.map(n => n.durationBeats));
        let beamCount = 1; // Default: 8th notes
        if (minDuration <= 0.25) beamCount = 2; // 16th notes
        if (minDuration <= 0.125) beamCount = 3; // 32nd notes

        return {
            notes,
            stemUp,
            beamCount,
            noteIndices
        };
    }

    /**
     * Draw beams on a canvas context
     *
     * @param ctx Canvas rendering context
     * @param group Beam group to draw
     * @param xPositions X positions for each note
     * @param yPositions Y positions for each note (notehead center)
     * @param color Beam color
     * @param noteheadRadiusX Horizontal radius of notehead
     * @param noteheadRadiusY Vertical radius of notehead
     * @param baseStemLength Base stem length (default 50, use smaller for compact views)
     */
    drawBeamGroup(
        ctx: CanvasRenderingContext2D,
        group: BeamGroupResult,
        xPositions: number[],
        yPositions: number[],
        color: string,
        noteheadRadiusX: number = 10,
        noteheadRadiusY: number = 7,
        baseStemLength: number = 50
    ): void {
        if (group.notes.length < 2) return;

        const beamThickness = 4;
        const beamSpacing = 6;

        // Calculate dynamic stem length based on note range
        const minY = Math.min(...yPositions);
        const maxY = Math.max(...yPositions);
        const yRange = maxY - minY;

        // Use provided base stem length, with extra for large note range
        const stemLength = Math.max(baseStemLength, baseStemLength + yRange * 0.3);

        // Calculate stem endpoints
        const stemEndpoints: { x: number; y: number }[] = [];

        for (let i = 0; i < group.notes.length; i++) {
            const x = xPositions[i];
            const noteheadCenterY = yPositions[i];

            // Notehead is an ellipse (rx=10, ry=7) rotated by -0.3 radians (-17°).
            // The actual edge positions of the rotated ellipse:
            //   Right edge (stems up):  (x + 9.5, y - 3)
            //   Left edge (stems down): (x - 9.5, y + 3)
            const attachY = group.stemUp
                ? noteheadCenterY - (noteheadRadiusY - 4)   // ≈ y - 3
                : noteheadCenterY + (noteheadRadiusY - 4);  // ≈ y + 3

            const stemX = group.stemUp
                ? x + noteheadRadiusX - 1  // ≈ x + 9 (right edge of rotated notehead)
                : x - noteheadRadiusX + 1; // ≈ x - 9 (left edge of rotated notehead)
            const stemEndY = group.stemUp ? attachY - stemLength : attachY + stemLength;

            stemEndpoints.push({ x: stemX, y: stemEndY });
        }

        // Calculate beam line (from first to last stem endpoint)
        const firstEnd = stemEndpoints[0];
        const lastEnd = stemEndpoints[stemEndpoints.length - 1];

        // Calculate slope (limited to reasonable angle)
        const dx = lastEnd.x - firstEnd.x;
        const idealSlope = dx !== 0 ? (lastEnd.y - firstEnd.y) / dx : 0;
        const maxSlope = 0.15; // Max ~15% slope
        const slope = Math.max(-maxSlope, Math.min(maxSlope, idealSlope));

        // Beam Y position function
        const beamStartY = firstEnd.y;
        const beamYAtX = (x: number) => beamStartY + slope * (x - firstEnd.x);

        // Draw stems to beam
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        for (let i = 0; i < group.notes.length; i++) {
            const x = xPositions[i];
            const noteheadCenterY = yPositions[i];

            const attachY = group.stemUp
                ? noteheadCenterY - (noteheadRadiusY - 4)   // ≈ y - 3
                : noteheadCenterY + (noteheadRadiusY - 4);  // ≈ y + 3

            const stemX = group.stemUp
                ? x + noteheadRadiusX - 1  // ≈ x + 9 (right edge of rotated notehead)
                : x - noteheadRadiusX + 1; // ≈ x - 9 (left edge of rotated notehead)
            const beamY = beamYAtX(stemX);

            ctx.beginPath();
            ctx.moveTo(stemX, attachY);
            ctx.lineTo(stemX, beamY);
            ctx.stroke();
        }

        // Draw primary beam (connects all notes)
        ctx.fillStyle = color;
        const firstStemX = stemEndpoints[0].x;
        const lastStemX = stemEndpoints[stemEndpoints.length - 1].x;

        ctx.beginPath();
        if (group.stemUp) {
            ctx.moveTo(firstStemX, beamYAtX(firstStemX));
            ctx.lineTo(lastStemX, beamYAtX(lastStemX));
            ctx.lineTo(lastStemX, beamYAtX(lastStemX) + beamThickness);
            ctx.lineTo(firstStemX, beamYAtX(firstStemX) + beamThickness);
        } else {
            ctx.moveTo(firstStemX, beamYAtX(firstStemX));
            ctx.lineTo(lastStemX, beamYAtX(lastStemX));
            ctx.lineTo(lastStemX, beamYAtX(lastStemX) - beamThickness);
            ctx.lineTo(firstStemX, beamYAtX(firstStemX) - beamThickness);
        }
        ctx.closePath();
        ctx.fill();

        // Draw secondary beams for 16th notes and shorter
        if (group.beamCount >= 2) {
            const offset = group.stemUp ? beamSpacing : -beamSpacing;
            ctx.beginPath();
            ctx.moveTo(firstStemX, beamYAtX(firstStemX) + offset);
            ctx.lineTo(lastStemX, beamYAtX(lastStemX) + offset);
            ctx.lineTo(lastStemX, beamYAtX(lastStemX) + offset + (group.stemUp ? beamThickness : -beamThickness));
            ctx.lineTo(firstStemX, beamYAtX(firstStemX) + offset + (group.stemUp ? beamThickness : -beamThickness));
            ctx.closePath();
            ctx.fill();
        }

        // Draw tertiary beams for 32nd notes
        if (group.beamCount >= 3) {
            const offset = group.stemUp ? beamSpacing * 2 : -beamSpacing * 2;
            ctx.beginPath();
            ctx.moveTo(firstStemX, beamYAtX(firstStemX) + offset);
            ctx.lineTo(lastStemX, beamYAtX(lastStemX) + offset);
            ctx.lineTo(lastStemX, beamYAtX(lastStemX) + offset + (group.stemUp ? beamThickness : -beamThickness));
            ctx.lineTo(firstStemX, beamYAtX(firstStemX) + offset + (group.stemUp ? beamThickness : -beamThickness));
            ctx.closePath();
            ctx.fill();
        }
    }

    /**
     * Check if a note index is part of any beam group
     */
    isNoteBeamed(noteIndex: number, beamGroups: BeamGroupResult[]): boolean {
        return beamGroups.some(group => group.noteIndices.includes(noteIndex));
    }
}
