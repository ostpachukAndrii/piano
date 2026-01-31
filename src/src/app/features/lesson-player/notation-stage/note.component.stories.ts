import type { Meta, StoryObj } from '@storybook/angular';
import { NoteComponent } from './note.component';

/**
 * NoteComponent відображає повні музичні ноти з головами, стеблами та прапорцями.
 *
 * Правила малювання нот:
 * - Цілі ноти (4 beats) - порожні, БЕЗ стебла
 * - Половинні (2 beats) - порожні, зі стеблом
 * - Чвертні (1 beat) - заповнені, зі стеблом
 * - Восьмі (0.5 beats) - заповнені, зі стеблом та 1 прапорцем
 * - Шістнадцяті (0.25 beats) - заповнені, зі стеблом та 2 прапорцями
 */
const meta: Meta<NoteComponent> = {
  title: 'Music Notation/Note',
  component: NoteComponent,
  tags: ['autodocs'],
  argTypes: {
    duration: {
      control: { type: 'number', min: 0.25, max: 4, step: 0.25 },
      description: 'Тривалість ноти в beats',
    },
    color: {
      control: 'color',
      description: 'Колір ноти',
    },
    stemUp: {
      control: 'boolean',
      description: 'Напрямок стебла (true = вгору, false = вниз)',
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
type Story = StoryObj<NoteComponent>;

// ============================================================================
// Основні типи нот зі стеблом вгору
// ============================================================================

/**
 * Ціла нота (4 beats) - порожня, БЕЗ стебла
 */
export const WholeNote: Story = {
  args: {
    duration: 4,
    color: '#ffffff',
    stemUp: true,
    isActive: false,
    showHitEffect: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Ціла нота не має стебла, тільки порожня голова.',
      },
    },
  },
};

/**
 * Половинна нота (2 beats) - порожня зі стеблом вгору
 */
export const HalfNoteStemUp: Story = {
  args: {
    duration: 2,
    color: '#ffffff',
    stemUp: true,
    isActive: false,
    showHitEffect: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Половинна нота: порожня голова зі стеблом вгору.',
      },
    },
  },
};

/**
 * Чвертна нота (1 beat) - заповнена зі стеблом вгору
 */
export const QuarterNoteStemUp: Story = {
  args: {
    duration: 1,
    color: '#ffffff',
    stemUp: true,
    isActive: false,
    showHitEffect: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Чвертна нота: заповнена голова зі стеблом вгору.',
      },
    },
  },
};

/**
 * Восьма нота (0.5 beats) - заповнена зі стеблом та прапорцем вгору
 */
export const EighthNoteStemUp: Story = {
  args: {
    duration: 0.5,
    color: '#ffffff',
    stemUp: true,
    isActive: false,
    showHitEffect: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Восьма нота: заповнена голова зі стеблом та 1 прапорцем вгору.',
      },
    },
  },
};

/**
 * Шістнадцята нота (0.25 beats) - заповнена зі стеблом та 2 прапорцями вгору
 */
export const SixteenthNoteStemUp: Story = {
  args: {
    duration: 0.25,
    color: '#ffffff',
    stemUp: true,
    isActive: false,
    showHitEffect: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Шістнадцята нота: заповнена голова зі стеблом та 2 прапорцями вгору.',
      },
    },
  },
};

// ============================================================================
// Основні типи нот зі стеблом вниз
// ============================================================================

/**
 * Половинна нота (2 beats) - порожня зі стеблом вниз
 */
export const HalfNoteStemDown: Story = {
  args: {
    duration: 2,
    color: '#ffffff',
    stemUp: false,
    isActive: false,
    showHitEffect: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Половинна нота: порожня голова зі стеблом вниз.',
      },
    },
  },
};

/**
 * Чвертна нота (1 beat) - заповнена зі стеблом вниз
 */
export const QuarterNoteStemDown: Story = {
  args: {
    duration: 1,
    color: '#ffffff',
    stemUp: false,
    isActive: false,
    showHitEffect: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Чвертна нота: заповнена голова зі стеблом вниз.',
      },
    },
  },
};

/**
 * Восьма нота (0.5 beats) - заповнена зі стеблом та прапорцем вниз
 */
export const EighthNoteStemDown: Story = {
  args: {
    duration: 0.5,
    color: '#ffffff',
    stemUp: false,
    isActive: false,
    showHitEffect: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Восьма нота: заповнена голова зі стеблом та 1 прапорцем вниз.',
      },
    },
  },
};

/**
 * Шістнадцята нота (0.25 beats) - заповнена зі стеблом та 2 прапорцями вниз
 */
export const SixteenthNoteStemDown: Story = {
  args: {
    duration: 0.25,
    color: '#ffffff',
    stemUp: false,
    isActive: false,
    showHitEffect: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Шістнадцята нота: заповнена голова зі стеблом та 2 прапорцями вниз.',
      },
    },
  },
};

// ============================================================================
// Спеціальні стани нот
// ============================================================================

/**
 * Активна нота з ефектом світіння
 */
export const ActiveNote: Story = {
  args: {
    duration: 1,
    color: '#3B82F6',
    stemUp: true,
    isActive: true,
    showHitEffect: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Нота з ефектом світіння для позначення активної ноти.',
      },
    },
  },
};

/**
 * Нота з ефектом попадання
 */
export const HitNote: Story = {
  args: {
    duration: 1,
    color: '#22c55e',
    stemUp: true,
    isActive: false,
    showHitEffect: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Нота з ефектом попадання (зелена з кільцем).',
      },
    },
  },
};

/**
 * Пропущена нота (червона)
 */
export const MissedNote: Story = {
  args: {
    duration: 1,
    color: '#ef4444',
    stemUp: true,
    isActive: false,
    showHitEffect: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропущена нота позначена червоним кольором.',
      },
    },
  },
};

// ============================================================================
// Кольорові варіанти
// ============================================================================

/**
 * Половинна нота - синя
 */
export const BlueHalfNote: Story = {
  args: {
    duration: 2,
    color: '#3B82F6',
    stemUp: true,
    isActive: false,
    showHitEffect: false,
  },
};

/**
 * Восьма нота - зелена
 */
export const GreenEighthNote: Story = {
  args: {
    duration: 0.5,
    color: '#22c55e',
    stemUp: true,
    isActive: false,
    showHitEffect: false,
  },
};

/**
 * Шістнадцята нота - фіолетова
 */
export const PurpleSixteenthNote: Story = {
  args: {
    duration: 0.25,
    color: '#a855f7',
    stemUp: false,
    isActive: false,
    showHitEffect: false,
  },
};

// ============================================================================
// Інтерактивна площадка
// ============================================================================

/**
 * Інтерактивна площадка
 */
export const Playground: Story = {
  args: {
    duration: 1,
    color: '#ffffff',
    stemUp: true,
    isActive: false,
    showHitEffect: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Експериментуйте з різними тривалостями, кольорами та напрямками стебел.',
      },
    },
  },
};
