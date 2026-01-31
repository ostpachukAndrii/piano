import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { GrandStaffComponent } from './grand-staff.component';
import { StaffComponent } from '../../shared/components/staff/staff.component';
import { LessonDTO } from '../../core/models/lesson.model';
import { RestNoteDTO, SingleNoteDTO } from '../../core/models/note.model';

const meta: Meta<GrandStaffComponent> = {
    title: 'Components/GrandStaff',
    component: GrandStaffComponent,
    tags: ['autodocs'],
    decorators: [
        moduleMetadata({
            imports: [CommonModule, StaffComponent],
        }),
    ],
    argTypes: {
        currentMeasureIndex: { control: { type: 'number', min: 0, max: 10 } },
        currentNoteIndex: { control: { type: 'number', min: -1, max: 30 } },
        playheadPosition: { control: { type: 'number', min: -1, max: 30 } },
        isPlaying: { control: 'boolean' },
    },
};

export default meta;
type Story = StoryObj<GrandStaffComponent>;

// Helper to create single notes (matches SingleNoteDTO)
function note(midi: number, duration: number, hand: 'right' | 'left'): SingleNoteDTO {
    return { midi, duration, hand };
}

// Helper to create rests (matches RestNoteDTO)
function rest(duration: number, hand: 'right' | 'left' = 'right'): RestNoteDTO {
    return { duration, hand };
}

// Mock lesson data - right hand only (treble)
const rightHandLesson: LessonDTO = {
    title: 'C Major Scale (Right Hand)',
    description: 'Practice the C major scale with right hand',
    tempo: 120,
    time_signature: '4/4',
    key_signature: 'C',
    total_beats: 8,
    total_seconds: 4,
    measures: [
        {
            number: 1,
            notes: [
                note(60, 1, 'right'),
                note(62, 1, 'right'),
                note(64, 1, 'right'),
                note(65, 1, 'right'),
            ]
        },
        {
            number: 2,
            notes: [
                note(67, 1, 'right'),
                note(69, 1, 'right'),
                note(71, 1, 'right'),
                note(72, 1, 'right'),
            ]
        },
    ]
};

// Mock lesson data - left hand only (bass)
const leftHandLesson: LessonDTO = {
    title: 'C Major Scale (Left Hand)',
    description: 'Practice the C major scale with left hand',
    tempo: 120,
    time_signature: '4/4',
    key_signature: 'C',
    total_beats: 8,
    total_seconds: 4,
    measures: [
        {
            number: 1,
            notes: [
                note(48, 1, 'left'),
                note(50, 1, 'left'),
                note(52, 1, 'left'),
                note(53, 1, 'left'),
            ]
        },
        {
            number: 2,
            notes: [
                note(55, 1, 'left'),
                note(57, 1, 'left'),
                note(59, 1, 'left'),
                note(60, 1, 'left'),
            ]
        },
    ]
};

// Mock lesson data - both hands
const bothHandsLesson: LessonDTO = {
    title: 'Simple Two-Hand Exercise',
    description: 'Practice coordinating both hands',
    tempo: 100,
    time_signature: '4/4',
    key_signature: 'C',
    total_beats: 8,
    total_seconds: 4.8,
    measures: [
        {
            number: 1,
            notes: [
                note(60, 1, 'right'),
                note(48, 1, 'left'),
                note(64, 1, 'right'),
                note(52, 1, 'left'),
            ]
        },
        {
            number: 2,
            notes: [
                note(67, 1, 'right'),
                note(55, 1, 'left'),
                note(72, 1, 'right'),
                note(60, 1, 'left'),
            ]
        },
    ]
};

// Happy Birthday lesson
const happyBirthdayLesson: LessonDTO = {
    title: 'Happy Birthday',
    description: 'Learn to play Happy Birthday',
    tempo: 120,
    time_signature: '3/4',
    key_signature: 'G',
    total_beats: 18,
    total_seconds: 9,
    measures: [
        {
            number: 1,
            notes: [
                note(67, 0.5, 'right'),
                note(67, 0.5, 'right'),
                note(69, 1, 'right'),
                note(67, 1, 'right'),
            ]
        },
        {
            number: 2,
            notes: [
                note(72, 1, 'right'),
                note(71, 2, 'right'),
            ]
        },
        {
            number: 3,
            notes: [
                note(67, 0.5, 'right'),
                note(67, 0.5, 'right'),
                note(69, 1, 'right'),
                note(67, 1, 'right'),
            ]
        },
        {
            number: 4,
            notes: [
                note(74, 1, 'right'),
                note(72, 2, 'right'),
            ]
        },
        {
            number: 5,
            notes: [
                note(67, 0.5, 'right'),
                note(67, 0.5, 'right'),
                note(79, 1, 'right'),
                note(76, 1, 'right'),
            ]
        },
        {
            number: 6,
            notes: [
                note(72, 1, 'right'),
                note(71, 1, 'right'),
                note(69, 1, 'right'),
            ]
        },
    ]
};

