import type { Meta, StoryObj } from '@storybook/angular';
import { AccidentalComponent } from './accidental.component';

/**
 * AccidentalComponent відображає знаки альтерації (дієзи, бемолі, бекари).
 *
 * Типи знаків:
 * - ♯ (sharp / дієз) - підвищення на півтон
 * - ♭ (flat / бемоль) - пониження на півтон
 * - ♮ (natural / бекар) - скасування альтерації
 */
const meta: Meta<AccidentalComponent> = {
  title: 'Music Notation/Accidental',
  component: AccidentalComponent,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['sharp', 'flat', 'natural'],
      description: 'Тип знаку альтерації',
    },
    color: {
      control: 'color',
      description: 'Колір символу',
    },
    size: {
      control: { type: 'range', min: 12, max: 48, step: 2 },
      description: 'Розмір символу',
    },
    showAnchor: {
      control: 'boolean',
      description: 'Show red anchor point at center of accidental',
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
type Story = StoryObj<AccidentalComponent>;

/**
 * Дієз (♯) - підвищення на півтон
 */
export const Sharp: Story = {
  args: {
    type: 'sharp',
    color: '#ffffff',
    size: 24,
  },
};

/**
 * Бемоль (♭) - пониження на півтон
 */
export const Flat: Story = {
  args: {
    type: 'flat',
    color: '#ffffff',
    size: 24,
  },
};

/**
 * Бекар (♮) - скасування альтерації
 */
export const Natural: Story = {
  args: {
    type: 'natural',
    color: '#ffffff',
    size: 24,
  },
};

/**
 * Великий дієз
 */
export const LargeSharp: Story = {
  args: {
    type: 'sharp',
    color: '#ffffff',
    size: 36,
  },
};

/**
 * Малий бемоль
 */
export const SmallFlat: Story = {
  args: {
    type: 'flat',
    color: '#ffffff',
    size: 16,
  },
};

/**
 * Кольоровий дієз (синій для активної ноти)
 */
export const ColoredSharp: Story = {
  args: {
    type: 'sharp',
    color: '#3B82F6',
    size: 24,
  },
};

/**
 * Червоний бемоль (для пропущеної ноти)
 */
export const RedFlat: Story = {
  args: {
    type: 'flat',
    color: '#ef4444',
    size: 24,
  },
};

/**
 * Зелений бекар (для влученої ноти)
 */
export const GreenNatural: Story = {
  args: {
    type: 'natural',
    color: '#22c55e',
    size: 24,
  },
};

/**
 * Sharp with anchor point
 */
export const SharpWithAnchor: Story = {
  args: {
    type: 'sharp',
    color: '#ffffff',
    size: 30,
    showAnchor: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sharp with red anchor point showing the center positioning',
      },
    },
  },
};

/**
 * Flat with anchor point
 */
export const FlatWithAnchor: Story = {
  args: {
    type: 'flat',
    color: '#ffffff',
    size: 30,
    showAnchor: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Flat with red anchor point showing the center positioning',
      },
    },
  },
};

/**
 * Інтерактивна площадка
 */
export const Playground: Story = {
  args: {
    type: 'sharp',
    color: '#ffffff',
    size: 24,
    showAnchor: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Експериментуйте з різними типами знаків, розмірами та кольорами.',
      },
    },
  },
};
