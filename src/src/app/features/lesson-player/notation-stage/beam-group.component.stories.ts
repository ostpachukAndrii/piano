import type { Meta, StoryObj } from '@storybook/angular';
import { BeamGroupComponent, BeamNoteInput } from './beam-group.component';
import { applicationConfig } from '@storybook/angular';
import { provideZoneChangeDetection } from '@angular/core';

const meta: Meta<BeamGroupComponent> = {
    title: 'Notation/BeamGroup',
    component: BeamGroupComponent,
    decorators: [
        applicationConfig({
            providers: [provideZoneChangeDetection({ eventCoalescing: true })]
        })
    ],
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
        backgrounds: {
            default: 'dark',
            values: [
                { name: 'dark', value: '#0f0f23' },
                { name: 'light', value: '#ffffff' }
            ]
        }
    },
    argTypes: {
        stemUp: {
            control: 'boolean',
            description: 'Stem direction (up or down)'
        },
        hand: {
            control: { type: 'select' },
            options: ['left', 'right'],
            description: 'Hand assignment (affects staff)'
        },
        clef: {
            control: { type: 'select' },
            options: ['treble', 'bass'],
            description: 'Which staff to render on'
        },
        showStaff: {
            control: 'boolean',
            description: 'Show staff lines for context'
        },
        color: {
            control: 'color',
            description: 'Note and beam color'
        },
        noteSpacing: {
            control: { type: 'range', min: 30, max: 100, step: 5 },
            description: 'Horizontal spacing between notes'
        },
        stemLength: {
            control: { type: 'range', min: 30, max: 80, step: 5 },
            description: 'Base stem length'
        }
    }
};

export default meta;
type Story = StoryObj<BeamGroupComponent>;

// Two eighth notes
export const TwoEighthNotes: Story = {
    name: 'Two Eighth Notes',
    args: {
        notes: [
            { midi: 67, duration: 0.5 }, // G4
            { midi: 69, duration: 0.5 }  // A4
        ] as BeamNoteInput[],
        stemUp: true,
        hand: 'right',
        clef: 'treble',
        showStaff: true,
        color: '#ffffff',
        noteSpacing: 60,
        width: 200,
        height: 200
    }
};

// Three eighth notes
export const ThreeEighthNotes: Story = {
    name: 'Three Eighth Notes',
    args: {
        notes: [
            { midi: 64, duration: 0.5 }, // E4
            { midi: 67, duration: 0.5 }, // G4
            { midi: 72, duration: 0.5 }  // C5
        ] as BeamNoteInput[],
        stemUp: true,
        hand: 'right',
        clef: 'treble',
        showStaff: true,
        color: '#ffffff',
        noteSpacing: 60,
        width: 250,
        height: 200
    }
};

// Four eighth notes (maximum per beam)
export const FourEighthNotes: Story = {
    name: 'Four Eighth Notes',
    args: {
        notes: [
            { midi: 60, duration: 0.5 }, // C4
            { midi: 62, duration: 0.5 }, // D4
            { midi: 64, duration: 0.5 }, // E4
            { midi: 65, duration: 0.5 }  // F4
        ] as BeamNoteInput[],
        stemUp: true,
        hand: 'right',
        clef: 'treble',
        showStaff: true,
        color: '#ffffff',
        noteSpacing: 50,
        width: 300,
        height: 200
    }
};

// Sixteenth notes (two beams)
export const SixteenthNotes: Story = {
    name: 'Sixteenth Notes (2 Beams)',
    args: {
        notes: [
            { midi: 67, duration: 0.25 },
            { midi: 69, duration: 0.25 },
            { midi: 71, duration: 0.25 },
            { midi: 72, duration: 0.25 }
        ] as BeamNoteInput[],
        stemUp: true,
        hand: 'right',
        clef: 'treble',
        showStaff: true,
        color: '#ffffff',
        noteSpacing: 40,
        width: 250,
        height: 200
    }
};