// Longer lesson to test multi-line
const longLesson: LessonDTO = {
    title: 'Extended Exercise',
    description: 'Many notes to test multi-line layout',
    tempo: 120,
    time_signature: '4/4',
    key_signature: 'C',
    total_beats: 32,
    total_seconds: 16,
    measures: Array.from({ length: 8 }, (_, i) => ({
        number: i + 1,
        notes: [
            note(60 + (i % 8), 1, 'right'),
            note(62 + (i % 8), 1, 'right'),
            note(64 + (i % 8), 1, 'right'),
            note(65 + (i % 8), 1, 'right'),
        ]
    }))
};

// Lesson with chords
const chordLesson: LessonDTO = {
    title: 'C Major Chord',
    description: 'Practice C major chord',
    tempo: 80,
    time_signature: '4/4',
    key_signature: 'C',
    total_beats: 8,
    total_seconds: 6,
    measures: [
        {
            number: 1,
            notes: [
                { midi: [60, 64, 67], duration: 2, hand: 'right' }, // C major chord
                { midi: [48, 52, 55], duration: 2, hand: 'left' },  // C major chord (bass)
            ]
        },
        {
            number: 2,
            notes: [
                { midi: [62, 65, 69], duration: 2, hand: 'right' }, // D minor chord
                { midi: [50, 53, 57], duration: 2, hand: 'left' },  // D minor chord (bass)
            ]
        },
    ]
};

// Lesson with rests
const restLesson: LessonDTO = {
    title: 'Exercise with Rests',
    description: 'Practice timing with rests',
    tempo: 100,
    time_signature: '4/4',
    key_signature: 'C',
    total_beats: 8,
    total_seconds: 4.8,
    measures: [
        {
            number: 1,
            notes: [
                note(60, 1, 'right'),
                rest(1), // rest
                note(64, 1, 'right'),
                rest(1), // rest
            ]
        },
        {
            number: 2,
            notes: [
                note(67, 2, 'right'),
                rest(2), // half rest
            ]
        },
    ]
};

// All rest types lesson - shows each rest duration clearly
const allRestTypesLesson: LessonDTO = {
    title: 'All Rest Types Demo',
    description: 'Whole, half, quarter, and eighth rests',
    tempo: 60,
    time_signature: '4/4',
    key_signature: 'C',
    total_beats: 16,
    total_seconds: 16,
    measures: [
        {
            number: 1,
            notes: [
                // Whole rest (4 beats) - rectangle hanging from 4th line
                rest(4),
            ]
        },
        {
            number: 2,
            notes: [
                // Half rests (2 beats each) - rectangle on 3rd line
                rest(2),
                rest(2),
            ]
        },
        {
            number: 3,
            notes: [
                // Quarter rests (1 beat each) - zigzag symbol
                rest(1),
                rest(1),
                rest(1),
                rest(1),
            ]
        },
        {
            number: 4,
            notes: [
                // Eighth rests (0.5 beats each) - slanted with flag
                rest(0.5),
                rest(0.5),
                rest(0.5),
                rest(0.5),
                rest(0.5),
                rest(0.5),
                rest(0.5),
                rest(0.5),
            ]
        },
    ]
};

// Simple lesson: 1 whole, 2 halves, 4 quarters, 8 eighths - all fit in 4 measures
const allNoteTypesLesson: LessonDTO = {
    title: 'All Note Types Demo',
    description: '1 whole note, 2 half notes, 4 quarter notes, 8 eighth notes',
    tempo: 60,
    time_signature: '4/4',
    key_signature: 'C',
    total_beats: 16,
    total_seconds: 16,
    measures: [
        {
            number: 1,
            notes: [
                // 1 Whole note (4 beats) - hollow oval, no stem
                note(60, 4, 'right'), // C4
            ]
        },
        {
            number: 2,
            notes: [
                // 2 Half notes (2 beats each) - hollow oval with stem
                note(62, 2, 'right'), // D4
                note(64, 2, 'right'), // E4
            ]
        },
        {
            number: 3,
            notes: [
                // 4 Quarter notes (1 beat each) - filled with stem
                note(65, 1, 'right'), // F4
                note(67, 1, 'right'), // G4
                note(69, 1, 'right'), // A4
                note(71, 1, 'right'), // B4
            ]
        },
        {
            number: 4,
            notes: [
                // 8 Eighth notes (0.5 beats each) - filled with stem and flag
                note(72, 0.5, 'right'), // C5
                note(74, 0.5, 'right'), // D5
                note(76, 0.5, 'right'), // E5
                note(77, 0.5, 'right'), // F5
                note(79, 0.5, 'right'), // G5
                note(77, 0.5, 'right'), // F5
                note(76, 0.5, 'right'), // E5
                note(74, 0.5, 'right'), // D5
            ]
        },
    ]
};

