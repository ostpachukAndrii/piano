import { TestBed } from '@angular/core/testing';
import { EvaluationService } from './evaluation.service';
import { TauriService } from './tauri.service';
import { ProgressService } from './progress.service';
import { AchievementService } from './achievement.service';
import { SoundService } from './sound.service';
import { PianoSoundService } from './piano-sound.service';
import { EvaluationResult, SessionStats } from '../models';

describe('EvaluationService', () => {
    let service: EvaluationService;
    let mockTauri: jasmine.SpyObj<TauriService>;
    let mockProgress: jasmine.SpyObj<ProgressService>;
    let mockAchievement: jasmine.SpyObj<AchievementService>;
    let mockSound: jasmine.SpyObj<SoundService>;
    let mockPiano: jasmine.SpyObj<PianoSoundService>;

    // Test data factories
    const createEvaluationResult = (overrides: Partial<EvaluationResult> = {}): EvaluationResult => ({
        pitch_correct: true,
        timing_correct: true,
        duration_correct: true,
        feedback: 'Perfect',
        score: 100,
        message: 'Perfect!',
        timing_offset_ms: 0,
        duration_diff_percent: 0,
        ...overrides
    });

    const createSessionStats = (overrides: Partial<SessionStats> = {}): SessionStats => ({
        total_notes: 10,
        correct_notes: 8,
        perfect_notes: 5,
        current_streak: 3,
        best_streak: 5,
        accuracy: 80,
        average_score: 75,
        ...overrides
    });

    // Helper to setup invoke mock with command routing
    const setupInvokeMock = (
        checkPitchResult: EvaluationResult = createEvaluationResult(),
        checkNoteResult: EvaluationResult = createEvaluationResult(),
        statsResult: SessionStats = createSessionStats()
    ) => {
        mockTauri.invoke.and.callFake(((command: string) => {
            switch (command) {
                case 'check_pitch':
                    return Promise.resolve(checkPitchResult);
                case 'check_note':
                    return Promise.resolve(checkNoteResult);
                case 'get_stats':
                    return Promise.resolve(statsResult);
                case 'reset_stats':
                    return Promise.resolve();
                default:
                    return Promise.resolve();
            }
        }) as typeof mockTauri.invoke);
    };

    beforeEach(() => {
        // Create mock services
        mockTauri = jasmine.createSpyObj('TauriService', ['invoke', 'listen', 'unlisten']);
        mockProgress = jasmine.createSpyObj('ProgressService', ['awardNoteXP', 'awardLessonXP']);
        mockAchievement = jasmine.createSpyObj('AchievementService', ['onPerfectNote', 'onWrongNote', 'onLessonComplete']);
        mockSound = jasmine.createSpyObj('SoundService', ['play']);
        mockPiano = jasmine.createSpyObj('PianoSoundService', ['playNote']);

        // Default mock implementations
        setupInvokeMock();
        mockTauri.listen.and.returnValue(Promise.resolve() as any);
        mockTauri.unlisten.and.returnValue(Promise.resolve() as any);

        TestBed.configureTestingModule({
            providers: [
                EvaluationService,
                { provide: TauriService, useValue: mockTauri },
                { provide: ProgressService, useValue: mockProgress },
                { provide: AchievementService, useValue: mockAchievement },
                { provide: SoundService, useValue: mockSound },
                { provide: PianoSoundService, useValue: mockPiano }
            ]
        });

        service = TestBed.inject(EvaluationService);
    });

    describe('Initialization', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });

        it('should have null initial state', () => {
            expect(service.lastResult()).toBeNull();
            expect(service.stats()).toBeNull();
            expect(service.isEvaluating()).toBeFalse();
        });

        it('should have zero computed values initially', () => {
            expect(service.currentStreak()).toBe(0);
            expect(service.accuracy()).toBe(0);
            expect(service.totalNotes()).toBe(0);
        });

        it('should set up event listener on initialize', async () => {
            await service.initialize();

            expect(mockTauri.listen).toHaveBeenCalledWith('note_evaluated', jasmine.any(Function));
        });

        it('should refresh stats on initialize', async () => {
            await service.initialize();

            expect(mockTauri.invoke).toHaveBeenCalledWith('get_stats');
            expect(service.stats()).toBeTruthy();
        });

        it('should update lastResult when event received', async () => {
            let eventCallback: (result: EvaluationResult) => void;
            mockTauri.listen.and.callFake(((event: string, callback: (result: EvaluationResult) => void) => {
                eventCallback = callback;
                return Promise.resolve();
            }) as any);

            await service.initialize();

            const result = createEvaluationResult({ feedback: 'Good', score: 85 });
            eventCallback!(result);

            expect(service.lastResult()).toEqual(result);
        });
    });

    describe('checkPitch()', () => {
        it('should invoke check_pitch Tauri command', async () => {
            await service.checkPitch(60, 60);

            expect(mockTauri.invoke).toHaveBeenCalledWith('check_pitch', {
                playedMidi: 60,
                expectedMidi: 60
            });
        });

        it('should set isEvaluating to true during evaluation', async () => {
            let resolvePromise: (value: EvaluationResult) => void;
            mockTauri.invoke.and.callFake(((command: string) => {
                if (command === 'check_pitch') {
                    return new Promise<EvaluationResult>(resolve => { resolvePromise = resolve; });
                }
                return Promise.resolve(createSessionStats());
            }) as any);

            const evalPromise = service.checkPitch(60, 60);
            expect(service.isEvaluating()).toBeTrue();

            resolvePromise!(createEvaluationResult());
            await evalPromise;

            expect(service.isEvaluating()).toBeFalse();
        });

        it('should update lastResult signal', async () => {
            const result = createEvaluationResult({ feedback: 'Good', score: 85 });
            setupInvokeMock(result);

            await service.checkPitch(60, 60);

            expect(service.lastResult()).toEqual(result);
        });

        it('should refresh stats after evaluation', async () => {
            await service.checkPitch(60, 60);

            expect(mockTauri.invoke).toHaveBeenCalledWith('get_stats');
        });

        it('should return evaluation result', async () => {
            const expected = createEvaluationResult({ feedback: 'Perfect', score: 100 });
            setupInvokeMock(expected);

            const result = await service.checkPitch(60, 60);

            expect(result).toEqual(expected);
        });

        describe('XP Awards', () => {
            it('should award XP for correct note', async () => {
                const result = createEvaluationResult({ pitch_correct: true, score: 85 });
                setupInvokeMock(result);

                await service.checkPitch(60, 60);

                expect(mockProgress.awardNoteXP).toHaveBeenCalledWith(true, false);
            });

            it('should award perfect XP for score >= 100', async () => {
                const result = createEvaluationResult({ pitch_correct: true, score: 100 });
                setupInvokeMock(result);

                await service.checkPitch(60, 60);

                expect(mockProgress.awardNoteXP).toHaveBeenCalledWith(true, true);
            });

            it('should award wrong note XP for incorrect pitch', async () => {
                const result = createEvaluationResult({ pitch_correct: false, score: 0, feedback: 'Wrong' });
                setupInvokeMock(result);

                await service.checkPitch(60, 62);

                expect(mockProgress.awardNoteXP).toHaveBeenCalledWith(false, false);
            });
        });

        describe('Achievement Tracking', () => {
            it('should track perfect note achievement', async () => {
                const result = createEvaluationResult({ pitch_correct: true, score: 100, feedback: 'Perfect' });
                setupInvokeMock(result);

                await service.checkPitch(60, 60);

                expect(mockAchievement.onPerfectNote).toHaveBeenCalled();
            });

            it('should track wrong note achievement', async () => {
                const result = createEvaluationResult({ pitch_correct: false, score: 0, feedback: 'Wrong' });
                setupInvokeMock(result);

                await service.checkPitch(60, 62);

                expect(mockAchievement.onWrongNote).toHaveBeenCalled();
            });

            it('should not track achievement for Good but not Perfect', async () => {
                const result = createEvaluationResult({ pitch_correct: true, score: 85, feedback: 'Good' });
                setupInvokeMock(result);

                await service.checkPitch(60, 60);

                expect(mockAchievement.onPerfectNote).not.toHaveBeenCalled();
                expect(mockAchievement.onWrongNote).not.toHaveBeenCalled();
            });
        });

        describe('Sound Feedback', () => {
            it('should play piano note for perfect correct note', async () => {
                const result = createEvaluationResult({ pitch_correct: true, score: 100, feedback: 'Perfect' });
                setupInvokeMock(result);

                await service.checkPitch(60, 60);

                expect(mockPiano.playNote).toHaveBeenCalledWith(60, 100, 0.5);
            });

            it('should play softer piano note for correct but not perfect', async () => {
                const result = createEvaluationResult({ pitch_correct: true, score: 85, feedback: 'Good' });
                setupInvokeMock(result);

                await service.checkPitch(60, 60);

                expect(mockPiano.playNote).toHaveBeenCalledWith(60, 80, 0.4);
            });

            it('should play wrong note sound for incorrect pitch', async () => {
                const result = createEvaluationResult({ pitch_correct: false, score: 0, feedback: 'Wrong' });
                setupInvokeMock(result);

                await service.checkPitch(60, 62);

                expect(mockSound.play).toHaveBeenCalledWith('wrongNote');
                expect(mockPiano.playNote).not.toHaveBeenCalled();
            });

            it('should not play piano for wrong notes', async () => {
                const result = createEvaluationResult({ pitch_correct: false, feedback: 'Wrong' });
                setupInvokeMock(result);

                await service.checkPitch(60, 62);

                expect(mockPiano.playNote).not.toHaveBeenCalled();
            });
        });

        describe('Streak Combo Sound', () => {
            it('should play combo sound at streak of 10', async () => {
                const stats = createSessionStats({ current_streak: 10 });
                setupInvokeMock(createEvaluationResult(), createEvaluationResult(), stats);

                await service.checkPitch(60, 60);

                expect(mockSound.play).toHaveBeenCalledWith('combo');
            });

            it('should play combo sound at streak multiples of 5 (15, 20, etc)', async () => {
                const stats = createSessionStats({ current_streak: 15 });
                setupInvokeMock(createEvaluationResult(), createEvaluationResult(), stats);

                await service.checkPitch(60, 60);

                expect(mockSound.play).toHaveBeenCalledWith('combo');
            });

            it('should not play combo sound below streak of 10', async () => {
                const stats = createSessionStats({ current_streak: 5 });
                setupInvokeMock(createEvaluationResult(), createEvaluationResult(), stats);

                await service.checkPitch(60, 60);

                expect(mockSound.play).not.toHaveBeenCalledWith('combo');
            });

            it('should not play combo sound at non-multiple of 5', async () => {
                const stats = createSessionStats({ current_streak: 12 });
                setupInvokeMock(createEvaluationResult(), createEvaluationResult(), stats);

                await service.checkPitch(60, 60);

                expect(mockSound.play).not.toHaveBeenCalledWith('combo');
            });
        });
    });

    describe('checkNote()', () => {
        it('should invoke check_note Tauri command with all parameters', async () => {
            await service.checkNote(60, 60, 1000, 1000, 500, 500);

            expect(mockTauri.invoke).toHaveBeenCalledWith('check_note', {
                playedMidi: 60,
                expectedMidi: 60,
                playedTimeMs: 1000,
                expectedTimeMs: 1000,
                playedDurationMs: 500,
                expectedDurationMs: 500
            });
        });

        it('should pass undefined timing parameters when not provided', async () => {
            await service.checkNote(60, 60);

            expect(mockTauri.invoke).toHaveBeenCalledWith('check_note', {
                playedMidi: 60,
                expectedMidi: 60,
                playedTimeMs: undefined,
                expectedTimeMs: undefined,
                playedDurationMs: undefined,
                expectedDurationMs: undefined
            });
        });

        it('should update lastResult signal', async () => {
            const result = createEvaluationResult({ feedback: 'Good', timing_correct: false });
            setupInvokeMock(createEvaluationResult(), result);

            await service.checkNote(60, 60, 1000, 1050);

            expect(service.lastResult()).toEqual(result);
        });

        it('should set isEvaluating during evaluation', async () => {
            let resolvePromise: (value: EvaluationResult) => void;
            mockTauri.invoke.and.callFake(((command: string) => {
                if (command === 'check_note') {
                    return new Promise<EvaluationResult>(resolve => { resolvePromise = resolve; });
                }
                return Promise.resolve(createSessionStats());
            }) as any);

            const evalPromise = service.checkNote(60, 60);
            expect(service.isEvaluating()).toBeTrue();

            resolvePromise!(createEvaluationResult());
            await evalPromise;

            expect(service.isEvaluating()).toBeFalse();
        });

        it('should refresh stats after evaluation', async () => {
            await service.checkNote(60, 60);

            expect(mockTauri.invoke).toHaveBeenCalledWith('get_stats');
        });
    });

    describe('checkChord()', () => {
        it('should evaluate each played note against expected', async () => {
            const results = await service.checkChord([60, 64, 67], [60, 64, 67]);

            expect(results.length).toBe(3);
        });

        it('should match exact notes first', async () => {
            await service.checkChord([60, 64], [60, 64]);

            expect(mockTauri.invoke).toHaveBeenCalledWith('check_pitch', {
                playedMidi: 60,
                expectedMidi: 60
            });
            expect(mockTauri.invoke).toHaveBeenCalledWith('check_pitch', {
                playedMidi: 64,
                expectedMidi: 64
            });
        });

        it('should handle extra played notes', async () => {
            // When more notes are played than expected, only matched notes are evaluated
            // Extra notes without corresponding expected notes are not evaluated
            const results = await service.checkChord([60, 64, 67], [60, 64]);

            // Only 2 results because 67 has no expected note to compare against
            expect(results.length).toBe(2);
        });

        it('should handle wrong notes in chord', async () => {
            await service.checkChord([60, 65], [60, 64]);

            expect(mockTauri.invoke).toHaveBeenCalledWith('check_pitch', {
                playedMidi: 60,
                expectedMidi: 60
            });
            expect(mockTauri.invoke).toHaveBeenCalledWith('check_pitch', {
                playedMidi: 65,
                expectedMidi: 64
            });
        });

        it('should return array of evaluation results', async () => {
            const perfectResult = createEvaluationResult({ feedback: 'Perfect' });
            const wrongResult = createEvaluationResult({ feedback: 'Wrong', pitch_correct: false });

            let callCount = 0;
            mockTauri.invoke.and.callFake(((command: string) => {
                if (command === 'check_pitch') {
                    callCount++;
                    return Promise.resolve(callCount === 1 ? perfectResult : wrongResult);
                }
                return Promise.resolve(createSessionStats());
            }) as any);

            const results = await service.checkChord([60, 65], [60, 64]);

            expect(results[0].feedback).toBe('Perfect');
            expect(results[1].feedback).toBe('Wrong');
        });
    });

    describe('Statistics Management', () => {
        describe('getStats()', () => {
            it('should invoke get_stats Tauri command', async () => {
                await service.getStats();

                expect(mockTauri.invoke).toHaveBeenCalledWith('get_stats');
            });

            it('should update stats signal', async () => {
                const stats = createSessionStats({ accuracy: 95, total_notes: 20 });
                setupInvokeMock(createEvaluationResult(), createEvaluationResult(), stats);

                await service.getStats();

                expect(service.stats()).toEqual(stats);
            });

            it('should return stats', async () => {
                const expected = createSessionStats();
                setupInvokeMock(createEvaluationResult(), createEvaluationResult(), expected);

                const result = await service.getStats();

                expect(result).toEqual(expected);
            });

            it('should update computed signals', async () => {
                const stats = createSessionStats({
                    current_streak: 7,
                    accuracy: 85,
                    total_notes: 25
                });
                setupInvokeMock(createEvaluationResult(), createEvaluationResult(), stats);

                await service.getStats();

                expect(service.currentStreak()).toBe(7);
                expect(service.accuracy()).toBe(85);
                expect(service.totalNotes()).toBe(25);
            });
        });

        describe('refreshStats()', () => {
            it('should call getStats', async () => {
                await service.refreshStats();

                expect(mockTauri.invoke).toHaveBeenCalledWith('get_stats');
            });

            it('should handle errors gracefully', async () => {
                mockTauri.invoke.and.returnValue(Promise.reject(new Error('Network error')));

                await expectAsync(service.refreshStats()).toBeResolved();
            });
        });

        describe('resetStats()', () => {
            it('should invoke reset_stats Tauri command', async () => {
                await service.resetStats();

                expect(mockTauri.invoke).toHaveBeenCalledWith('reset_stats');
            });

            it('should clear stats signal', async () => {
                await service.getStats();
                expect(service.stats()).not.toBeNull();

                await service.resetStats();

                expect(service.stats()).toBeNull();
            });

            it('should clear lastResult signal', async () => {
                await service.checkPitch(60, 60);
                expect(service.lastResult()).not.toBeNull();

                await service.resetStats();

                expect(service.lastResult()).toBeNull();
            });

            it('should reset computed signals to zero', async () => {
                const stats = createSessionStats({ current_streak: 10 });
                setupInvokeMock(createEvaluationResult(), createEvaluationResult(), stats);
                await service.getStats();
                expect(service.currentStreak()).toBe(10);

                await service.resetStats();

                expect(service.currentStreak()).toBe(0);
                expect(service.accuracy()).toBe(0);
                expect(service.totalNotes()).toBe(0);
            });
        });
    });

    describe('Lesson Completion', () => {
        describe('awardLessonCompletionXP()', () => {
            it('should award lesson XP based on accuracy', async () => {
                const stats = createSessionStats({ accuracy: 85 });
                setupInvokeMock(createEvaluationResult(), createEvaluationResult(), stats);
                await service.getStats();

                service.awardLessonCompletionXP();

                expect(mockProgress.awardLessonXP).toHaveBeenCalledWith(85);
            });

            it('should track lesson completion achievement', async () => {
                const stats = createSessionStats({ accuracy: 95 });
                setupInvokeMock(createEvaluationResult(), createEvaluationResult(), stats);
                await service.getStats();

                service.awardLessonCompletionXP();

                expect(mockAchievement.onLessonComplete).toHaveBeenCalledWith(95);
            });

            it('should not award if stats are null', () => {
                expect(service.stats()).toBeNull();

                service.awardLessonCompletionXP();

                expect(mockProgress.awardLessonXP).not.toHaveBeenCalled();
                expect(mockAchievement.onLessonComplete).not.toHaveBeenCalled();
            });
        });
    });

    describe('Cleanup', () => {
        it('should unlisten from note_evaluated event', async () => {
            await service.cleanup();

            expect(mockTauri.unlisten).toHaveBeenCalledWith('note_evaluated');
        });
    });

    describe('Error Handling', () => {
        it('should reset isEvaluating on checkPitch error', async () => {
            mockTauri.invoke.and.returnValue(Promise.reject(new Error('Backend error')));

            await expectAsync(service.checkPitch(60, 60)).toBeRejected();

            expect(service.isEvaluating()).toBeFalse();
        });

        it('should reset isEvaluating on checkNote error', async () => {
            mockTauri.invoke.and.returnValue(Promise.reject(new Error('Backend error')));

            await expectAsync(service.checkNote(60, 60)).toBeRejected();

            expect(service.isEvaluating()).toBeFalse();
        });
    });

    describe('Edge Cases', () => {
        it('should handle evaluation of same note multiple times', async () => {
            await service.checkPitch(60, 60);
            await service.checkPitch(60, 60);
            await service.checkPitch(60, 60);

            // 3 check_pitch + 3 get_stats = 6 calls
            expect(mockTauri.invoke).toHaveBeenCalledTimes(6);
        });

        it('should handle rapid sequential evaluations', async () => {
            const promises = [
                service.checkPitch(60, 60),
                service.checkPitch(64, 64),
                service.checkPitch(67, 67)
            ];

            await Promise.all(promises);

            expect(mockTauri.invoke).toHaveBeenCalledWith('check_pitch', { playedMidi: 60, expectedMidi: 60 });
            expect(mockTauri.invoke).toHaveBeenCalledWith('check_pitch', { playedMidi: 64, expectedMidi: 64 });
            expect(mockTauri.invoke).toHaveBeenCalledWith('check_pitch', { playedMidi: 67, expectedMidi: 67 });
        });

        it('should handle empty chord', async () => {
            const results = await service.checkChord([], [60, 64]);

            expect(results.length).toBe(0);
        });

        it('should handle chord with more expected than played', async () => {
            const results = await service.checkChord([60], [60, 64, 67]);

            expect(results.length).toBe(1);
        });
    });
});
