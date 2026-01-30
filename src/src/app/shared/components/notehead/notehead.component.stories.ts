import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { NoteheadComponent, NoteDuration, NoteState } from './notehead.component';

const meta: Meta<NoteheadComponent> = {
    title: 'Shared/Notehead',
    component: NoteheadComponent,
    decorators: [
        moduleMetadata({
            imports: [NoteheadComponent],
        }),
    ],
    parameters: {
        backgrounds: {
            default: 'dark',
            values: [
                { name: 'dark', value: '#1a1a2e' },
                { name: 'light', value: '#ffffff' },
            ],
        },
    },
    argTypes: {
        duration: {
            control: 'select',
            options: ['whole', 'half', 'quarter', 'eighth', 'sixteenth'],
            description: 'Note duration type',
        },
        state: {
            control: 'select',
            options: ['upcoming', 'active', 'hit', 'missed'],
            description: 'Visual state of the note',
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size of the notehead',
        },
        stemDirection: {
            control: 'select',
            options: ['up', 'down'],
            description: 'Direction of the stem',
        },
        showHitEffect: {
            control: 'boolean',
            description: 'Show expanding ring on hit',
        },
    },
};

export default meta;
type Story = StoryObj<NoteheadComponent>;

// === Individual Note Types ===

export const WholeNote: Story = {
    args: {
        duration: 'whole',
        state: 'upcoming',
        size: 'large',
    },
    parameters: {
        docs: {
            description: {
                story: 'Whole note (4 beats) - hollow oval, no stem',
            },
        },
    },
};

export const HalfNote: Story = {
    args: {
        duration: 'half',
        state: 'upcoming',
        size: 'large',
    },
    parameters: {
        docs: {
            description: {
                story: 'Half note (2 beats) - hollow oval with stem',
            },
        },
    },
};

export const QuarterNote: Story = {
    args: {
        duration: 'quarter',
        state: 'upcoming',
        size: 'large',
    },
    parameters: {
        docs: {
            description: {
                story: 'Quarter note (1 beat) - filled oval with stem',
            },
        },
    },
};

export const EighthNote: Story = {
    args: {
        duration: 'eighth',
        state: 'upcoming',
        size: 'large',
    },
    parameters: {
        docs: {
            description: {
                story: 'Eighth note (0.5 beats) - filled oval with stem and one flag',
            },
        },
    },
};

export const SixteenthNote: Story = {
    args: {
        duration: 'sixteenth',
        state: 'upcoming',
        size: 'large',
    },
    parameters: {
        docs: {
            description: {
                story: 'Sixteenth note (0.25 beats) - filled oval with stem and two flags',
            },
        },
    },
};

// === All Durations Comparison ===

export const AllDurations: Story = {
    render: () => ({
        template: `
            <div style="display: flex; gap: 40px; align-items: flex-end; padding: 20px;">
                <div style="text-align: center;">
                    <app-notehead duration="whole" size="large"></app-notehead>
                    <div style="color: white; margin-top: 10px; font-size: 12px;">Whole<br>(4 beats)</div>
                </div>
                <div style="text-align: center;">
                    <app-notehead duration="half" size="large"></app-notehead>
                    <div style="color: white; margin-top: 10px; font-size: 12px;">Half<br>(2 beats)</div>
                </div>
                <div style="text-align: center;">
                    <app-notehead duration="quarter" size="large"></app-notehead>
                    <div style="color: white; margin-top: 10px; font-size: 12px;">Quarter<br>(1 beat)</div>
                </div>
                <div style="text-align: center;">
                    <app-notehead duration="eighth" size="large"></app-notehead>
                    <div style="color: white; margin-top: 10px; font-size: 12px;">Eighth<br>(0.5 beats)</div>
                </div>
                <div style="text-align: center;">
                    <app-notehead duration="sixteenth" size="large"></app-notehead>
                    <div style="color: white; margin-top: 10px; font-size: 12px;">Sixteenth<br>(0.25 beats)</div>
                </div>
            </div>
        `,
    }),
    parameters: {
        docs: {
            description: {
                story: 'Comparison of all note duration types side by side',
            },
        },
    },
};