// Mixed durations lesson - shows proportional spacing clearly
const mixedDurationsLesson: LessonDTO = {
    title: 'Mixed Durations',
    description: 'Shows proportional spacing with mixed note values',
    tempo: 90,
    time_signature: '4/4',
    key_signature: 'C',
    total_beats: 12,
    total_seconds: 8,
    measures: [
        {
            number: 1,
            notes: [
                // Mix of durations in one measure
                note(60, 2, 'right'),    // Half note - takes more space
                note(64, 1, 'right'),    // Quarter note
                note(67, 0.5, 'right'),  // Eighth note - takes less space
                note(69, 0.5, 'right'),  // Eighth note
            ]
        },
        {
            number: 2,
            notes: [
                // Another mix
                note(72, 1, 'right'),    // Quarter
                note(71, 0.5, 'right'),  // Eighth
                note(69, 0.5, 'right'),  // Eighth
                note(67, 2, 'right'),    // Half
            ]
        },
        {
            number: 3,
            notes: [
                // Dotted rhythm effect (without actual dots)
                note(65, 1.5, 'right'),  // Dotted quarter (shown as quarter)
                note(64, 0.5, 'right'),  // Eighth
                note(62, 1, 'right'),    // Quarter
                note(60, 1, 'right'),    // Quarter
            ]
        },
    ]
};

// Stories
export const RightHandOnly: Story = {
    args: {
        lesson: rightHandLesson,
        activeNotes: [],
        currentMeasureIndex: 0,
        currentNoteIndex: -1,
        playheadPosition: -1,
        isPlaying: false,
    },
};

export const LeftHandOnly: Story = {
    args: {
        lesson: leftHandLesson,
        activeNotes: [],
        currentMeasureIndex: 0,
        currentNoteIndex: -1,
        playheadPosition: -1,
        isPlaying: false,
    },
};

export const BothHands: Story = {
    args: {
        lesson: bothHandsLesson,
        activeNotes: [],
        currentMeasureIndex: 0,
        currentNoteIndex: -1,
        playheadPosition: -1,
        isPlaying: false,
    },
};

export const HappyBirthday: Story = {
    args: {
        lesson: happyBirthdayLesson,
        activeNotes: [],
        currentMeasureIndex: 0,
        currentNoteIndex: -1,
        playheadPosition: -1,
        isPlaying: false,
    },
};

export const LongLessonMultiLine: Story = {
    args: {
        lesson: longLesson,
        activeNotes: [],
        currentMeasureIndex: 0,
        currentNoteIndex: -1,
        playheadPosition: -1,
        isPlaying: false,
    },
};

export const WithChords: Story = {
    args: {
        lesson: chordLesson,
        activeNotes: [],
        currentMeasureIndex: 0,
        currentNoteIndex: -1,
        playheadPosition: -1,
        isPlaying: false,
    },
};

export const WithRests: Story = {
    args: {
        lesson: restLesson,
        activeNotes: [],
        currentMeasureIndex: 0,
        currentNoteIndex: -1,
        playheadPosition: -1,
        isPlaying: false,
    },
};

// Comprehensive rest type demonstration
export const AllRestTypes: Story = {
    args: {
        lesson: allRestTypesLesson,
        activeNotes: [],
        currentMeasureIndex: 0,
        currentNoteIndex: -1,
        playheadPosition: -1,
        isPlaying: false,
    },
};

export const WithCurrentNote: Story = {
    args: {
        lesson: rightHandLesson,
        activeNotes: [],
        currentMeasureIndex: 0,
        currentNoteIndex: 2,
        playheadPosition: -1,
        isPlaying: false,
    },
};

export const WithPlayhead: Story = {
    args: {
        lesson: happyBirthdayLesson,
        activeNotes: [],
        currentMeasureIndex: 1,
        currentNoteIndex: -1,
        playheadPosition: 5,
        isPlaying: true,
    },
};

export const WithActiveNotes: Story = {
    args: {
        lesson: rightHandLesson,
        activeNotes: [64, 67],
        currentMeasureIndex: 0,
        currentNoteIndex: 2,
        playheadPosition: -1,
        isPlaying: false,
    },
};

export const NoLesson: Story = {
    args: {
        lesson: null,
        activeNotes: [],
        currentMeasureIndex: 0,
        currentNoteIndex: -1,
        playheadPosition: -1,
        isPlaying: false,
    },
};

// Comprehensive note type demonstration
export const AllNoteTypes: Story = {
    args: {
        lesson: allNoteTypesLesson,
        activeNotes: [],
        currentMeasureIndex: 0,
        currentNoteIndex: -1,
        playheadPosition: -1,
        isPlaying: false,
    },
};

// Shows proportional spacing with mixed durations
export const MixedDurations: Story = {
    args: {
        lesson: mixedDurationsLesson,
        activeNotes: [],
        currentMeasureIndex: 0,
        currentNoteIndex: -1,
        playheadPosition: -1,
        isPlaying: false,
    },
};
