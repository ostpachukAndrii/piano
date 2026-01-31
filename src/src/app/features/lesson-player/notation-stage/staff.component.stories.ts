import type { Meta, StoryObj } from '@storybook/angular';
import { StaffComponent } from './staff.component';

/**
 * StaffComponent відображає нотний стан (5 горизонтальних ліній).
 *
 * Типи станів:
 * - Single - одинарний стан (скрипковий або басовий)
 * - Grand Staff - великий стан (скрипковий та басовий разом)
 */
const meta: Meta<StaffComponent> = {
  title: 'Music Notation/Staff',
  component: StaffComponent,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['single', 'grand'],
      description: 'Тип стану: single або grand',
    },
    lineSpacing: {
      control: { type: 'range', min: 8, max: 24, step: 1 },
      description: 'Відстань між лініями',
    },
    color: {
      control: 'color',
      description: 'Колір ліній',
    },
    lineWidth: {
      control: { type: 'range', min: 0.5, max: 4, step: 0.5 },
      description: 'Товщина ліній',
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
type Story = StoryObj<StaffComponent>;

/**
 * Одинарний стан за замовчуванням
 */
export const SingleDefault: Story = {
  args: {
    type: 'single',
    lineSpacing: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    lineWidth: 1.5,
  },
};

/**
 * Великий стан (Grand Staff) - скрипковий та басовий
 */
export const GrandStaff: Story = {
  args: {
    type: 'grand',
    lineSpacing: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    lineWidth: 1.5,
  },
};

/**
 * Одинарний стан з великою відстанню між лініями
 */
export const SingleLargeSpacing: Story = {
  args: {
    type: 'single',
    lineSpacing: 20,
    color: 'rgba(255, 255, 255, 0.6)',
    lineWidth: 1.5,
  },
};

/**
 * Одинарний стан з малою відстанню між лініями
 */
export const SingleSmallSpacing: Story = {
  args: {
    type: 'single',
    lineSpacing: 8,
    color: 'rgba(255, 255, 255, 0.6)',
    lineWidth: 1.5,
  },
};

/**
 * Стан з товстими лініями
 */
export const ThickLines: Story = {
  args: {
    type: 'single',
    lineSpacing: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineWidth: 3,
  },
};

/**
 * Стан з тонкими лініями
 */
export const ThinLines: Story = {
  args: {
    type: 'single',
    lineSpacing: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    lineWidth: 0.5,
  },
};

/**
 * Синій стан
 */
export const BlueStaff: Story = {
  args: {
    type: 'single',
    lineSpacing: 12,
    color: 'rgba(59, 130, 246, 0.6)',
    lineWidth: 1.5,
  },
};

/**
 * Великий стан з великою відстанню
 */
export const GrandStaffLarge: Story = {
  args: {
    type: 'grand',
    lineSpacing: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    lineWidth: 2,
  },
};

/**
 * Інтерактивна площадка
 */
export const Playground: Story = {
  args: {
    type: 'single',
    lineSpacing: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    lineWidth: 1.5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Експериментуйте з різними типами станів, відстанями між лініями та товщинами.',
      },
    },
  },
};
