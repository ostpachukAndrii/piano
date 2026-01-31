import type { Meta, StoryObj } from '@storybook/angular';
import { RestComponent } from './rest.component';

/**
 * RestComponent відображає паузи різної тривалості на нотному стані.
 *
 * Типи пауз:
 * - Ціла пауза (4+ beats) - блок що висить вниз від 4-ї лінії
 * - Половинна (2-3.99 beats) - блок що сидить на 3-й лінії
 * - Чвертна (1-1.99 beats) - завиток
 * - Восьма (0.5-0.99 beats) - прапорець
 * - Шістнадцята (0.25-0.49 beats) - подвійний прапорець
 * - 32-га (< 0.25 beats) - потрійний прапорець
 */
const meta: Meta<RestComponent> = {
  title: 'Music Notation/Rest',
  component: RestComponent,
  tags: ['autodocs'],
  argTypes: {
    duration: {
      control: { type: 'number', min: 0.125, max: 8, step: 0.125 },
      description: 'Тривалість паузи в beats',
    },
    color: {
      control: 'color',
      description: 'Колір паузи',
    },
    lineSpacing: {
      control: { type: 'range', min: 8, max: 20, step: 1 },
      description: 'Відстань між лініями нотного стану',
    },
    showAnchor: {
      control: 'boolean',
      description: 'Show red anchor point at rest position',
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
type Story = StoryObj<RestComponent>;

/**
 * Ціла пауза (4 beats) - блок вниз від 4-ї лінії
 */
export const WholeRest: Story = {
  args: {
    duration: 4,
    color: '#ffffff',
    lineSpacing: 12,
  },
};

/**
 * Половинна пауза (2 beats) - блок на 3-й лінії
 */
export const HalfRest: Story = {
  args: {
    duration: 2,
    color: '#ffffff',
    lineSpacing: 12,
  },
};

/**
 * Чвертна пауза (1 beat) - завиток
 */
export const QuarterRest: Story = {
  args: {
    duration: 1,
    color: '#ffffff',
    lineSpacing: 12,
  },
};

/**
 * Восьма пауза (0.5 beats) - прапорець
 */
export const EighthRest: Story = {
  args: {
    duration: 0.5,
    color: '#ffffff',
    lineSpacing: 12,
  },
};

/**
 * Шістнадцята пауза (0.25 beats) - подвійний прапорець
 */
export const SixteenthRest: Story = {
  args: {
    duration: 0.25,
    color: '#ffffff',
    lineSpacing: 12,
  },
};

/**
 * 32-га пауза (0.125 beats) - потрійний прапорець
 */
export const ThirtySecondRest: Story = {
  args: {
    duration: 0.125,
    color: '#ffffff',
    lineSpacing: 12,
  },
};

/**
 * Кольорова пауза
 */
export const ColoredRest: Story = {
  args: {
    duration: 1,
    color: '#3B82F6',
    lineSpacing: 12,
  },
};

/**
 * Велика пауза (збільшена відстань між лініями)
 */
export const LargeRest: Story = {
  args: {
    duration: 1,
    color: '#ffffff',
    lineSpacing: 18,
    showAnchor: true,
  },
};

/**
 * Мала пауза (зменшена відстань між лініями)
 */
export const SmallRest: Story = {
  args: {
    duration: 1,
    color: '#ffffff',
    lineSpacing: 8,
    showAnchor: true,
  },
};

/**
 * Whole rest with anchor point
 */
export const WholeRestWithAnchor: Story = {
  args: {
    duration: 4,
    color: '#ffffff',
    lineSpacing: 15,
    showAnchor: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Whole rest (4 beats) with red anchor point at line 4',
      },
    },
  },
};

/**
 * Half rest with anchor point
 */
export const HalfRestWithAnchor: Story = {
  args: {
    duration: 2,
    color: '#ffffff',
    lineSpacing: 15,
    showAnchor: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Half rest (2 beats) with red anchor point at line 3',
      },
    },
  },
};

/**
 * Quarter rest with anchor point
 */
export const QuarterRestWithAnchor: Story = {
  args: {
    duration: 1,
    color: '#ffffff',
    lineSpacing: 15,
    showAnchor: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Quarter rest (1 beat) with red anchor point at line 3',
      },
    },
  },
};

/**
 * Eighth rest with anchor point
 */
export const EighthRestWithAnchor: Story = {
  args: {
    duration: 0.5,
    color: '#ffffff',
    lineSpacing: 15,
    showAnchor: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Eighth rest (0.5 beats) with red anchor point at line 3',
      },
    },
  },
};

/**
 * Sixteenth rest with anchor point
 */
export const SixteenthRestWithAnchor: Story = {
  args: {
    duration: 0.25,
    color: '#ffffff',
    lineSpacing: 15,
    showAnchor: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sixteenth rest (0.25 beats) with red anchor point at line 3',
      },
    },
  },
};

/**
 * Thirty-second rest with anchor point
 */
export const ThirtySecondRestWithAnchor: Story = {
  args: {
    duration: 0.125,
    color: '#ffffff',
    lineSpacing: 15,
    showAnchor: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Thirty-second rest (0.125 beats) with red anchor point at line 3',
      },
    },
  },
};

/**
 * Інтерактивна площадка
 */
export const Playground: Story = {
  args: {
    duration: 1,
    color: '#ffffff',
    lineSpacing: 12,
    showAnchor: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Експериментуйте з різними тривалостями пауз та відстанями між лініями.',
      },
    },
  },
};
