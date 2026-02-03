import type { Meta, StoryObj } from '@storybook/angular';
import { KeySignatureComponent } from './key-signature.component';
import { applicationConfig } from '@storybook/angular';
import { provideZoneChangeDetection } from '@angular/core';

const meta: Meta<KeySignatureComponent> = {
    title: 'Notation/KeySignature',
    component: KeySignatureComponent,
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
        accidentals: {
            control: { type: 'range', min: -7, max: 7, step: 1 },
            description: 'Number of sharps (positive) or flats (negative)'
        },
        grandStaff: {
            control: 'boolean',
            description: 'Show on grand staff (treble + bass)'
        },
        clef: {
            control: { type: 'select' },
            options: ['treble', 'bass'],
            description: 'Which staff to show (if not grand staff)'
        },
        showStaff: {
            control: 'boolean',
            description: 'Show staff lines for context'
        },
        color: {
            control: 'color',
            description: 'Accidental color'
        },
        fontSize: {
            control: { type: 'range', min: 12, max: 28, step: 2 },
            description: 'Symbol font size'
        }
    }
};

export default meta;
type Story = StoryObj<KeySignatureComponent>;

// C Major (no accidentals)
export const CMajor: Story = {
    name: 'C Major (No Accidentals)',
    args: {
        accidentals: 0,
        grandStaff: true,
        showStaff: true,
        width: 150,
        height: 200
    }
};

// Sharp keys
export const GMajor: Story = {
    name: 'G Major (1 Sharp)',
    args: {
        accidentals: 1,
        grandStaff: true,
        showStaff: true,
        width: 150,
        height: 200
    }
};

export const DMajor: Story = {
    name: 'D Major (2 Sharps)',
    args: {
        accidentals: 2,
        grandStaff: true,
        showStaff: true,
        width: 150,
        height: 200
    }
};

export const AMajor: Story = {
    name: 'A Major (3 Sharps)',
    args: {
        accidentals: 3,
        grandStaff: true,
        showStaff: true,
        width: 150,
        height: 200
    }
};

export const EMajor: Story = {
    name: 'E Major (4 Sharps)',
    args: {
        accidentals: 4,
        grandStaff: true,
        showStaff: true,
        width: 150,
        height: 200
    }
};

export const FSharpMajor: Story = {
    name: 'F# Major (6 Sharps)',
    args: {
        accidentals: 6,
        grandStaff: true,
        showStaff: true,
        width: 150,
        height: 200
    }
};

// Flat keys
export const FMajor: Story = {
    name: 'F Major (1 Flat)',
    args: {
        accidentals: -1,
        grandStaff: true,
        showStaff: true,
        width: 150,
        height: 200
    }
};

export const BbMajor: Story = {
    name: 'Bb Major (2 Flats)',
    args: {
        accidentals: -2,
        grandStaff: true,
        showStaff: true,
        width: 150,
        height: 200
    }
};

export const EbMajor: Story = {
    name: 'Eb Major (3 Flats)',
    args: {
        accidentals: -3,
        grandStaff: true,
        showStaff: true,
        width: 150,
        height: 200
    }
};

export const AbMajor: Story = {
    name: 'Ab Major (4 Flats)',
    args: {
        accidentals: -4,
        grandStaff: true,
        showStaff: true,
        width: 150,
        height: 200
    }
};

export const GbMajor: Story = {
    name: 'Gb Major (6 Flats)',
    args: {
        accidentals: -6,
        grandStaff: true,
        showStaff: true,
        width: 150,
        height: 200
    }
};

// Single staff examples
export const TrebleStaff3Sharps: Story = {
    name: 'Treble Staff - 3 Sharps',
    args: {
        accidentals: 3,
        grandStaff: false,
        clef: 'treble',
        showStaff: true,
        width: 150,
        height: 100
    }
};

export const BassStaff2Flats: Story = {
    name: 'Bass Staff - 2 Flats',
    args: {
        accidentals: -2,
        grandStaff: false,
        clef: 'bass',
        showStaff: true,
        width: 150,
        height: 100
    }
};

// Maximum accidentals
export const AllSharps: Story = {
    name: 'All 7 Sharps',
    args: {
        accidentals: 7,
        grandStaff: true,
        showStaff: true,
        width: 150,
        height: 200
    }
};

export const AllFlats: Story = {
    name: 'All 7 Flats',
    args: {
        accidentals: -7,
        grandStaff: true,
        showStaff: true,
        width: 150,
        height: 200
    }
};

// Custom styling
export const GoldAccidentals: Story = {
    name: 'Gold Accidentals',
    args: {
        accidentals: 3,
        grandStaff: true,
        showStaff: true,
        color: '#fbbf24',
        width: 150,
        height: 200
    }
};

export const LargeKeySignature: Story = {
    name: 'Large Font Size',
    args: {
        accidentals: 4,
        grandStaff: true,
        showStaff: true,
        fontSize: 24,
        width: 180,
        height: 200
    }
};

// Circle of Fifths comparison
export const CircleOfFifths: Story = {
    name: 'Circle of Fifths (use browser)',
    args: {
        accidentals: 0,
        grandStaff: true,
        showStaff: true,
        width: 100,
        height: 150
    },
    render: (args) => ({
        props: args,
        template: `
            <div style="display: flex; gap: 20px; flex-wrap: wrap; max-width: 800px;">
                <div style="text-align: center;">
                    <app-key-signature [accidentals]="0" [grandStaff]="true" [showStaff]="true" [width]="100" [height]="150"></app-key-signature>
                    <div style="color: #888; font-size: 11px; margin-top: 4px;">C Major</div>
                </div>
                <div style="text-align: center;">
                    <app-key-signature [accidentals]="1" [grandStaff]="true" [showStaff]="true" [width]="100" [height]="150"></app-key-signature>
                    <div style="color: #888; font-size: 11px; margin-top: 4px;">G Major</div>
                </div>
                <div style="text-align: center;">
                    <app-key-signature [accidentals]="2" [grandStaff]="true" [showStaff]="true" [width]="100" [height]="150"></app-key-signature>
                    <div style="color: #888; font-size: 11px; margin-top: 4px;">D Major</div>
                </div>
                <div style="text-align: center;">
                    <app-key-signature [accidentals]="-1" [grandStaff]="true" [showStaff]="true" [width]="100" [height]="150"></app-key-signature>
                    <div style="color: #888; font-size: 11px; margin-top: 4px;">F Major</div>
                </div>
                <div style="text-align: center;">
                    <app-key-signature [accidentals]="-2" [grandStaff]="true" [showStaff]="true" [width]="100" [height]="150"></app-key-signature>
                    <div style="color: #888; font-size: 11px; margin-top: 4px;">Bb Major</div>
                </div>
            </div>
        `
    })
};

// Interactive playground
export const Playground: Story = {
    name: 'Playground',
    args: {
        accidentals: 2,
        grandStaff: true,
        clef: 'treble',
        showStaff: true,
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 18,
        width: 150,
        height: 250
    }
};
