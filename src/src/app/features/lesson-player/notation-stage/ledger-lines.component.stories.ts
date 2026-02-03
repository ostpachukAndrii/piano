import type { Meta, StoryObj } from '@storybook/angular';
import { LedgerLinesComponent } from './ledger-lines.component';
import { applicationConfig } from '@storybook/angular';
import { provideZoneChangeDetection } from '@angular/core';

const meta: Meta<LedgerLinesComponent> = {
    title: 'Notation/LedgerLines',
    component: LedgerLinesComponent,
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
        midiNote: {
            control: { type: 'range', min: 21, max: 108, step: 1 },
            description: 'MIDI note number (21=A0, 60=C4, 108=C8)'
        },
        clef: {
            control: { type: 'select' },
            options: ['treble', 'bass'],
            description: 'Which staff to render on'
        },
        lineSpacing: {
            control: { type: 'range', min: 8, max: 20, step: 1 },
            description: 'Space between staff lines'
        },
        showNote: {
            control: 'boolean',
            description: 'Show the note head'
        },
        showStaff: {
            control: 'boolean',
            description: 'Show staff lines for context'
        },
        noteColor: {
            control: 'color',
            description: 'Color of the note head'
        },
        lineColor: {
            control: 'color',
            description: 'Color of ledger lines'
        }
    }
};

export default meta;
type Story = StoryObj<LedgerLinesComponent>;

// Treble clef examples
export const TrebleMiddleC: Story = {
    name: 'Treble - Middle C (C4)',
    args: {
        midiNote: 60, // Middle C - 1 ledger line below treble staff
        clef: 'treble',
        showNote: true,
        showStaff: true,
        width: 100,
        height: 200
    }
};

export const TrebleLowA: Story = {
    name: 'Treble - Low A (A3)',
    args: {
        midiNote: 57, // A3 - 3 ledger lines below treble staff
        clef: 'treble',
        showNote: true,
        showStaff: true,
        width: 100,
        height: 200
    }
};

export const TrebleHighA: Story = {
    name: 'Treble - High A (A5)',
    args: {
        midiNote: 81, // A5 - 2 ledger lines above treble staff
        clef: 'treble',
        showNote: true,
        showStaff: true,
        width: 100,
        height: 200
    }
};

export const TrebleHighC: Story = {
    name: 'Treble - High C (C6)',
    args: {
        midiNote: 84, // C6 - 3 ledger lines above treble staff
        clef: 'treble',
        showNote: true,
        showStaff: true,
        width: 100,
        height: 200
    }
};

// Bass clef examples
export const BassMiddleC: Story = {
    name: 'Bass - Middle C (C4)',
    args: {
        midiNote: 60, // Middle C - 1 ledger line above bass staff
        clef: 'bass',
        showNote: true,
        showStaff: true,
        width: 100,
        height: 200
    }
};

export const BassLowE: Story = {
    name: 'Bass - Low E (E2)',
    args: {
        midiNote: 40, // E2 - 2 ledger lines below bass staff
        clef: 'bass',
        showNote: true,
        showStaff: true,
        width: 100,
        height: 200
    }
};

export const BassLowC: Story = {
    name: 'Bass - Low C (C2)',
    args: {
        midiNote: 36, // C2 - 4 ledger lines below bass staff
        clef: 'bass',
        showNote: true,
        showStaff: true,
        width: 100,
        height: 200
    }
};

export const BassHighE: Story = {
    name: 'Bass - High E (E4)',
    args: {
        midiNote: 64, // E4 - 2 ledger lines above bass staff
        clef: 'bass',
        showNote: true,
        showStaff: true,
        width: 100,
        height: 200
    }
};

// Notes that don't need ledger lines (within staff)
export const TrebleNoLedger: Story = {
    name: 'Treble - No Ledger Lines (G4)',
    args: {
        midiNote: 67, // G4 - on treble staff, no ledger lines needed
        clef: 'treble',
        showNote: true,
        showStaff: true,
        width: 100,
        height: 200
    }
};

export const BassNoLedger: Story = {
    name: 'Bass - No Ledger Lines (D3)',
    args: {
        midiNote: 50, // D3 - on bass staff, no ledger lines needed
        clef: 'bass',
        showNote: true,
        showStaff: true,
        width: 100,
        height: 200
    }
};

// Without note (lines only)
export const LinesOnlyTreble: Story = {
    name: 'Lines Only - Middle C',
    args: {
        midiNote: 60,
        clef: 'treble',
        showNote: false,
        showStaff: true,
        lineColor: '#ff6b6b',
        width: 100,
        height: 200
    }
};

// Without staff (lines and note only)
export const NoStaffContext: Story = {
    name: 'No Staff Context',
    args: {
        midiNote: 60,
        clef: 'treble',
        showNote: true,
        showStaff: false,
        width: 100,
        height: 200
    }
};

// Custom colors
export const CustomColors: Story = {
    name: 'Custom Colors',
    args: {
        midiNote: 60,
        clef: 'treble',
        showNote: true,
        showStaff: true,
        noteColor: '#60a5fa',
        lineColor: 'rgba(250, 204, 21, 0.8)',
        width: 100,
        height: 200
    }
};

// Interactive playground
export const Playground: Story = {
    name: 'Playground',
    args: {
        midiNote: 60,
        clef: 'treble',
        lineSpacing: 12,
        showNote: true,
        showStaff: true,
        noteColor: '#4ade80',
        lineColor: 'rgba(255, 255, 255, 0.7)',
        width: 150,
        height: 250
    }
};
