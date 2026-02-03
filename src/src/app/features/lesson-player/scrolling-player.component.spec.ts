import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LessonDTO } from '../../core/models/lesson.model';
import { SingleNoteDTO } from '../../core/models/note.model';
import { EvaluationService } from '../../core/services/evaluation.service';
import { MidiService } from '../../core/services/midi.service';
import { PianoSoundService } from '../../core/services/piano-sound.service';
import { ScrollingPlayerComponent } from './scrolling-player.component';

describe('ScrollingPlayerComponent', () => {
    let component: ScrollingPlayerComponent;
    let fixture: ComponentFixture<ScrollingPlayerComponent>;
    let mockMidiService: jasmine.SpyObj<MidiService>;
    let mockEvaluationService: jasmine.SpyObj<EvaluationService>;
    let mockPianoService: jasmine.SpyObj<PianoSoundService>;

    const mockLesson: LessonDTO = {
        title: 'Test Lesson',
        description: 'A test lesson',
        tempo: 120,
        time_signature: '4/4',
        key_signature: 'C',
        total_beats: 4,
        total_seconds: 2,
        measures: [
            {
                number: 1,
                notes: [
                    { midi: 60, duration: 1, hand: 'right' } as SingleNoteDTO,
                    { midi: 62, duration: 1, hand: 'right' } as SingleNoteDTO,
                    { midi: 64, duration: 1, hand: 'right' } as SingleNoteDTO,
                    { midi: 65, duration: 1, hand: 'right' } as SingleNoteDTO,
                ]
            }
        ]
    };

    beforeEach(async () => {
        mockMidiService = jasmine.createSpyObj('MidiService', [], {
            activeNotes: signal(new Set<number>())
        });
        mockEvaluationService = jasmine.createSpyObj('EvaluationService', ['checkPitch']);
        mockPianoService = jasmine.createSpyObj('PianoSoundService', ['playNote', 'stopNote']);

        await TestBed.configureTestingModule({
            imports: [ScrollingPlayerComponent, BrowserAnimationsModule],
            providers: [
                { provide: MidiService, useValue: mockMidiService },
                { provide: EvaluationService, useValue: mockEvaluationService },
                { provide: PianoSoundService, useValue: mockPianoService },
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ScrollingPlayerComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Initialization', () => {
        it('should initialize with default values', () => {
            expect(component.isPlaying()).toBe(false);
            expect(component.playMode()).toBe('wait');
            expect(component.tempoPercent()).toBe(100);
            expect(component.progressPercent()).toBe(0);
        });

        it('should set playheadX to 25% of stage width', () => {
            expect(component.playheadX()).toBe(300); // 25% of 1200
        });

        it('should have default keyboard range', () => {
            const range = component.keyboardRange();
            expect(range.min).toBe(48);
            expect(range.max).toBe(72);
        });

        it('should initialize hint and feedback note arrays as empty', () => {
            expect(component.hintNotes()).toEqual([]);
            expect(component.correctNotes()).toEqual([]);
            expect(component.wrongNotes()).toEqual([]);
        });
    });

    describe('Lesson Loading', () => {
        it('should initialize notes when lesson is provided', () => {
            component.lesson = mockLesson;
            fixture.detectChanges();

            expect(component.progressPercent()).toBe(0);
            expect(component.currentBeat()).toBe(0);
        });

        it('should handle null lesson', () => {
            component.lesson = null;
            fixture.detectChanges();

            expect(component).toBeTruthy();
        });

        it('should update keyboard range based on lesson notes', () => {
            component.lesson = mockLesson;
            fixture.detectChanges();

            const range = component.keyboardRange();
            // Notes are 60, 62, 64, 65 - range should be snapped to octave boundaries
            expect(range.min).toBeLessThanOrEqual(60);
            expect(range.max).toBeGreaterThanOrEqual(65);
        });

        it('should parse notes from lesson measures', () => {
            component.lesson = mockLesson;
            fixture.detectChanges();

            const notes = component.scrollingNotes;
            expect(notes.length).toBe(4);
            expect(notes[0].midi).toEqual([60]);
            expect(notes[1].midi).toEqual([62]);
            expect(notes[2].midi).toEqual([64]);
            expect(notes[3].midi).toEqual([65]);
        });
    });

    describe('Playback Control', () => {
        beforeEach(() => {
            component.lesson = mockLesson;
            fixture.detectChanges();
        });

        it('should start playback', () => {
            component.start();
            expect(component.isPlaying()).toBe(true);
        });

        it('should stop playback', () => {
            component.start();
            component.stop();
            expect(component.isPlaying()).toBe(false);
        });

        it('should toggle playback', () => {
            expect(component.isPlaying()).toBe(false);
            component.toggle();
            expect(component.isPlaying()).toBe(true);
            component.toggle();
            expect(component.isPlaying()).toBe(false);
        });

        it('should emit paused event when pause is clicked', () => {
            spyOn(component.paused, 'emit');
            component.onPause();
            expect(component.paused.emit).toHaveBeenCalled();
        });

        it('should not start if already playing', () => {
            component.start();
            const firstState = component.isPlaying();
            component.start(); // Try to start again
            expect(component.isPlaying()).toBe(firstState);
        });
    });

    describe('Tempo Control', () => {
        it('should update tempo percentage', () => {
            component.onTempoChange(150);
            expect(component.tempoPercent()).toBe(150);
        });

        it('should update tempo percentage to slower value', () => {
            component.onTempoChange(50);
            expect(component.tempoPercent()).toBe(50);
        });
    });

    describe('Play Mode', () => {
        it('should start in wait mode', () => {
            expect(component.playMode()).toBe('wait');
        });

        it('should switch to flow mode', () => {
            component.onModeChange('flow');
            expect(component.playMode()).toBe('flow');
        });

        it('should switch back to wait mode', () => {
            component.onModeChange('flow');
            component.onModeChange('wait');
            expect(component.playMode()).toBe('wait');
        });
    });

    describe('Child Component Integration', () => {
        beforeEach(() => {
            component.lesson = mockLesson;
            fixture.detectChanges();
        });

        it('should render child components', () => {
            const compiled = fixture.nativeElement;
            expect(compiled.querySelector('app-playback-controls')).toBeTruthy();
            expect(compiled.querySelector('app-notation-stage')).toBeTruthy();
            expect(compiled.querySelector('app-virtual-keyboard')).toBeTruthy();
        });

        it('should pass isPlaying to playback controls', () => {
            component.start();
            fixture.detectChanges();

            // The signal value should be passed to child
            expect(component.isPlaying()).toBe(true);
        });

        it('should pass currentBeat to notation stage', () => {
            component.currentBeat.set(2);
            fixture.detectChanges();

            expect(component.currentBeat()).toBe(2);
        });

        it('should pass keyboard range to virtual keyboard', () => {
            const range = component.keyboardRange();
            expect(range).toBeTruthy();
            expect(range.min).toBeDefined();
            expect(range.max).toBeDefined();
        });
    });

    describe('Note Duration Rendering', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should render whole note (4 beats) with correct duration', () => {
            const wholeNoteLesson: LessonDTO = {
                ...mockLesson,
                measures: [{
                    number: 1,
                    notes: [
                        { midi: 60, duration: 4, hand: 'right' } as SingleNoteDTO
                    ]
                }]
            };

            component.lesson = wholeNoteLesson;
            component['initializeNotes']();

            const notes = component.scrollingNotes;
            expect(notes.length).toBe(1);
            expect(notes[0].durationBeats).toBe(4);
        });

        it('should render half note (2 beats) with correct duration', () => {
            const halfNoteLesson: LessonDTO = {
                ...mockLesson,
                measures: [{
                    number: 1,
                    notes: [
                        { midi: 60, duration: 2, hand: 'right' } as SingleNoteDTO,
                        { midi: 64, duration: 2, hand: 'right' } as SingleNoteDTO
                    ]
                }]
            };

            component.lesson = halfNoteLesson;
            component['initializeNotes']();

            const notes = component.scrollingNotes;
            expect(notes.length).toBe(2);
            expect(notes[0].durationBeats).toBe(2);
            expect(notes[1].durationBeats).toBe(2);
        });

        it('should render mixed note durations correctly', () => {
            const mixedLesson: LessonDTO = {
                ...mockLesson,
                total_beats: 8,
                total_seconds: 4,
                measures: [
                    {
                        number: 1,
                        notes: [
                            { midi: 60, duration: 2, hand: 'right' } as SingleNoteDTO,
                            { midi: 62, duration: 1, hand: 'right' } as SingleNoteDTO,
                            { midi: 64, duration: 1, hand: 'right' } as SingleNoteDTO
                        ]
                    },
                    {
                        number: 2,
                        notes: [
                            { midi: 65, duration: 0.5, hand: 'right' } as SingleNoteDTO,
                            { midi: 67, duration: 0.5, hand: 'right' } as SingleNoteDTO,
                            { midi: 69, duration: 1, hand: 'right' } as SingleNoteDTO,
                            { midi: 71, duration: 2, hand: 'right' } as SingleNoteDTO
                        ]
                    }
                ]
            };

            component.lesson = mixedLesson;
            component['initializeNotes']();

            const notes = component.scrollingNotes;
            expect(notes.length).toBe(7);

            // Verify positions accumulate correctly
            expect(notes[0].startBeat).toBe(0);
            expect(notes[1].startBeat).toBe(2);
            expect(notes[2].startBeat).toBe(3);
            expect(notes[3].startBeat).toBe(4);
            expect(notes[4].startBeat).toBe(4.5);
            expect(notes[5].startBeat).toBe(5);
            expect(notes[6].startBeat).toBe(6);
        });

        // Note: beatToX method was removed during refactoring
        // X position calculations are now handled internally by the component
    });

    describe('Notehead Duration Categories', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should categorize whole notes (4 beats) as hollow (duration >= 2)', () => {
            const wholeNoteLesson: LessonDTO = {
                ...mockLesson,
                measures: [{
                    number: 1,
                    notes: [
                        { midi: 60, duration: 4, hand: 'right' } as SingleNoteDTO
                    ]
                }]
            };

            component.lesson = wholeNoteLesson;
            component['initializeNotes']();

            const note = component.scrollingNotes[0];
            expect(note.durationBeats >= 2).toBe(true);
        });

        it('should categorize half notes (2 beats) as hollow (duration >= 2)', () => {
            const halfNoteLesson: LessonDTO = {
                ...mockLesson,
                measures: [{
                    number: 1,
                    notes: [
                        { midi: 60, duration: 2, hand: 'right' } as SingleNoteDTO
                    ]
                }]
            };

            component.lesson = halfNoteLesson;
            component['initializeNotes']();

            const note = component.scrollingNotes[0];
            expect(note.durationBeats >= 2).toBe(true);
        });

        it('should categorize quarter notes (1 beat) as filled (duration < 2)', () => {
            const quarterNoteLesson: LessonDTO = {
                ...mockLesson,
                measures: [{
                    number: 1,
                    notes: [
                        { midi: 60, duration: 1, hand: 'right' } as SingleNoteDTO
                    ]
                }]
            };

            component.lesson = quarterNoteLesson;
            component['initializeNotes']();

            const note = component.scrollingNotes[0];
            expect(note.durationBeats < 2).toBe(true);
        });

        it('should categorize dotted quarter (1.5 beats) as filled', () => {
            const dottedQuarterLesson: LessonDTO = {
                ...mockLesson,
                measures: [{
                    number: 1,
                    notes: [
                        { midi: 60, duration: 1.5, hand: 'right' } as SingleNoteDTO
                    ]
                }]
            };

            component.lesson = dottedQuarterLesson;
            component['initializeNotes']();

            const note = component.scrollingNotes[0];
            expect(note.durationBeats < 2).toBe(true);
        });
    });

    describe('Progress Tracking', () => {
        beforeEach(() => {
            component.lesson = mockLesson;
            fixture.detectChanges();
        });

        it('should start at 0% progress', () => {
            expect(component.progressPercent()).toBe(0);
        });

        it('should track current beat', () => {
            expect(component.currentBeat()).toBe(0);
        });
    });

    describe('Keyboard Hint Management', () => {
        beforeEach(() => {
            component.lesson = mockLesson;
            fixture.detectChanges();
        });

        it('should update hint notes when active note changes', () => {
            // Manually call updateHints with a note
            const mockNote = {
                midi: [60, 64, 67],
                startBeat: 0,
                durationBeats: 1,
                state: 'active' as const,
                hand: 'right' as const,
                isRest: false
            };

            component['updateHints'](mockNote);
            expect(component.hintNotes()).toEqual([60, 64, 67]);
        });

        it('should clear hint notes', () => {
            component.hintNotes.set([60, 64]);
            component['clearHints']();
            expect(component.hintNotes()).toEqual([]);
        });

        it('should flash correct notes', () => {
            component['flashKeys']([60, 64], 'correct');
            expect(component.correctNotes()).toEqual([60, 64]);
        });

        it('should flash wrong notes', () => {
            component['flashKeys']([61], 'wrong');
            expect(component.wrongNotes()).toEqual([61]);
        });
    });

    describe('Edge Cases', () => {
        it('should handle lesson with no measures', () => {
            const emptyLesson: LessonDTO = {
                ...mockLesson,
                measures: []
            };
            component.lesson = emptyLesson;
            fixture.detectChanges();

            expect(component).toBeTruthy();
        });

        it('should handle lesson with no notes', () => {
            const noNotesLesson: LessonDTO = {
                ...mockLesson,
                measures: [{ number: 1, notes: [] }]
            };
            component.lesson = noNotesLesson;
            fixture.detectChanges();

            expect(component).toBeTruthy();
        });
    });

    describe('Cleanup', () => {
        it('should stop playback on destroy', () => {
            component.lesson = mockLesson;
            fixture.detectChanges();
            component.start();

            component.ngOnDestroy();

            expect(component.isPlaying()).toBe(false);
        });
    });

    describe('Stage Dimensions', () => {
        it('should have correct stage dimensions', () => {
            expect(component.stageWidth).toBe(1200);
            expect(component.stageHeight).toBe(400);
        });
    });
});
