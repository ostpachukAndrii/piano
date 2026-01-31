import type { Meta, StoryObj } from '@storybook/angular';
import { TimeSignatureComponent } from './time-signature.component';

/**
 * TimeSignatureComponent відображає тактовий розмір на нотному стані.
 *
 * Тактовий розмір показує:
 * - Чисельник: кількість долей в такті
 * - Знаменник: тривалість долі (4=чверть, 8=восьма, 2=половинна)
 */
const meta: Meta<TimeSignatureComponent> = {
  title: 'Music Notation/Time Signature',
  component: TimeSignatureComponent,
  tags: ['autodocs'],
  argTypes: {
    numerator: {
      control: { type: 'number', min: 1, max: 16, step: 1 },
      description: 'Чисельник (кількість долей)',
    },
    denominator: {
      control: 'select',
      options: [1, 2, 4, 8, 16, 32],
      description: 'Знаменник (тривалість долі)',
    },
    useCommonTime: {
      control: 'boolean',
      description: 'Використовувати символ C для 4/4',
    },
    color: {
      control: 'color',
      description: 'Колір тексту',
    },
    lineSpacing: {
      control: { type: 'range', min: 8, max: 20, step: 1 },
      description: 'Відстань між лініями',
    },
    showAnchor: {
      control: 'boolean',
      description: 'Show red anchor point at center',
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
type Story = StoryObj<TimeSignatureComponent>;

/**
 * Стандартний 4/4 (Common Time)
 */
export const FourFour: Story = {
  args: {
    numerator: 4,
    denominator: 4,
    useCommonTime: false,
    color: '#ffffff',
    lineSpacing: 12,
  },
};

/**
 * 4/4 з символом C
 */
export const CommonTime: Story = {
  args: {
    numerator: 4,
    denominator: 4,
    useCommonTime: true,
    color: '#ffffff',
    lineSpacing: 12,
  },
};

/**
 * 3/4 (Waltz Time)
 */
export const ThreeFour: Story = {
  args: {
    numerator: 3,
    denominator: 4,
    useCommonTime: false,
    color: '#ffffff',
    lineSpacing: 12,
  },
};

/**
 * 6/8 (Compound Duple)
 */
export const SixEight: Story = {
  args: {
    numerator: 6,
    denominator: 8,
    useCommonTime: false,
    color: '#ffffff',
    lineSpacing: 12,
  },
};

/**
 * 2/2 (Cut Time, Alla Breve)
 */
export const TwoTwo: Story = {
  args: {
    numerator: 2,
    denominator: 2,
    useCommonTime: false,
    color: '#ffffff',
    lineSpacing: 12,
  },
};

/**
 * 5/4 (Asymmetric)
 */
export const FiveFour: Story = {
  args: {
    numerator: 5,
    denominator: 4,
    useCommonTime: false,
    color: '#ffffff',
    lineSpacing: 12,
  },
};

/**
 * 7/8 (Complex Asymmetric)
 */
export const SevenEight: Story = {
  args: {
    numerator: 7,
    denominator: 8,
    useCommonTime: false,
    color: '#ffffff',
    lineSpacing: 12,
  },
};

/**
 * 9/8 (Compound Triple)
 */
export const NineEight: Story = {
  args: {
    numerator: 9,
    denominator: 8,
    useCommonTime: false,
    color: '#ffffff',
    lineSpacing: 12,
  },
};

/**
 * 12/8 (Compound Quadruple)
 */
export const TwelveEight: Story = {
  args: {
    numerator: 12,
    denominator: 8,
    useCommonTime: false,
    color: '#ffffff',
    lineSpacing: 12,
  },
};

/**
 * Кольоровий тактовий розмір
 */
export const Colored: Story = {
  args: {
    numerator: 4,
    denominator: 4,
    useCommonTime: false,
    color: '#3B82F6',
    lineSpacing: 12,
  },
};

/**
 * Time signature with anchor point
 */
export const WithAnchor: Story = {
  args: {
    numerator: 4,
    denominator: 4,
    useCommonTime: false,
    color: '#ffffff',
    lineSpacing: 15,
    showAnchor: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Time signature with red anchor point showing center positioning on middle staff line',
      },
    },
  },
};

/**
 * Інтерактивна площадка
 */
export const Playground: Story = {
  args: {
    numerator: 4,
    denominator: 4,
    useCommonTime: false,
    color: '#ffffff',
    lineSpacing: 12,
    showAnchor: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Експериментуйте з різними тактовими розмірами. Знаменник повинен бути степенем 2.',
      },
    },
  },
};
