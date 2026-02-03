import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MeasureDTO } from '../../../../core/models/lesson.model';
import {
    NoteDTO,
    ChordNoteDTO,
    SingleNoteDTO,
    isChordNote,
    isRestNote,
    isSingleNote,
    midiToNoteName,
} from '../../../../core/models/note.model';

@Component({
    selector: 'app-measures-preview',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
    ],
    template: `
        <section class="measures-section">
            <h2>Lesson Content</h2>
            <div class="measures-grid">
                <mat-card
                    class="measure-card"
                    *ngFor="let measure of measures; let i = index">
                    <mat-card-header>
                        <mat-card-title>Measure {{ measure.number }}</mat-card-title>
                        <mat-card-subtitle>{{ measure.notes.length }} notes</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                        <div class="notes-list">
                            <span
                                class="note-chip"
                                *ngFor="let note of measure.notes"
                                [class.rest]="isRest(note)"
                                [class.chord]="isChord(note)">
                                {{ getNoteDisplay(note) }}
                            </span>
                        </div>
                    </mat-card-content>
                </mat-card>
            </div>
        </section>
    `,
    styles: [`
        .measures-section {
            margin-bottom: 2rem;

            h2 {
                margin-bottom: 1rem;
            }
        }

        .measures-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1rem;
        }

        .measure-card {
            .notes-list {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
            }

            .note-chip {
                background: #e3f2fd;
                color: #1565c0;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-family: monospace;
                font-size: 0.85rem;

                &.rest {
                    background: #f5f5f5;
                    color: #666;
                }

                &.chord {
                    background: #e8f5e9;
                    color: #2e7d32;
                }
            }
        }
    `]
})
export class MeasuresPreviewComponent {
    @Input() measures: MeasureDTO[] = [];

    isRest = isRestNote;
    isChord = isChordNote;

    getNoteDisplay(note: NoteDTO): string {
        if (isRestNote(note)) {
            return `Rest (${note.duration})`;
        }
        if (isSingleNote(note)) {
            const single = note as SingleNoteDTO;
            return `${midiToNoteName(single.midi)} (${single.hand})`;
        }
        if (isChordNote(note)) {
            const chord = note as ChordNoteDTO;
            const names = chord.midi.map((m: number) => midiToNoteName(m)).join('+');
            return `${names} (${chord.hand})`;
        }
        return '?';
    }
}
