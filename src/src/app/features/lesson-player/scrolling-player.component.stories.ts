import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSliderModule } from '@angular/material/slider';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { LessonDTO } from '../../core/models/lesson.model';
import { ChordNoteDTO, SingleNoteDTO } from '../../core/models/note.model';
import { EvaluationService } from '../../core/services/evaluation.service';
import { MidiService } from '../../core/services/midi.service';
import { PianoSoundService } from '../../core/services/piano-sound.service';
import { ScrollingPlayerComponent } from './scrolling-player.component';

// Mock services
class MockMidiService {
    activeNotes = () => new Set<number>();
}

class MockEvaluationService {
    evaluateNote() { return { correct: true, score: 100 }; }
}

class MockPianoSoundService {
    playNote() { }
    stopNote() { }
}

const meta: Meta<ScrollingPlayerComponent> = {
    title: 'Components/ScrollingPlayer',
    component: ScrollingPlayerComponent,
    tags: ['autodocs'],
    decorators: [
        moduleMetadata({
            imports: [
                CommonModule,
                BrowserAnimationsModule,
                MatButtonModule,
                MatIconModule,
                MatSliderModule,
                MatButtonToggleModule,
                MatProgressBarModule,
            ],
            providers: [
                { provide: MidiService, useClass: MockMidiService },
                { provide: EvaluationService, useClass: MockEvaluationService },
                { provide: PianoSoundService, useClass: MockPianoSoundService },
            ],
        }),
    ],
    argTypes: {
        completed: { action: 'completed' },
        paused: { action: 'paused' },
    },
};

export default meta;
type Story = StoryObj<ScrollingPlayerComponent>;

// Helper to create single notes
function note(midi: number, duration: number, hand: 'right' | 'left'): SingleNoteDTO {
    return { midi, duration, hand };
}

// Helper to create chord notes
function chord(midi: number[], duration: number, hand: 'right' | 'left'): ChordNoteDTO {
    return { midi, duration, hand };
}

// Simple C Major Scale - Right Hand
const cMajorScaleLesson: LessonDTO = {
    title: 'C Major Scale',
    description: 'Practice the C major scale',
    tempo: 120,
    time_signature: '4/4',
    key_signature: 'C',
    total_beats: 8,
    total_seconds: 4,
    measures: [
        {
            number: 1,
            notes: [
                note(60, 1, 'right'), // C4
                note(62, 1, 'right'), // D4
                note(64, 1, 'right'), // E4
                note(65, 1, 'right'), // F4
            ]
        },
        {
            number: 2,
            notes: [
                note(67, 1, 'right'), // G4
                note(69, 1, 'right'), // A4
                note(71, 1, 'right'), // B4
                note(72, 1, 'right'), // C5
            ]
        },
    ]
};

// Simple melody with left hand bass
const twoHandLesson: LessonDTO = {
    title: 'Two Hand Exercise',
    description: 'Practice coordinating both hands',
    tempo: 100,
    time_signature: '4/4',
    key_signature: 'C',
    total_beats: 16,
    total_seconds: 9.6,
    measures: [
        {
            number: 1,
            notes: [
                note(48, 2, 'left'),  // C3 (bass)
                note(60, 1, 'right'), // C4
                note(64, 1, 'right'), // E4
            ]
        },
        {
            number: 2,
            notes: [
                note(55, 2, 'left'),  // G3 (bass)
                note(67, 1, 'right'), // G4
                note(71, 1, 'right'), // B4
            ]
        },
        {
            number: 3,
            notes: [
                note(53, 2, 'left'),  // F3 (bass)
                note(65, 1, 'right'), // F4
                note(69, 1, 'right'), // A4
            ]
        },
        {
            number: 4,
            notes: [
                note(48, 4, 'left'),  // C3 (bass, whole note)
                note(60, 2, 'right'), // C4 (half)
                note(64, 2, 'right'), // E4 (half)
            ]
        },
    ]
};

// Lesson with chords
const chordLesson: LessonDTO = {
    title: 'Chord Practice',
    description: 'Practice playing chords',
    tempo: 80,
    time_signature: '4/4',
    key_signature: 'C',
    total_beats: 12,
    total_seconds: 9,
    measures: [
        {
            number: 1,
            notes: [
                chord([60, 64, 67], 2, 'right'), // C Major
                chord([62, 65, 69], 2, 'right'), // D minor
            ]
        },
        {
            number: 2,
            notes: [
                chord([64, 67, 71], 2, 'right'), // E minor
                chord([65, 69, 72], 2, 'right'), // F Major
            ]
        },
        {
            number: 3,
            notes: [
                chord([67, 71, 74], 4, 'right'), // G Major (whole note)
            ]
        },
    ]
};

