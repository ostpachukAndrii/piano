import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, computed, signal } from '@angular/core';
import { LessonDTO, MeasureDTO } from '../../core/models/lesson.model';
import { ChordNoteDTO, NoteDTO, RestNoteDTO, SingleNoteDTO, getStartBeat, isChordNote, isRestNote, isSingleNote } from '../../core/models/note.model';
import { StaffComponent, StaffNote } from '../../shared/components/staff/staff.component';

/**
 * Represents a line of music with both treble and bass notes
 */
interface StaffLine {
    trebleNotes: StaffNote[];
    bassNotes: StaffNote[];
    globalStartIndex: number;
    globalBeatOffset: number; // Beat position where this line starts
    isLastLine: boolean;
}

/**
 * Grand Staff Component
 * Renders both treble (right hand) and bass (left hand) staves
 * with notes from a lesson, paired together line by line
 */
@Component({
    selector: 'app-grand-staff',
    standalone: true,
    imports: [CommonModule, StaffComponent],
    template: `
        <div class="grand-staff">
            <!-- Render each line as a treble/bass pair -->
            @for (line of staffLines(); track line.globalStartIndex; let i = $index) {
                <div class="staff-line-pair">
                    <!-- Treble Staff -->
                    <app-staff
                        [width]="staffWidth"
                        [height]="staffHeight"
                        [notes]="line.trebleNotes"
                        [activeNotes]="trebleActiveNotes()"
                        [currentNoteIndex]="currentNoteIndex"
                        [playheadPosition]="playheadPosition"
                        [playheadBeatPosition]="playheadBeatPosition"
                        [highlightNoteIndex]="highlightNoteIndex"
                        [isPlaying]="isPlaying"
                        [globalNoteOffset]="line.globalStartIndex"
                        [globalBeatOffset]="line.globalBeatOffset"
                        [isLastLine]="line.isLastLine"
                        [timeSignature]="lesson?.time_signature || null"
                        clef="treble">
                    </app-staff>

                    <!-- Bass Staff (close to treble) -->
                    <app-staff
                        [width]="staffWidth"
                        [height]="staffHeight"
                        [notes]="line.bassNotes"
                        [activeNotes]="bassActiveNotes()"
                        [currentNoteIndex]="currentNoteIndex"
                        [playheadPosition]="playheadPosition"
                        [playheadBeatPosition]="playheadBeatPosition"
                        [highlightNoteIndex]="highlightNoteIndex"
                        [isPlaying]="isPlaying"
                        [globalNoteOffset]="line.globalStartIndex"
                        [globalBeatOffset]="line.globalBeatOffset"
                        [isLastLine]="line.isLastLine"
                        [timeSignature]="lesson?.time_signature || null"
                        clef="bass">
                    </app-staff>

                    <!-- Spacer between line pairs -->
                    @if (!line.isLastLine) {
                        <div class="line-spacer"></div>
                    }
                </div>
            }
        </div>
    `,
    styles: [`
        .grand-staff {
            padding: 0.5rem;
            background: #fafafa;
            border-radius: 8px;
            position: relative;
            overflow-x: auto;
        }

        .staff-line-pair {
            margin-bottom: 0;
            min-width: 900px;
        }

        .staff-line-pair app-staff:last-of-type {
            /* Add small gap between treble and bass staves */
            margin-top: 8px;
        }

        .line-spacer {
            height: 1rem;
            margin: 0.5rem 0;
        }

        app-staff {
            display: block;
        }
    `]
})
export class GrandStaffComponent implements OnChanges {
    @Input() lesson: LessonDTO | null = null;
    @Input() activeNotes: number[] = [];
    @Input() currentMeasureIndex = 0;
    @Input() currentNoteIndex = -1;
    @Input() playheadPosition = -1;
    @Input() playheadBeatPosition = -1; // Smooth playhead position in beats
    @Input() highlightNoteIndex = -1; // Only highlight note at this global index
    @Input() isPlaying = false;