// === All States Comparison ===

export const AllStates: Story = {
    render: () => ({
        template: `
            <div style="display: flex; gap: 40px; align-items: center; padding: 20px;">
                <div style="text-align: center;">
                    <app-notehead duration="quarter" state="upcoming" size="large"></app-notehead>
                    <div style="color: white; margin-top: 10px; font-size: 12px;">Upcoming<br>(white)</div>
                </div>
                <div style="text-align: center;">
                    <app-notehead duration="quarter" state="active" size="large"></app-notehead>
                    <div style="color: #3B82F6; margin-top: 10px; font-size: 12px;">Active<br>(blue + glow)</div>
                </div>
                <div style="text-align: center;">
                    <app-notehead duration="quarter" state="hit" size="large"></app-notehead>
                    <div style="color: #22c55e; margin-top: 10px; font-size: 12px;">Hit<br>(green)</div>
                </div>
                <div style="text-align: center;">
                    <app-notehead duration="quarter" state="missed" size="large"></app-notehead>
                    <div style="color: #ef4444; margin-top: 10px; font-size: 12px;">Missed<br>(red)</div>
                </div>
            </div>
        `,
    }),
    parameters: {
        docs: {
            description: {
                story: 'All visual states for note feedback',
            },
        },
    },
};

// === Stem Directions ===

export const StemDirections: Story = {
    render: () => ({
        template: `
            <div style="display: flex; gap: 60px; align-items: center; padding: 20px;">
                <div style="text-align: center;">
                    <app-notehead duration="quarter" stemDirection="up" size="large"></app-notehead>
                    <div style="color: white; margin-top: 10px; font-size: 12px;">Stem Up</div>
                </div>
                <div style="text-align: center;">
                    <app-notehead duration="quarter" stemDirection="down" size="large"></app-notehead>
                    <div style="color: white; margin-top: 10px; font-size: 12px;">Stem Down</div>
                </div>
                <div style="text-align: center;">
                    <app-notehead duration="eighth" stemDirection="up" size="large"></app-notehead>
                    <div style="color: white; margin-top: 10px; font-size: 12px;">Eighth Up</div>
                </div>
                <div style="text-align: center;">
                    <app-notehead duration="eighth" stemDirection="down" size="large"></app-notehead>
                    <div style="color: white; margin-top: 10px; font-size: 12px;">Eighth Down</div>
                </div>
            </div>
        `,
    }),
    parameters: {
        docs: {
            description: {
                story: 'Stem direction affects note positioning for proper notation',
            },
        },
    },
};

// === Sizes ===

export const Sizes: Story = {
    render: () => ({
        template: `
            <div style="display: flex; gap: 40px; align-items: flex-end; padding: 20px;">
                <div style="text-align: center;">
                    <app-notehead duration="quarter" size="small"></app-notehead>
                    <div style="color: white; margin-top: 10px; font-size: 12px;">Small</div>
                </div>
                <div style="text-align: center;">
                    <app-notehead duration="quarter" size="medium"></app-notehead>
                    <div style="color: white; margin-top: 10px; font-size: 12px;">Medium</div>
                </div>
                <div style="text-align: center;">
                    <app-notehead duration="quarter" size="large"></app-notehead>
                    <div style="color: white; margin-top: 10px; font-size: 12px;">Large</div>
                </div>
            </div>
        `,
    }),
    parameters: {
        docs: {
            description: {
                story: 'Different sizes for various UI contexts',
            },
        },
    },
};

// === Complete Matrix ===

