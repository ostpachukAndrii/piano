import type { Meta, StoryObj } from '@storybook/angular';
import { NoteheadComponent } from './notehead.component';

/**
 * NoteheadComponent відображає музичні ноти різної тривалості.
 *
 * Правила малювання нот:
 * - Цілі ноти (4 beats) та половинні (2 beats) - порожні
 * - Чвертні (1 beat) та коротші - заповнені
 */
const meta: Meta<NoteheadComponent> = {
  title: 'Music Notation/Notehead',
  component: NoteheadComponent,
  tags: ['autodocs'],
  argTypes: {
    duration: {
      control: { type: 'number', min: 0.25, max: 4, step: 0.25 },
      description: 'Тривалість ноти в beats (визначає порожня/заповнена)',
    },
    color: {
      control: 'color',
      description: 'Колір ноти',
    },
    isActive: {
      control: 'boolean',
      description: 'Чи є нота активною (ефект світіння)',
    },
    showHitEffect: {
      control: 'boolean',
      description: 'Показати ефект попадання',
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
type Story = StoryObj<NoteheadComponent>;

/**
 * Ціла нота (4 beats) - порожня овальна
 */
export const WholeNote: Story = {
  args: {
    duration: 4,
    color: '#ffffff',
    isActive: false,
    showHitEffect: false,
  },
};

/**
 * Половинна нота (2 beats) - порожня овальна
 */
export const HalfNote: Story = {
  args: {
    duration: 2,
    color: '#ffffff',
    isActive: false,
    showHitEffect: false,
  },
};

/**
 * Чвертна нота (1 beat) - заповнена овальна
 */
export const QuarterNote: Story = {
  args: {
    duration: 1,
    color: '#ffffff',
    isActive: false,
    showHitEffect: false,
  },
};

/**
 * Восьма нота (0.5 beats) - заповнена овальна
 */
export const EighthNote: Story = {
  args: {
    duration: 0.5,
    color: '#ffffff',
    isActive: false,
    showHitEffect: false,
  },
};

/**
 * Шістнадцята нота (0.25 beats) - заповнена овальна
 */
export const SixteenthNote: Story = {
  args: {
    duration: 0.25,
    color: '#ffffff',
    isActive: false,
    showHitEffect: false,
  },
};

/**
 * Активна нота з ефектом світіння
 */
export const ActiveNote: Story = {
  args: {
    duration: 1,
    color: '#3B82F6',
    isActive: true,
    showHitEffect: false,
  },
};

/**
 * Нота з ефектом попадання
 */
export const HitNote: Story = {
  args: {
    duration: 1,
    color: '#22c55e',
    isActive: false,
    showHitEffect: true,
  },
};

/**
 * Пропущена нота (червона)
 */
export const MissedNote: Story = {
  args: {
    duration: 1,
    color: '#ef4444',
    isActive: false,
    showHitEffect: false,
  },
};

/**
 * Інтерактивна площадка
 */
export const Playground: Story = {
  args: {
    duration: 1,
    color: '#ffffff',
    isActive: false,
    showHitEffect: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Експериментуйте з різними тривалостями та кольорами нот.',
      },
    },
  },
};