    staffWidth = 900;
    staffHeight = 80;
    measuresPerLine = 4; // Fixed number of measures per line for even bars

    // Signals for reactive updates
    private _staffLines = signal<StaffLine[]>([]);
    private _currentMeasure = signal<MeasureDTO | null>(null);
    private _activeNotes = signal<number[]>([]);

    staffLines = this._staffLines.asReadonly();
    currentMeasure = this._currentMeasure.asReadonly();

    // Filter active notes by clef range
    trebleActiveNotes = computed(() =>
        this._activeNotes().filter(n => n >= 60)
    );

    bassActiveNotes = computed(() =>
        this._activeNotes().filter(n => n < 60)
    );

    ngOnChanges(changes: SimpleChanges) {
        if (changes['activeNotes']) {
            this._activeNotes.set(this.activeNotes);
        }
        if (changes['lesson'] || changes['currentMeasureIndex']) {
            this.processLesson();
        }
    }

    private processLesson() {
        if (!this.lesson) {
            this._staffLines.set([]);
            this._currentMeasure.set(null);
            return;
        }

        const measures = this.lesson.measures;
        const currentMeasure = measures[this.currentMeasureIndex] || measures[0];
        this._currentMeasure.set(currentMeasure);

        // Split into lines with paired treble/bass staves
        const lines = this.splitIntoLines();
        this._staffLines.set(lines);
    }

    private splitIntoLines(): StaffLine[] {
        if (!this.lesson) return [];

        const lines: StaffLine[] = [];
        let currentLine: { treble: StaffNote[]; bass: StaffNote[]; startIdx: number; beatOffset: number } = {
            treble: [],
            bass: [],
            startIdx: 0,
            beatOffset: 0
        };
        let globalIdx = 0;
        let measureOffset = 0; // Cumulative beats from previous measures
        let measuresInCurrentLine = 0;

        for (let measureIdx = 0; measureIdx < this.lesson.measures.length; measureIdx++) {
            const measure = this.lesson.measures[measureIdx];
            const noteCount = measure.notes.length;

            // Check if we've reached the max measures per line
            // If so, finalize current line first (but only if it has content)
            if (measuresInCurrentLine >= this.measuresPerLine && currentLine.treble.length > 0) {
                // Finalize current line
                lines.push({
                    trebleNotes: currentLine.treble,
                    bassNotes: currentLine.bass,
                    globalStartIndex: currentLine.startIdx,
                    globalBeatOffset: currentLine.beatOffset,
                    isLastLine: false
                });

                // Start new line
                currentLine = {
                    treble: [],
                    bass: [],
                    startIdx: globalIdx,
                    beatOffset: measureOffset
                };
                measuresInCurrentLine = 0;
            }

            // Track fallback position for notes without start_beat (YAML lessons)
            let fallbackBeatPosition = measureOffset;
            let maxBeatInMeasure = measureOffset;

            // Add all notes from this measure to current line
            for (let noteIdx = 0; noteIdx < noteCount; noteIdx++) {
                const note = measure.notes[noteIdx];
                const staffNote = this.convertToStaffNote(note);

                if (staffNote) {
                    staffNote.measureEnd = noteIdx === noteCount - 1;

                    // Use start_beat from note data if available (MXL files)
                    // This allows simultaneous notes (same beat) to have same position
                    // Falls back to sequential calculation (YAML lessons)
                    const noteStartBeat = getStartBeat(note);
                    let beatPosition: number;

                    if (noteStartBeat !== undefined) {
                        // MXL file: start_beat is relative to measure, add offset
                        beatPosition = measureOffset + noteStartBeat;
                    } else {
                        // YAML lesson: no start_beat, use sequential calculation
                        beatPosition = fallbackBeatPosition;
                        fallbackBeatPosition += staffNote.durationValue ?? 1;
                    }

                    staffNote.beatPosition = beatPosition;
                    maxBeatInMeasure = Math.max(maxBeatInMeasure, beatPosition + (staffNote.durationValue ?? 1));

                    const isTreble = this.isTrebleNote(note, staffNote);
                    const isBass = this.isBassNote(note, staffNote);

                    // Determine rest placement based on hand property (matching scrolling view)
                    // Right hand rests go on treble, left hand rests go on bass
                    const restHand = 'hand' in note ? (note as { hand: string }).hand : 'right';
                    const isRightHandRest = staffNote.isRest && restHand === 'right';
                    const isLeftHandRest = staffNote.isRest && restHand === 'left';

                    // Add to treble staff (visible if treble note OR right-hand rest)
                    currentLine.treble.push({
                        ...staffNote,
                        hidden: !isTreble && !isRightHandRest,
                        isRest: isRightHandRest // Only show rest if it's right-hand
                    });

                    // Add to bass staff (visible if bass note OR left-hand rest)
                    currentLine.bass.push({
                        ...staffNote,
                        hidden: !isBass && !isLeftHandRest,
                        isRest: isLeftHandRest // Only show rest if it's left-hand
                    });
                }

                globalIdx++;
            }

            // Update measure offset for next measure
            measureOffset = maxBeatInMeasure;

            // Count this measure
            measuresInCurrentLine++;
        }

        // Don't forget the last line
        if (currentLine.treble.length > 0) {
            lines.push({
                trebleNotes: currentLine.treble,
                bassNotes: currentLine.bass,
                globalStartIndex: currentLine.startIdx,
                globalBeatOffset: currentLine.beatOffset,
                isLastLine: true
            });
        }

        // Mark the actual last line
        if (lines.length > 0) {
            lines.forEach((line, idx) => {
                line.isLastLine = idx === lines.length - 1;
            });
        }

        return lines;
    }

