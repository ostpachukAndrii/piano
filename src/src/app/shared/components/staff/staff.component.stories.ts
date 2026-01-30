import type { Meta, StoryObj } from '@storybook/angular';
import { StaffComponent, StaffNote } from './staff.component';

const meta: Meta<StaffComponent> = {
    title: 'Components/Staff',
    component: StaffComponent,
    tags: ['autodocs'],
    argTypes: {
        width: { control: { type: 'range', min: 400, max: 1200, step: 50 } },
        height: { control: { type: 'range', min: 60, max: 150, step: 10 } },
        clef: { control: 'radio', options: ['treble', 'bass'] },
        currentNoteIndex: { control: { type: 'number', min: -1, max: 20 } },
        playheadPosition: { control: { type: 'number', min: -1, max: 20 } },
        isPlaying: { control: 'boolean' },
        globalNoteOffset: { control: { type: 'number', min: 0, max: 20 } },
        isLastLine: { control: 'boolean' },
    },
};

export default meta;
type Story = StoryObj<StaffComponent>;

// Mock note data
const cMajorScale: StaffNote[] = [
    { midi: 60, duration: 'quarter' },  // C4
    { midi: 62, duration: 'quarter' },  // D4
    { midi: 64, duration: 'quarter' },  // E4
    { midi: 65, duration: 'quarter', measureEnd: true },  // F4
    { midi: 67, duration: 'quarter' },  // G4
    { midi: 69, duration: 'quarter' },  // A4
    { midi: 71, duration: 'quarter' },  // B4
    { midi: 72, duration: 'quarter', measureEnd: true },  // C5
];

const bassNotes: StaffNote[] = [
    { midi: 48, duration: 'quarter' },  // C3
    { midi: 50, duration: 'quarter' },  // D3
    { midi: 52, duration: 'quarter' },  // E3
    { midi: 53, duration: 'quarter', measureEnd: true },  // F3
    { midi: 55, duration: 'quarter' },  // G3
    { midi: 57, duration: 'quarter' },  // A3
    { midi: 59, duration: 'quarter' },  // B3
    { midi: 60, duration: 'quarter', measureEnd: true },  // C4
];

const mixedDurations: StaffNote[] = [
    { midi: 60, duration: 'whole' },
    { midi: 64, duration: 'half', measureEnd: true },
    { midi: 67, duration: 'half' },
    { midi: 72, duration: 'quarter' },
    { midi: 71, duration: 'quarter' },
    { midi: 69, duration: 'eighth' },
    { midi: 67, duration: 'eighth', measureEnd: true },
];

const chord: StaffNote[] = [
    { midi: [60, 64, 67], duration: 'half' },  // C Major chord
    { midi: [62, 65, 69], duration: 'half', measureEnd: true },  // D minor chord
    { midi: [64, 67, 71], duration: 'quarter' },  // E minor chord
    { midi: [65, 69, 72], duration: 'quarter', measureEnd: true },  // F Major chord
];

const withRests: StaffNote[] = [
    { midi: 60, duration: 'quarter' },
    { midi: 0, duration: 'quarter', isRest: true },
    { midi: 64, duration: 'quarter' },
    { midi: 0, duration: 'quarter', isRest: true, measureEnd: true },
    { midi: 67, duration: 'half' },
    { midi: 0, duration: 'half', isRest: true, measureEnd: true },
];

const happyBirthday: StaffNote[] = [
    { midi: 67, duration: 'eighth' },   // G4 - Hap
    { midi: 67, duration: 'eighth' },   // G4 - py
    { midi: 69, duration: 'quarter' },  // A4 - birth
    { midi: 67, duration: 'quarter' },  // G4 - day
    { midi: 72, duration: 'quarter' },  // C5 - to
    { midi: 71, duration: 'half', measureEnd: true },     // B4 - you
    { midi: 67, duration: 'eighth' },   // G4 - Hap
    { midi: 67, duration: 'eighth' },   // G4 - py
    { midi: 69, duration: 'quarter' },  // A4 - birth
    { midi: 67, duration: 'quarter' },  // G4 - day
    { midi: 74, duration: 'quarter' },  // D5 - to
    { midi: 72, duration: 'half', measureEnd: true },     // C5 - you
];

// Stories
export const TrebleClef: Story = {
    args: {
        width: 900,
        height: 80,
        clef: 'treble',
        notes: cMajorScale,
        activeNotes: [],
        currentNoteIndex: -1,
        playheadPosition: -1,
        isPlaying: false,
        isLastLine: true,
    },
};

export const BassClef: Story = {
    args: {
        width: 900,
        height: 80,
        clef: 'bass',
        notes: bassNotes,
        activeNotes: [],
        currentNoteIndex: -1,
        playheadPosition: -1,
        isPlaying: false,
        isLastLine: true,
    },
};

export const MixedDurations: Story = {
    args: {
        width: 900,
        height: 80,
        clef: 'treble',
        notes: mixedDurations,
        activeNotes: [],
        currentNoteIndex: -1,
        isLastLine: true,
    },
};

export const Chords: Story = {
    args: {
        width: 900,
        height: 80,
        clef: 'treble',
        notes: chord,
        activeNotes: [],
        currentNoteIndex: -1,
        isLastLine: true,
    },
};

export const WithRests: Story = {
    args: {
        width: 900,
        height: 80,
        clef: 'treble',
        notes: withRests,
        activeNotes: [],
        currentNoteIndex: -1,
        isLastLine: true,
    },
};

export const HappyBirthday: Story = {
    args: {
        width: 900,
        height: 80,
        clef: 'treble',
        notes: happyBirthday,
        activeNotes: [],
        currentNoteIndex: -1,
        isLastLine: true,
    },
};

export const WithCurrentNote: Story = {
    args: {
        width: 900,
        height: 80,
        clef: 'treble',
        notes: cMajorScale,
        activeNotes: [],
        currentNoteIndex: 3,
        playheadPosition: -1,
        isPlaying: false,
        isLastLine: true,
    },
};

export const WithPlayhead: Story = {
    args: {
        width: 900,
        height: 80,
        clef: 'treble',
        notes: cMajorScale,
        activeNotes: [],
        currentNoteIndex: -1,
        playheadPosition: 5,
        isPlaying: true,
        isLastLine: true,
    },
};

export const WithActiveNotes: Story = {
    args: {
        width: 900,
        height: 80,
        clef: 'treble',
        notes: cMajorScale,
        activeNotes: [64, 67],  // E4 and G4 are being played
        currentNoteIndex: 2,
        isLastLine: true,
    },
};

export const NarrowWidth: Story = {
    args: {
        width: 500,
        height: 80,
        clef: 'treble',
        notes: cMajorScale.slice(0, 4),
        activeNotes: [],
        currentNoteIndex: -1,
        isLastLine: true,
    },
};

export const EmptyStaff: Story = {
    args: {
        width: 900,
        height: 80,
        clef: 'treble',
        notes: [],
        activeNotes: [],
        currentNoteIndex: -1,
        isLastLine: false,
    },
};
