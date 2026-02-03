import type { Meta, StoryObj } from '@storybook/angular';
import { BarLineComponent } from './bar-line.component';
import { applicationConfig } from '@storybook/angular';
import { provideZoneChangeDetection } from '@angular/core';

const meta: Meta<BarLineComponent> = {
    title: 'Notation/BarLine',
    component: BarLineComponent,
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
        type: {
            control: { type: 'select' },
            options: ['single', 'double', 'final'],
            description: 'Type of bar line'
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
            description: 'Bar line color'
        },
        lineSpacing: {
            control: { type: 'range', min: 8, max: 20, step: 1 },
            description: 'Space between staff lines'
        }
    }
};

export default meta;
type Story = StoryObj<BarLineComponent>;

// Single bar line (most common)
export const SingleBarLine: Story = {
    name: 'Single Bar Line',
    args: {
        type: 'single',
        grandStaff: true,
        showStaff: true,
        color: 'rgba(255, 255, 255, 0.6)',
        width: 60,
        height: 200
    }
};

// Double bar line (section endings)
export const DoubleBarLine: Story = {
    name: 'Double Bar Line',
    args: {
        type: 'double',
        grandStaff: true,
        showStaff: true,
        color: 'rgba(255, 255, 255, 0.8)',
        width: 60,
        height: 200
    }
};

// Final bar line (end of piece)
export const FinalBarLine: Story = {
    name: 'Final Bar Line',
    args: {
        type: 'final',
        grandStaff: true,
        showStaff: true,
        color: 'rgba(255, 255, 255, 0.8)',
        width: 60,
        height: 200
    }
};

// Single staff examples
export const TrebleStaffSingle: Story = {
    name: 'Treble Staff - Single',
    args: {
        type: 'single',
        grandStaff: false,
        clef: 'treble',
        showStaff: true,
        color: 'rgba(255, 255, 255, 0.6)',
        width: 60,
        height: 100
    }
};

export const BassStaffDouble: Story = {
    name: 'Bass Staff - Double',
    args: {
        type: 'double',
        grandStaff: false,
        clef: 'bass',
        showStaff: true,
        color: 'rgba(255, 255, 255, 0.8)',
        width: 60,
        height: 100
    }
};

// Without staff context
export const NoStaffContext: Story = {
    name: 'No Staff Context',
    args: {
        type: 'single',
        grandStaff: true,
        showStaff: false,
        color: '#ffffff',
        width: 60,
        height: 200
    }
};

// Custom colors
export const GoldBarLine: Story = {
    name: 'Gold Bar Line',
    args: {
        type: 'final',
        grandStaff: true,
        showStaff: true,
        color: '#fbbf24',
        width: 60,
        height: 200
    }
};

export const SubtleBarLine: Story = {
    name: 'Subtle Bar Line',
    args: {
        type: 'single',
        grandStaff: true,
        showStaff: true,
        color: 'rgba(255, 255, 255, 0.3)',
        width: 60,
        height: 200
    }
};

// All types comparison
export const AllBarLineTypes: Story = {
    name: 'All Types (use browser)',
    args: {
        type: 'single',
        grandStaff: true,
        showStaff: true,
        color: 'rgba(255, 255, 255, 0.7)',
        width: 60,
        height: 200
    },
    render: (args) => ({
        props: args,
        template: `
            <div style="display: flex; gap: 40px; align-items: flex-start;">
                <div style="text-align: center;">
                    <app-bar-line type="single" [grandStaff]="true" [showStaff]="true"></app-bar-line>
                    <div style="color: #888; font-size: 12px; margin-top: 8px;">Single</div>
                </div>
                <div style="text-align: center;">
                    <app-bar-line type="double" [grandStaff]="true" [showStaff]="true"></app-bar-line>
                    <div style="color: #888; font-size: 12px; margin-top: 8px;">Double</div>
                </div>
                <div style="text-align: center;">
                    <app-bar-line type="final" [grandStaff]="true" [showStaff]="true"></app-bar-line>
                    <div style="color: #888; font-size: 12px; margin-top: 8px;">Final</div>
                </div>
            </div>
        `
    })
};

// Interactive playground
export const Playground: Story = {
    name: 'Playground',
    args: {
        type: 'single',
        grandStaff: true,
        clef: 'treble',
        showStaff: true,
        color: 'rgba(255, 255, 255, 0.7)',
        lineSpacing: 12,
        width: 80,
        height: 250
    }
};
