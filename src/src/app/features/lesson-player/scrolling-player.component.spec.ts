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

    describe('Two-Hand Sequential Playing (Wait Mode)', () => {
        // This tests the feature where two-hand notes at the same beat position
        // can be played sequentially (one hand first, then the other) instead of
        // requiring simultaneous play

        const twoHandLesson: LessonDTO = {
            title: 'Two Hand Lesson',
            description: 'Test lesson with notes for both hands at same beat',
            tempo: 120,
            time_signature: '4/4',
            key_signature: 'C',
            total_beats: 4,
            total_seconds: 2,
            measures: [
                {
                    number: 1,
                    notes: [
                        // Right hand note at beat 0
                        { midi: 64, duration: 1, hand: 'right', start_beat: 0 } as SingleNoteDTO,
                        // Left hand note at beat 0 (same position)
                        { midi: 48, duration: 1, hand: 'left', start_beat: 0 } as SingleNoteDTO,
                        // Right hand note at beat 1
                        { midi: 65, duration: 1, hand: 'right', start_beat: 1 } as SingleNoteDTO,
                    ]
                }
            ]
        };

        beforeEach(() => {
            component.lesson = twoHandLesson;
            fixture.detectChanges();
        });

        it('should parse notes from both hands at same beat position', () => {
            const notes = component.scrollingNotes;

            // Should have 3 notes total
            expect(notes.length).toBe(3);

            // Find notes at beat 0
            const notesAtBeatZero = notes.filter(n => n.startBeat === 0);
            expect(notesAtBeatZero.length).toBe(2);

            // Both hands should be represented
            const hands = notesAtBeatZero.map(n => n.hand);
            expect(hands).toContain('right');
            expect(hands).toContain('left');
        });

        it('should show hints for both hands at the same beat position', () => {
            // The getActiveNotes method should return ALL notes at the current beat
            // Simulate being at beat 0 with both notes active
            const notes = component.scrollingNotes;

            // Make both notes at beat 0 active
            notes.filter(n => n.startBeat === 0).forEach(n => {
                n.state = 'active';
            });

            // Call updateHintsForNotes with both active notes
            const activeNotes = notes.filter(n => n.state === 'active');
            component['updateHintsForNotes'](activeNotes);

            const hints = component.hintNotes();
            // Should include both right hand (64) and left hand (48) notes
            expect(hints).toContain(64);
            expect(hints).toContain(48);
        });

        it('should have getActiveNotes return all notes at same beat position', () => {
            // Set current beat to 0
            component.currentBeat.set(0);

            // Make notes at beat 0 active
            const notes = component.scrollingNotes;
            notes.filter(n => n.startBeat === 0).forEach(n => {
                n.state = 'active';
            });

            // The private getActiveNotes method should return both notes
            const activeNotes = component['getActiveNotes']();

            expect(activeNotes.length).toBe(2);
            expect(activeNotes.map(n => n.hand)).toContain('right');
            expect(activeNotes.map(n => n.hand)).toContain('left');
        });

        it('should allow playing right hand first when both hands have notes', () => {
            // This tests that checkNoteHitWithLegato works for either hand

            const notes = component.scrollingNotes;
            const rightHandNote = notes.find(n => n.startBeat === 0 && n.hand === 'right')!;

            // Simulate playing right hand note (midi 64)
            const allActiveNotes = [64]; // Only right hand pressed
            const newlyPressedNotes = [64];

            // The checkNoteHitWithLegato should return true for the right hand note
            const result = component['checkNoteHitWithLegato'](
                rightHandNote,
                allActiveNotes,
                newlyPressedNotes
            );

            expect(result).toBe(true);
        });

        it('should allow playing left hand first when both hands have notes', () => {
            // This tests that checkNoteHitWithLegato works for either hand

            const notes = component.scrollingNotes;
            const leftHandNote = notes.find(n => n.startBeat === 0 && n.hand === 'left')!;

            // Simulate playing left hand note (midi 48)
            const allActiveNotes = [48]; // Only left hand pressed
            const newlyPressedNotes = [48];

            // The checkNoteHitWithLegato should return true for the left hand note
            const result = component['checkNoteHitWithLegato'](
                leftHandNote,
                allActiveNotes,
                newlyPressedNotes
            );

            expect(result).toBe(true);
        });

        it('should not hit note when wrong pitch is played', () => {
            const notes = component.scrollingNotes;
            const rightHandNote = notes.find(n => n.startBeat === 0 && n.hand === 'right')!;

            // Simulate playing wrong note (midi 60, expected 64)
            const allActiveNotes = [60]; // Wrong note
            const newlyPressedNotes = [60];

            const result = component['checkNoteHitWithLegato'](
                rightHandNote,
                allActiveNotes,
                newlyPressedNotes
            );

            expect(result).toBe(false);
        });

        it('should keep both hand notes separate in scrollingNotes', () => {
            const notes = component.scrollingNotes;

            // Each note should have its own entry (not combined into a chord)
            const rightHandAtZero = notes.find(n => n.startBeat === 0 && n.hand === 'right');
            const leftHandAtZero = notes.find(n => n.startBeat === 0 && n.hand === 'left');

            expect(rightHandAtZero).toBeTruthy();
            expect(leftHandAtZero).toBeTruthy();

            // Each should have only one MIDI value (not combined)
            expect(rightHandAtZero!.midi.length).toBe(1);
            expect(leftHandAtZero!.midi.length).toBe(1);
            expect(rightHandAtZero!.midi[0]).toBe(64);
            expect(leftHandAtZero!.midi[0]).toBe(48);
        });

        it('should handle disabled left hand correctly', () => {
            // Disable left hand
            component.leftHandEnabled.set(false);
            component.currentBeat.set(0);

            // Make notes at beat 0 active
            const notes = component.scrollingNotes;
            notes.filter(n => n.startBeat === 0).forEach(n => {
                n.state = 'active';
            });

            // getActiveNotes should only return right hand note
            const activeNotes = component['getActiveNotes']();

            expect(activeNotes.length).toBe(1);
            expect(activeNotes[0].hand).toBe('right');
        });

        it('should handle disabled right hand correctly', () => {
            // Disable right hand
            component.rightHandEnabled.set(false);
            component.currentBeat.set(0);

            // Make notes at beat 0 active
            const notes = component.scrollingNotes;
            notes.filter(n => n.startBeat === 0).forEach(n => {
                n.state = 'active';
            });

            // getActiveNotes should only return left hand note
            const activeNotes = component['getActiveNotes']();

            expect(activeNotes.length).toBe(1);
            expect(activeNotes[0].hand).toBe('left');
        });
    });

    describe('Wait Mode Resume Logic', () => {
        const twoHandLesson: LessonDTO = {
            title: 'Two Hand Lesson',
            description: 'Test lesson',
            tempo: 120,
            time_signature: '4/4',
            key_signature: 'C',
            total_beats: 4,
            total_seconds: 2,
            measures: [
                {
                    number: 1,
                    notes: [
                        { midi: 64, duration: 1, hand: 'right', start_beat: 0 } as SingleNoteDTO,
                        { midi: 48, duration: 1, hand: 'left', start_beat: 0 } as SingleNoteDTO,
                    ]
                }
            ]
        };

        beforeEach(() => {
            component.lesson = twoHandLesson;
            fixture.detectChanges();
            component.playMode.set('wait');
        });

        it('should be in wait mode by default', () => {
            expect(component.playMode()).toBe('wait');
        });

        it('should have both notes at the same beat position', () => {
            const notes = component.scrollingNotes;
            const notesAtZero = notes.filter(n => n.startBeat === 0);

            expect(notesAtZero.length).toBe(2);
        });

        it('should get all notes at current beat regardless of state', () => {
            component.currentBeat.set(0);

            const notes = component.scrollingNotes;
            // Mark one note as hit
            const rightHandNote = notes.find(n => n.hand === 'right')!;
            rightHandNote.state = 'hit';

            // Make left hand note active
            const leftHandNote = notes.find(n => n.hand === 'left')!;
            leftHandNote.state = 'active';

            // getAllNotesAtCurrentBeat should return BOTH notes (hit + active)
            const allNotes = component['getAllNotesAtCurrentBeat']();
            expect(allNotes.length).toBe(2);
        });

        it('should NOT resume when only one of multiple notes is matched', () => {
            component.currentBeat.set(0);

            const notes = component.scrollingNotes;
            notes.filter(n => n.startBeat === 0).forEach(n => {
                n.state = 'active';
            });

            // Get all notes at beat
            const allNotes = component['getAllNotesAtCurrentBeat']();
            expect(allNotes.length).toBe(2);

            // Only right hand pressed (64), left hand (48) not pressed
            const onlyRightHandPressed = [64];
            const allSatisfied = allNotes.every(note => {
                if (note.state === 'hit') return true;
                return component['checkNoteHitWithLegato'](note, onlyRightHandPressed, onlyRightHandPressed);
            });

            // Should NOT be satisfied - left hand note not pressed
            expect(allSatisfied).toBe(false);
        });

        it('should resume when ALL notes are matched (both hands pressed)', () => {
            component.currentBeat.set(0);

            const notes = component.scrollingNotes;
            notes.filter(n => n.startBeat === 0).forEach(n => {
                n.state = 'active';
            });

            // Get all notes at beat
            const allNotes = component['getAllNotesAtCurrentBeat']();

            // Both hands pressed
            const bothHandsPressed = [64, 48];
            const allSatisfied = allNotes.every(note => {
                if (note.state === 'hit') return true;
                return component['checkNoteHitWithLegato'](note, bothHandsPressed, bothHandsPressed);
            });

            // Should be satisfied - both notes pressed
            expect(allSatisfied).toBe(true);
        });

        it('should resume when notes are played sequentially (right hand hit, then left pressed)', () => {
            component.currentBeat.set(0);

            const notes = component.scrollingNotes;
            // Right hand already hit (played first)
            const rightHandNote = notes.find(n => n.hand === 'right')!;
            rightHandNote.state = 'hit';

            // Left hand still active
            const leftHandNote = notes.find(n => n.hand === 'left')!;
            leftHandNote.state = 'active';

            // Get all notes at beat
            const allNotes = component['getAllNotesAtCurrentBeat']();

            // Now left hand is pressed
            const leftHandPressed = [48];
            const allSatisfied = allNotes.every(note => {
                if (note.state === 'hit') return true;
                return component['checkNoteHitWithLegato'](note, leftHandPressed, leftHandPressed);
            });

            // Should be satisfied - right is hit, left is pressed
            expect(allSatisfied).toBe(true);
        });

        it('should resume when notes are played sequentially (left hand hit, then right pressed)', () => {
            component.currentBeat.set(0);

            const notes = component.scrollingNotes;
            // Left hand already hit (played first)
            const leftHandNote = notes.find(n => n.hand === 'left')!;
            leftHandNote.state = 'hit';

            // Right hand still active
            const rightHandNote = notes.find(n => n.hand === 'right')!;
            rightHandNote.state = 'active';

            // Get all notes at beat
            const allNotes = component['getAllNotesAtCurrentBeat']();

            // Now right hand is pressed
            const rightHandPressed = [64];
            const allSatisfied = allNotes.every(note => {
                if (note.state === 'hit') return true;
                return component['checkNoteHitWithLegato'](note, rightHandPressed, rightHandPressed);
            });

            // Should be satisfied - left is hit, right is pressed
            expect(allSatisfied).toBe(true);
        });
    });
});