// Fast tempo lesson
const fastTempoLesson: LessonDTO = {
    title: 'Speed Exercise',
    description: 'Quick sixteenth notes',
    tempo: 180,
    time_signature: '4/4',
    key_signature: 'C',
    total_beats: 4,
    total_seconds: 1.33,
    measures: [
        {
            number: 1,
            notes: [
                note(60, 0.25, 'right'),
                note(62, 0.25, 'right'),
                note(64, 0.25, 'right'),
                note(65, 0.25, 'right'),
                note(67, 0.25, 'right'),
                note(69, 0.25, 'right'),
                note(71, 0.25, 'right'),
                note(72, 0.25, 'right'),
                note(71, 0.25, 'right'),
                note(69, 0.25, 'right'),
                note(67, 0.25, 'right'),
                note(65, 0.25, 'right'),
                note(64, 0.25, 'right'),
                note(62, 0.25, 'right'),
                note(60, 0.5, 'right'),
            ]
        },
    ]
};

// Wide range lesson
const wideRangeLesson: LessonDTO = {
    title: 'Wide Range Exercise',
    description: 'Notes across multiple octaves',
    tempo: 90,
    time_signature: '4/4',
    key_signature: 'C',
    total_beats: 8,
    total_seconds: 5.33,
    measures: [
        {
            number: 1,
            notes: [
                note(36, 1, 'left'),  // C2 (very low)
                note(48, 1, 'left'),  // C3
                note(60, 1, 'right'), // C4
                note(72, 1, 'right'), // C5
            ]
        },
        {
            number: 2,
            notes: [
                note(84, 1, 'right'), // C6
                note(72, 1, 'right'), // C5
                note(60, 1, 'right'), // C4
                note(48, 1, 'left'),  // C3
            ]
        },
    ]
};

/**
 * Default scrolling player with C Major scale
 * Click the play button to start the lesson
 */
export const Default: Story = {
    args: {
        lesson: cMajorScaleLesson,
        activeNotes: [],
    },
    play: async ({ canvasElement }) => {
        // Instructions for manual testing
        console.log('Click the play button (▶) in the top left to start the lesson');
        console.log('Notes will scroll from right to left');
        console.log('Use the tempo slider to adjust speed (25% to 150%)');
        console.log('Toggle between Flow mode (continuous) and Wait mode (step-by-step)');
    },
};

/**
 * Two hand coordination exercise
 */
export const TwoHands: Story = {
    args: {
        lesson: twoHandLesson,
        activeNotes: [],
    },
};

/**
 * Chord practice lesson
 */
export const WithChords: Story = {
    args: {
        lesson: chordLesson,
        activeNotes: [],
    },
};

/**
 * Fast tempo exercise
 */
export const FastTempo: Story = {
    args: {
        lesson: fastTempoLesson,
        activeNotes: [],
    },
};

/**
 * Wide range across multiple octaves
 */
export const WideRange: Story = {
    args: {
        lesson: wideRangeLesson,
        activeNotes: [],
    },
};

/**
 * Empty state - no lesson loaded
 */
export const NoLesson: Story = {
    args: {
        lesson: null,
        activeNotes: [],
    },
};

/**
 * With active notes being played
 */
export const WithActiveNotes: Story = {
    args: {
        lesson: cMajorScaleLesson,
        activeNotes: [60, 64, 67], // C Major chord
    },
};

/**
 * Auto-play demonstration (Flow mode)
 * This story automatically starts playing after a short delay
 */
export const AutoPlayDemo: Story = {
    args: {
        lesson: cMajorScaleLesson,
        activeNotes: [],
    },
    play: async ({ canvasElement }) => {
        const canvas = canvasElement.parentElement;
        if (!canvas) return;

        // Wait for component to initialize
        await new Promise(resolve => setTimeout(resolve, 500));

        // Find and click play button
        const playButton = canvas.querySelector('.pause-btn') as HTMLButtonElement;
        if (playButton) {
            playButton.click();
            console.log('Auto-started playback in Flow mode');
        }
    },
};

/**
 * Play to End Test
 * This story auto-plays and logs when the cursor reaches the end (completed event)
 */
export const PlayToEnd: Story = {
    args: {
        lesson: cMajorScaleLesson,
        activeNotes: [],
    },
    play: async ({ canvasElement, args, step }) => {
        const canvas = canvasElement.parentElement;
        if (!canvas) return;

        // Wait for component to initialize
        await new Promise(resolve => setTimeout(resolve, 500));

        // Find and click play button
        const playButton = canvas.querySelector('.pause-btn') as HTMLButtonElement;
        if (playButton) {
            playButton.click();
            console.log('Auto-started playback for PlayToEnd test');
        }

        // Listen for the completed event
        const host = canvas.closest('sb-preview-inner') || canvas.parentElement;
        if (!host) return;
        // Find the Angular component instance
        const ngComponent = (window as any).ng && (window as any).ng.getComponent ? (window as any).ng.getComponent(canvas) : null;
        if (ngComponent && ngComponent.completed) {
            ngComponent.completed.subscribe(() => {
                console.log('Playback completed: Cursor reached the end!');
                // Optionally, you can use step() for Storybook interaction
            });
        } else {
            // Fallback: Listen for DOM event
            canvas.addEventListener('completed', () => {
                console.log('Playback completed: Cursor reached the end! (DOM event)');
            });
        }
    },
};
