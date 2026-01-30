import { Meta, StoryObj } from '@storybook/angular';
import { BarLineComponent, BarLineType } from './bar-line.component';

const meta: Meta<BarLineComponent> = {
    title: 'Shared/BarLine',
    component: BarLineComponent,
    tags: ['autodocs'],
    argTypes: {
        type: {
            control: 'select',
            options: ['single', 'double', 'end', 'repeat-start', 'repeat-end'],
            description: 'Type of bar line',
        },
        height: {
            control: { type: 'range', min: 30, max: 120, step: 10 },
            description: 'Height of the bar line (staff height)',
        },
        color: {
            control: 'color',
            description: 'Color of the bar line',
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size of the bar line',
        },
    },
};

export default meta;
type Story = StoryObj<BarLineComponent>;

// Default single bar line
export const Single: Story = {
    args: {
        type: 'single',
        height: 60,
        color: '#333333',
        size: 'medium',
    },
};

// Double bar line (section marker)
export const Double: Story = {
    args: {
        type: 'double',
        height: 60,
        color: '#333333',
        size: 'medium',
    },
};

// End bar line (thin + thick)
export const End: Story = {
    args: {
        type: 'end',
        height: 60,
        color: '#333333',
        size: 'medium',
    },
};

// Repeat start (thick + thin + dots)
export const RepeatStart: Story = {
    args: {
        type: 'repeat-start',
        height: 60,
        color: '#333333',
        size: 'medium',
    },
};

// Repeat end (dots + thin + thick)
export const RepeatEnd: Story = {
    args: {
        type: 'repeat-end',
        height: 60,
        color: '#333333',
        size: 'medium',
    },
};

// All types in a row
export const AllTypes: Story = {
    render: () => ({
        template: `
            <div style="display: flex; gap: 40px; align-items: center; padding: 20px; background: #fafafa;">
                <div style="text-align: center;">
                    <app-bar-line type="single" [height]="60"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px;">Single</div>
                </div>
                <div style="text-align: center;">
                    <app-bar-line type="double" [height]="60"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px;">Double</div>
                </div>
                <div style="text-align: center;">
                    <app-bar-line type="end" [height]="60"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px;">End</div>
                </div>
                <div style="text-align: center;">
                    <app-bar-line type="repeat-start" [height]="60"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px;">Repeat Start</div>
                </div>
                <div style="text-align: center;">
                    <app-bar-line type="repeat-end" [height]="60"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px;">Repeat End</div>
                </div>
            </div>
        `,
    }),
};

// Size comparison
export const SizeComparison: Story = {
    render: () => ({
        template: `
            <div style="display: flex; gap: 40px; align-items: flex-end; padding: 20px; background: #fafafa;">
                <div style="text-align: center;">
                    <app-bar-line type="end" [height]="60" size="small"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px;">Small</div>
                </div>
                <div style="text-align: center;">
                    <app-bar-line type="end" [height]="60" size="medium"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px;">Medium</div>
                </div>
                <div style="text-align: center;">
                    <app-bar-line type="end" [height]="60" size="large"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px;">Large</div>
                </div>
            </div>
        `,
    }),
};

// Dark theme (for scrolling player)
export const DarkTheme: Story = {
    render: () => ({
        template: `
            <div style="display: flex; gap: 40px; align-items: center; padding: 20px; background: #1a1a2e;">
                <div style="text-align: center;">
                    <app-bar-line type="single" [height]="60" color="rgba(255,255,255,0.4)"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px; color: white;">Single</div>
                </div>
                <div style="text-align: center;">
                    <app-bar-line type="double" [height]="60" color="rgba(255,255,255,0.4)"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px; color: white;">Double</div>
                </div>
                <div style="text-align: center;">
                    <app-bar-line type="end" [height]="60" color="rgba(255,255,255,0.4)"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px; color: white;">End</div>
                </div>
                <div style="text-align: center;">
                    <app-bar-line type="repeat-start" [height]="60" color="rgba(255,255,255,0.4)"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px; color: white;">Repeat Start</div>
                </div>
                <div style="text-align: center;">
                    <app-bar-line type="repeat-end" [height]="60" color="rgba(255,255,255,0.4)"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px; color: white;">Repeat End</div>
                </div>
            </div>
        `,
    }),
};

// Height variations
export const HeightVariations: Story = {
    render: () => ({
        template: `
            <div style="display: flex; gap: 40px; align-items: flex-end; padding: 20px; background: #fafafa;">
                <div style="text-align: center;">
                    <app-bar-line type="single" [height]="40"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px;">40px</div>
                </div>
                <div style="text-align: center;">
                    <app-bar-line type="single" [height]="60"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px;">60px</div>
                </div>
                <div style="text-align: center;">
                    <app-bar-line type="single" [height]="80"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px;">80px</div>
                </div>
                <div style="text-align: center;">
                    <app-bar-line type="single" [height]="100"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px;">100px</div>
                </div>
            </div>
        `,
    }),
};

// Color variations
export const ColorVariations: Story = {
    render: () => ({
        template: `
            <div style="display: flex; gap: 40px; align-items: center; padding: 20px; background: #fafafa;">
                <div style="text-align: center;">
                    <app-bar-line type="end" [height]="60" color="#000000"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px;">Black</div>
                </div>
                <div style="text-align: center;">
                    <app-bar-line type="end" [height]="60" color="#333333"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px;">Dark Gray</div>
                </div>
                <div style="text-align: center;">
                    <app-bar-line type="end" [height]="60" color="#3B82F6"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px;">Blue</div>
                </div>
                <div style="text-align: center;">
                    <app-bar-line type="end" [height]="60" color="#ef4444"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px;">Red</div>
                </div>
                <div style="text-align: center;">
                    <app-bar-line type="end" [height]="60" color="#22c55e"></app-bar-line>
                    <div style="font-size: 12px; margin-top: 8px;">Green</div>
                </div>
            </div>
        `,
    }),
};
