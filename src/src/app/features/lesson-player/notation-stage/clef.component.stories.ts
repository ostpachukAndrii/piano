import type { Meta, StoryObj } from '@storybook/angular';
import { ClefComponent } from './clef.component';

/**
 * ClefComponent renders musical clefs (treble/bass) with precise positioning
 *
 * The positioning is based on actual measurements:
 * - Treble clef drawing starts at (-12px, 27px) from center at 200px font
 * - Bass clef drawing starts at (-28px, -26px) from center at 180px font
 *
 * These start points align with the anchor lines (G4 for treble, F3 for bass)
 */
const meta: Meta<ClefComponent> = {
  title: 'Music Notation/Clef',
  component: ClefComponent,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['treble', 'bass'],
      description: 'Type of clef to render',
    },
    lineSpacing: {
      control: { type: 'range', min: 5, max: 50, step: 1 },
      description: 'Distance between staff lines in pixels',
    },
    color: {
      control: 'color',
      description: 'Color of the clef symbol',
    },
    scale: {
      control: { type: 'range', min: 0.5, max: 3, step: 0.1 },
      description: 'Scale factor for the clef size',
    },
    showAnchor: {
      control: 'boolean',
      description: 'Show red anchor point at reference line (G4 for treble, F3 for bass)',
    },
  },
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f0f23' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<ClefComponent>;

/**
 * Default treble clef with standard sizing
 */
export const TrebleDefault: Story = {
  args: {
    type: 'treble',
    lineSpacing: 10,
    color: '#ffffff',
    scale: 1.0,
  },
};

/**
 * Default bass clef with standard sizing
 */
export const BassDefault: Story = {
  args: {
    type: 'bass',
    lineSpacing: 10,
    color: '#ffffff',
    scale: 1.0,
  },
};

/**
 * Small treble clef (tight line spacing)
 */
export const TrebleSmall: Story = {
  args: {
    type: 'treble',
    lineSpacing: 8,
    color: '#ffffff',
    scale: 0.8,
  },
};

/**
 * Large treble clef (wide line spacing)
 */
export const TrebleLarge: Story = {
  args: {
    type: 'treble',
    lineSpacing: 20,
    color: '#ffffff',
    scale: 1.5,
  },
};

/**
 * Colored treble clef
 */
export const TrebleColored: Story = {
  args: {
    type: 'treble',
    lineSpacing: 12,
    color: '#3B82F6',
    scale: 1.2,
  },
};

/**
 * Small bass clef (tight line spacing)
 */
export const BassSmall: Story = {
  args: {
    type: 'bass',
    lineSpacing: 8,
    color: '#ffffff',
    scale: 0.8,
  },
};

/**
 * Large bass clef (wide line spacing)
 */
export const BassLarge: Story = {
  args: {
    type: 'bass',
    lineSpacing: 20,
    color: '#ffffff',
    scale: 1.5,
  },
};

/**
 * Colored bass clef
 */
export const BassColored: Story = {
  args: {
    type: 'bass',
    lineSpacing: 12,
    color: '#22c55e',
    scale: 1.2,
  },
};

/**
 * Treble clef with anchor point visible
 */
export const TrebleWithAnchor: Story = {
  args: {
    type: 'treble',
    lineSpacing: 15,
    color: '#ffffff',
    scale: 1.2,
    showAnchor: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Treble clef with red anchor point showing the G4 line (2nd line from bottom)',
      },
    },
  },
};

/**
 * Bass clef with anchor point visible
 */
export const BassWithAnchor: Story = {
  args: {
    type: 'bass',
    lineSpacing: 15,
    color: '#ffffff',
    scale: 1.2,
    showAnchor: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Bass clef with red anchor point showing the F3 line (4th line from bottom)',
      },
    },
  },
};

/**
 * Interactive playground - experiment with all parameters
 */
export const Playground: Story = {
  args: {
    type: 'treble',
    lineSpacing: 15,
    color: '#ffffff',
    scale: 1.0,
    showAnchor: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Experiment with different clef types, sizes, and colors. The clef positioning automatically adjusts to maintain correct alignment with the anchor line (G4 for treble, F3 for bass).',
      },
    },
  },
};