// Descending notes
export const DescendingNotes: Story = {
    name: 'Descending Notes',
    args: {
        notes: [
            { midi: 76, duration: 0.5 }, // E5
            { midi: 74, duration: 0.5 }, // D5
            { midi: 72, duration: 0.5 }, // C5
            { midi: 71, duration: 0.5 }  // B4
        ] as BeamNoteInput[],
        stemUp: true,
        hand: 'right',
        clef: 'treble',
        showStaff: true,
        color: '#ffffff',
        noteSpacing: 50,
        width: 300,
        height: 200
    }
};

// Stems down (left hand)
export const StemsDown: Story = {
    name: 'Stems Down (Left Hand)',
    args: {
        notes: [
            { midi: 48, duration: 0.5 }, // C3
            { midi: 50, duration: 0.5 }, // D3
            { midi: 52, duration: 0.5 }  // E3
        ] as BeamNoteInput[],
        stemUp: false,
        hand: 'left',
        clef: 'bass',
        showStaff: true,
        color: '#ffffff',
        noteSpacing: 60,
        width: 250,
        height: 200
    }
};

// Bass clef notes
export const BassClefBeam: Story = {
    name: 'Bass Clef Beam',
    args: {
        notes: [
            { midi: 43, duration: 0.5 }, // G2
            { midi: 45, duration: 0.5 }, // A2
            { midi: 47, duration: 0.5 }, // B2
            { midi: 48, duration: 0.5 }  // C3
        ] as BeamNoteInput[],
        stemUp: false,
        hand: 'left',
        clef: 'bass',
        showStaff: true,
        color: '#ffffff',
        noteSpacing: 50,
        width: 300,
        height: 200
    }
};

// Wide interval beam
export const WideIntervalBeam: Story = {
    name: 'Wide Interval Beam',
    args: {
        notes: [
            { midi: 60, duration: 0.5 }, // C4 (middle C)
            { midi: 72, duration: 0.5 }, // C5 (octave up)
            { midi: 64, duration: 0.5 }  // E4
        ] as BeamNoteInput[],
        stemUp: true,
        hand: 'right',
        clef: 'treble',
        showStaff: true,
        color: '#ffffff',
        noteSpacing: 70,
        stemLength: 60,
        width: 280,
        height: 200
    }
};

// Custom colors
export const GreenBeam: Story = {
    name: 'Green Beam (Correct)',
    args: {
        notes: [
            { midi: 67, duration: 0.5 },
            { midi: 69, duration: 0.5 },
            { midi: 71, duration: 0.5 }
        ] as BeamNoteInput[],
        stemUp: true,
        hand: 'right',
        clef: 'treble',
        showStaff: true,
        color: '#4ade80',
        noteSpacing: 60,
        width: 250,
        height: 200
    }
};

export const RedBeam: Story = {
    name: 'Red Beam (Wrong)',
    args: {
        notes: [
            { midi: 67, duration: 0.5 },
            { midi: 69, duration: 0.5 }
        ] as BeamNoteInput[],
        stemUp: true,
        hand: 'right',
        clef: 'treble',
        showStaff: true,
        color: '#ef4444',
        noteSpacing: 60,
        width: 200,
        height: 200
    }
};

// No staff context
export const NoStaffContext: Story = {
    name: 'No Staff Context',
    args: {
        notes: [
            { midi: 67, duration: 0.5 },
            { midi: 69, duration: 0.5 },
            { midi: 71, duration: 0.5 }
        ] as BeamNoteInput[],
        stemUp: true,
        hand: 'right',
        clef: 'treble',
        showStaff: false,
        color: '#ffffff',
        noteSpacing: 60,
        width: 250,
        height: 200
    }
};

// Interactive playground
export const Playground: Story = {
    name: 'Playground',
    args: {
        notes: [
            { midi: 64, duration: 0.5 },
            { midi: 67, duration: 0.5 },
            { midi: 69, duration: 0.5 },
            { midi: 72, duration: 0.5 }
        ] as BeamNoteInput[],
        stemUp: true,
        hand: 'right',
        clef: 'treble',
        showStaff: true,
        color: '#ffffff',
        noteSpacing: 55,
        stemLength: 50,
        width: 300,
        height: 250
    }
};
