import type { Meta, StoryObj } from '@storybook/angular';
import { PlaybackControlsComponent } from './playback-controls.component';

/**
 * PlaybackControlsComponent відображає панель керування відтворенням у scrolling player.
 *
 * Містить:
 * - Кнопки відтворення/паузи та рестарту
 * - Прогрес-бар уроку
 * - Контроль темпу
 * - Перемикач режиму (Flow/Wait)
 * - Кнопка повноекранного режиму
 */
const meta: Meta<PlaybackControlsComponent> = {
  title: 'Lesson Player/Playback Controls',
  component: PlaybackControlsComponent,
  tags: ['autodocs'],
  decorators: [
    (story) => ({
      template: `
        <div style="width: 100%; height: 80px; background: #1a1a2e;">
          ${story()}
        </div>
      `,
    }),
  ],
  argTypes: {
    isPlaying: {
      control: 'boolean',
      description: 'Чи відтворюється урок',
    },
    isAutoPlaying: {
      control: 'boolean',
      description: 'Чи включений автоплей',
    },
    progressPercent: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Прогрес уроку у відсотках',
    },
    tempoPercent: {
      control: { type: 'range', min: 50, max: 150, step: 5 },
      description: 'Темп у відсотках',
    },
    playMode: {
      control: 'radio',
      options: ['flow', 'wait'],
      description: 'Режим гри (Flow - авто прокрутка, Wait - чекати на ноти)',
    },
    isFullscreen: {
      control: 'boolean',
      description: 'Чи активний повноекранний режим',
    },
  },
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a2e' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<PlaybackControlsComponent>;

/**
 * Стан початку уроку
 */
export const Initial: Story = {
  args: {
    isPlaying: false,
    isAutoPlaying: false,
    progressPercent: 0,
    tempoPercent: 100,
    playMode: 'wait',
    computerSoundEnabled: true,
    pianoSoundEnabled: true,
    soundEffectsEnabled: true,
    isFullscreen: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Початковий стан панелі керування перед стартом уроку.',
      },
    },
  },
};

/**
 * Урок відтворюється
 */
export const Playing: Story = {
  args: {
    isPlaying: true,
    isAutoPlaying: false,
    progressPercent: 35,
    tempoPercent: 100,
    playMode: 'wait',
    computerSoundEnabled: true,
    pianoSoundEnabled: true,
    soundEffectsEnabled: true,
    isFullscreen: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Панель керування під час відтворення уроку (35% прогресу).',
      },
    },
  },
};

/**
 * Режим автоплею
 */
export const AutoPlay: Story = {
  args: {
    isPlaying: true,
    isAutoPlaying: true,
    progressPercent: 60,
    tempoPercent: 100,
    playMode: 'flow',
    computerSoundEnabled: true,
    pianoSoundEnabled: false,
    soundEffectsEnabled: true,
    isFullscreen: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Режим автоплею з Flow mode (автоматична прокрутка).',
      },
    },
  },
};

/**
 * Повільний темп
 */
export const SlowTempo: Story = {
  args: {
    isPlaying: true,
    isAutoPlaying: false,
    progressPercent: 25,
    tempoPercent: 60,
    playMode: 'wait',
    computerSoundEnabled: true,
    pianoSoundEnabled: true,
    soundEffectsEnabled: true,
    isFullscreen: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Урок з зниженим темпом (60%) для практики.',
      },
    },
  },
};

/**
 * Швидкий темп
 */
export const FastTempo: Story = {
  args: {
    isPlaying: true,
    isAutoPlaying: false,
    progressPercent: 80,
    tempoPercent: 130,
    playMode: 'flow',
    computerSoundEnabled: true,
    pianoSoundEnabled: true,
    soundEffectsEnabled: true,
    isFullscreen: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Урок з підвищеним темпом (130%) для виклику.',
      },
    },
  },
};

/**
 * Повноекранний режим
 */
export const Fullscreen: Story = {
  args: {
    isPlaying: true,
    isAutoPlaying: false,
    progressPercent: 50,
    tempoPercent: 100,
    playMode: 'wait',
    computerSoundEnabled: true,
    pianoSoundEnabled: true,
    soundEffectsEnabled: true,
    isFullscreen: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Панель керування в повноекранному режимі.',
      },
    },
  },
};

/**
 * Майже завершено
 */
export const NearCompletion: Story = {
  args: {
    isPlaying: true,
    isAutoPlaying: false,
    progressPercent: 95,
    tempoPercent: 100,
    playMode: 'flow',
    computerSoundEnabled: true,
    pianoSoundEnabled: true,
    soundEffectsEnabled: true,
    isFullscreen: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Урок майже завершено (95% прогресу).',
      },
    },
  },
};

/**
 * Інтерактивна площадка
 */
export const Playground: Story = {
  args: {
    isPlaying: false,
    isAutoPlaying: false,
    progressPercent: 0,
    tempoPercent: 100,
    playMode: 'wait',
    computerSoundEnabled: true,
    pianoSoundEnabled: true,
    soundEffectsEnabled: true,
    isFullscreen: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Експериментуйте з різними налаштуваннями панелі керування.',
      },
    },
  },
};
