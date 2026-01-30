/**
 * Core models barrel export
 */

export * from './evaluation.model';
export * from './lesson.model';
export * from './midi-event.model';
// Export note.model but exclude midiToNoteName (already in midi-event.model)
export {
    isChordNote,
    isRestNote, isSingleNote
} from './note.model';
export type {
    ChordNoteDTO, NoteDTO, RestNoteDTO, SingleNoteDTO
} from './note.model';