    private isTrebleNote(note: NoteDTO, staffNote: StaffNote): boolean {
        if (staffNote.isRest) return false;

        // Check explicit hand assignment
        if ('hand' in note) {
            if (note.hand === 'right') return true;
            if (note.hand === 'left') return false;
        }

        // Check explicit staff assignment
        if ('staff' in note) {
            if ((note as any).staff === 0) return true;
            if ((note as any).staff === 1) return false;
        }

        // Auto-assign based on MIDI pitch (split at Middle C = 60)
        const midiValues = Array.isArray(staffNote.midi)
            ? staffNote.midi
            : [staffNote.midi];

        return midiValues.some(m => m >= 60);
    }

    private isBassNote(note: NoteDTO, staffNote: StaffNote): boolean {
        if (staffNote.isRest) return false;

        // Check explicit hand assignment
        if ('hand' in note) {
            if (note.hand === 'left') return true;
            if (note.hand === 'right') return false;
        }

        // Check explicit staff assignment
        if ('staff' in note) {
            if ((note as any).staff === 1) return true;
            if ((note as any).staff === 0) return false;
        }

        // Auto-assign based on MIDI pitch
        const midiValues = Array.isArray(staffNote.midi)
            ? staffNote.midi
            : [staffNote.midi];

        return midiValues.some(m => m < 60);
    }

    private convertToStaffNote(note: NoteDTO): StaffNote | null {
        if (isRestNote(note)) {
            const rest = note as RestNoteDTO;
            return {
                midi: 0,
                duration: this.durationToType(rest.duration),
                durationValue: rest.duration,
                isRest: true
            };
        }

        if (isSingleNote(note)) {
            const single = note as SingleNoteDTO;
            return {
                midi: single.midi,
                duration: this.durationToType(single.duration),
                durationValue: single.duration
            };
        }

        if (isChordNote(note)) {
            const chord = note as ChordNoteDTO;
            return {
                midi: chord.midi,
                duration: this.durationToType(chord.duration),
                durationValue: chord.duration
            };
        }

        return null;
    }

    private durationToType(duration: number): string {
        if (duration >= 4) return 'whole';
        if (duration >= 2) return 'half';
        if (duration >= 1) return 'quarter';
        if (duration >= 0.5) return 'eighth';
        return 'sixteenth';
    }
}