export const CompleteMatrix: Story = {
    render: () => ({
        template: `
            <div style="padding: 20px;">
                <h3 style="color: white; margin-bottom: 20px;">Duration × State Matrix</h3>
                <table style="border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="color: white; padding: 10px; border: 1px solid #444;"></th>
                            <th style="color: white; padding: 10px; border: 1px solid #444;">Upcoming</th>
                            <th style="color: #3B82F6; padding: 10px; border: 1px solid #444;">Active</th>
                            <th style="color: #22c55e; padding: 10px; border: 1px solid #444;">Hit</th>
                            <th style="color: #ef4444; padding: 10px; border: 1px solid #444;">Missed</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="color: white; padding: 10px; border: 1px solid #444;">Whole (4)</td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="whole" state="upcoming"></app-notehead></td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="whole" state="active"></app-notehead></td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="whole" state="hit" [showHitEffect]="false"></app-notehead></td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="whole" state="missed"></app-notehead></td>
                        </tr>
                        <tr>
                            <td style="color: white; padding: 10px; border: 1px solid #444;">Half (2)</td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="half" state="upcoming"></app-notehead></td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="half" state="active"></app-notehead></td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="half" state="hit" [showHitEffect]="false"></app-notehead></td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="half" state="missed"></app-notehead></td>
                        </tr>
                        <tr>
                            <td style="color: white; padding: 10px; border: 1px solid #444;">Quarter (1)</td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="quarter" state="upcoming"></app-notehead></td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="quarter" state="active"></app-notehead></td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="quarter" state="hit" [showHitEffect]="false"></app-notehead></td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="quarter" state="missed"></app-notehead></td>
                        </tr>
                        <tr>
                            <td style="color: white; padding: 10px; border: 1px solid #444;">Eighth (0.5)</td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="eighth" state="upcoming"></app-notehead></td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="eighth" state="active"></app-notehead></td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="eighth" state="hit" [showHitEffect]="false"></app-notehead></td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="eighth" state="missed"></app-notehead></td>
                        </tr>
                        <tr>
                            <td style="color: white; padding: 10px; border: 1px solid #444;">Sixteenth (0.25)</td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="sixteenth" state="upcoming"></app-notehead></td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="sixteenth" state="active"></app-notehead></td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="sixteenth" state="hit" [showHitEffect]="false"></app-notehead></td>
                            <td style="padding: 10px; border: 1px solid #444; text-align: center;"><app-notehead duration="sixteenth" state="missed"></app-notehead></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `,
    }),
    parameters: {
        docs: {
            description: {
                story: 'Complete matrix showing all duration and state combinations',
            },
        },
    },
};

// === Hollow vs Filled Comparison ===

export const HollowVsFilled: Story = {
    render: () => ({
        template: `
            <div style="padding: 20px;">
                <h3 style="color: white; margin-bottom: 20px;">Hollow vs Filled Noteheads</h3>
                <div style="display: flex; gap: 60px;">
                    <div>
                        <h4 style="color: #888; margin-bottom: 15px;">Hollow (duration >= 2 beats)</h4>
                        <div style="display: flex; gap: 30px; align-items: flex-end;">
                            <div style="text-align: center;">
                                <app-notehead duration="whole" size="large"></app-notehead>
                                <div style="color: white; margin-top: 5px; font-size: 11px;">Whole</div>
                            </div>
                            <div style="text-align: center;">
                                <app-notehead duration="half" size="large"></app-notehead>
                                <div style="color: white; margin-top: 5px; font-size: 11px;">Half</div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 style="color: #888; margin-bottom: 15px;">Filled (duration < 2 beats)</h4>
                        <div style="display: flex; gap: 30px; align-items: flex-end;">
                            <div style="text-align: center;">
                                <app-notehead duration="quarter" size="large"></app-notehead>
                                <div style="color: white; margin-top: 5px; font-size: 11px;">Quarter</div>
                            </div>
                            <div style="text-align: center;">
                                <app-notehead duration="eighth" size="large"></app-notehead>
                                <div style="color: white; margin-top: 5px; font-size: 11px;">Eighth</div>
                            </div>
                            <div style="text-align: center;">
                                <app-notehead duration="sixteenth" size="large"></app-notehead>
                                <div style="color: white; margin-top: 5px; font-size: 11px;">Sixteenth</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
    }),
    parameters: {
        docs: {
            description: {
                story: 'Visual distinction between hollow (long) and filled (short) notes',
            },
        },
    },
};

// === Interactive Playground ===

export const Playground: Story = {
    args: {
        duration: 'quarter',
        state: 'upcoming',
        size: 'large',
        stemDirection: 'up',
        showHitEffect: true,
    },
    parameters: {
        docs: {
            description: {
                story: 'Interactive playground - use controls to explore all options',
            },
        },
    },
};
