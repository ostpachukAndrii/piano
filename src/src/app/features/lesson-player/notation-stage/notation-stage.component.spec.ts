import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrollingNote } from '../models/scrolling-note.model';
import { NotationStageComponent } from './notation-stage.component';

describe('NotationStageComponent', () => {
    let component: NotationStageComponent;
    let fixture: ComponentFixture<NotationStageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NotationStageComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(NotationStageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Initialization', () => {
        it('should have default stage dimensions', () => {
            expect(component.stageWidth).toBe(1200);
            expect(component.stageHeight).toBe(400);
        });

        it('should have default playhead position at 25%', () => {
            expect(component.playheadX).toBe(300); // 25% of 1200
        });

        it('should have PIXELS_PER_BEAT constant', () => {
            expect(component.PIXELS_PER_BEAT).toBe(80);
        });
    });

    describe('Coordinate Calculations - beatToX', () => {
        beforeEach(() => {
            component.playheadX = 300;
            component.currentBeat = 0;
        });

        it('should return playhead position when beat equals currentBeat', () => {
            component.currentBeat = 2;
            const x = component.beatToX(2);
            expect(x).toBe(300); // playheadX
        });

        it('should place future beats to the right of playhead', () => {
            component.currentBeat = 0;
            const x = component.beatToX(1);
            // 1 beat ahead = playheadX + 80
            expect(x).toBe(380);
        });

        it('should place past beats to the left of playhead', () => {
            component.currentBeat = 2;
            const x = component.beatToX(1);
            // 1 beat behind = playheadX - 80
            expect(x).toBe(220);
        });

        it('should scale correctly with multiple beats', () => {
            component.currentBeat = 0;
            const x = component.beatToX(4);
            // 4 beats ahead = playheadX + (4 * 80)
            expect(x).toBe(620);
        });

        it('should handle fractional beats', () => {
            component.currentBeat = 0;
            const x = component.beatToX(0.5);
            // 0.5 beats ahead = playheadX + (0.5 * 80)
            expect(x).toBe(340);
        });
    });

    describe('Coordinate Calculations - midiToY', () => {
        const height = 400;

        it('should place right hand notes on treble staff', () => {
            const y1 = component.midiToY(60, 'right', height); // C4
            const y2 = component.midiToY(72, 'right', height); // C5

            // Higher notes should have lower Y values
            expect(y2).toBeLessThan(y1);
        });

        it('should place left hand notes on bass staff', () => {
            const y1 = component.midiToY(48, 'left', height); // C3
            const y2 = component.midiToY(36, 'left', height); // C2

            // Lower notes should have higher Y values
            expect(y2).toBeGreaterThan(y1);
        });

        it('should auto-detect treble for midi >= 60', () => {
            const yRight = component.midiToY(60, 'right', height);
            const yLeft = component.midiToY(60, 'left', height);

            // Both should be on treble staff (same position)
            expect(yRight).toBe(yLeft);
        });

        it('should return treble staff Y for high notes', () => {
            const y = component.midiToY(71, 'right', height); // B4 (reference)
            const trebleMiddle = height * 0.1 + (height * 0.35 / 5) * 2;

            expect(y).toBeCloseTo(trebleMiddle, 0);
        });

        it('should return bass staff Y for low notes', () => {
            const y = component.midiToY(50, 'left', height); // D3 (reference)
            const bassMiddle = height * 0.55 + (height * 0.35 / 5) * 2;

            expect(y).toBeCloseTo(bassMiddle, 0);
        });
    });

    describe('Note State Colors', () => {
        it('should return white for upcoming notes', () => {
            expect(component.getStateColor('upcoming')).toBe('#ffffff');
        });

        it('should return blue for active notes', () => {
            expect(component.getStateColor('active')).toBe('#3B82F6');
        });

        it('should return green for hit notes', () => {
            expect(component.getStateColor('hit')).toBe('#22c55e');
        });

        it('should return red for missed notes', () => {
            expect(component.getStateColor('missed')).toBe('#ef4444');
        });
    });

    describe('Notehead Rendering', () => {
        it('should be hollow for whole notes (4 beats)', () => {
            expect(component.isHollowNote(4)).toBe(true);
        });

        it('should be hollow for half notes (2 beats)', () => {
            expect(component.isHollowNote(2)).toBe(true);
        });

        it('should be filled for quarter notes (1 beat)', () => {
            expect(component.isHollowNote(1)).toBe(false);
        });

        it('should be filled for eighth notes (0.5 beats)', () => {
            expect(component.isHollowNote(0.5)).toBe(false);
        });

        it('should be filled for sixteenth notes (0.25 beats)', () => {
            expect(component.isHollowNote(0.25)).toBe(false);
        });
    });

    describe('Rendering with Notes', () => {
        const createNote = (
            midi: number[],
            startBeat: number,
            state: 'upcoming' | 'active' | 'hit' | 'missed' = 'upcoming'
        ): ScrollingNote => ({
            midi,
            startBeat,
            durationBeats: 1,
            state,
            hand: 'right',
            isRest: false
        });

        it('should render with empty notes array', () => {
            component.scrollingNotes = [];
            expect(() => component.render()).not.toThrow();
        });

        it('should render with single note', () => {
            component.scrollingNotes = [createNote([60], 0)];
            expect(() => component.render()).not.toThrow();
        });

        it('should render with chord (multiple midi values)', () => {
            component.scrollingNotes = [createNote([60, 64, 67], 0)]; // C Major
            expect(() => component.render()).not.toThrow();
        });

        it('should render notes in different states', () => {
            component.scrollingNotes = [
                createNote([60], 0, 'upcoming'),
                createNote([62], 1, 'active'),
                createNote([64], 2, 'hit'),
                createNote([65], 3, 'missed'),
            ];
            expect(() => component.render()).not.toThrow();
        });

        it('should skip notes far off screen', () => {
            // Note at beat 100 with currentBeat 0 would be at x = 300 + 100*80 = 8300
            // which is > stageWidth + 50
            component.currentBeat = 0;
            component.scrollingNotes = [createNote([60], 100)];
            expect(() => component.render()).not.toThrow();
        });
    });

    describe('Canvas Operations', () => {
        it('should have canvas element after view init', () => {
            expect(component.canvas).toBeTruthy();
            expect(component.canvas.nativeElement).toBeInstanceOf(HTMLCanvasElement);
        });

        it('should set canvas width and height', () => {
            const canvas = component.canvas.nativeElement;
            expect(canvas.width).toBe(1200);
            expect(canvas.height).toBe(400);
        });

        it('should update canvas when dimensions change', () => {
            component.stageWidth = 800;
            component.stageHeight = 300;
            fixture.detectChanges();

            const canvas = component.canvas.nativeElement;
            expect(canvas.width).toBe(800);
            expect(canvas.height).toBe(300);
        });
    });

    describe('DOM Rendering', () => {
        it('should render canvas element', () => {
            const compiled = fixture.nativeElement;
            const canvas = compiled.querySelector('canvas.stage-canvas');
            expect(canvas).toBeTruthy();
        });

        it('should render playhead element', () => {
            const compiled = fixture.nativeElement;
            const playhead = compiled.querySelector('.playhead');
            expect(playhead).toBeTruthy();
        });

        it('should position playhead at correct X', () => {
            component.playheadX = 400;
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const playhead = compiled.querySelector('.playhead') as HTMLElement;
            expect(playhead.style.left).toBe('400px');
        });
    });

    describe('Re-rendering on Input Changes', () => {
        let renderSpy: jasmine.Spy;

        beforeEach(() => {
            renderSpy = spyOn(component, 'render').and.callThrough();
        });

        it('should render when scrollingNotes change', () => {
            component.scrollingNotes = [{
                midi: [60],
                startBeat: 0,
                durationBeats: 1,
                state: 'upcoming',
                hand: 'right',
                isRest: false
            }];

            component.ngOnChanges({
                scrollingNotes: {
                    currentValue: component.scrollingNotes,
                    previousValue: [],
                    firstChange: false,
                    isFirstChange: () => false
                }
            });

            expect(renderSpy).toHaveBeenCalled();
        });

        it('should render when currentBeat changes', () => {
            component.currentBeat = 2;

            component.ngOnChanges({
                currentBeat: {
                    currentValue: 2,
                    previousValue: 0,
                    firstChange: false,
                    isFirstChange: () => false
                }
            });

            expect(renderSpy).toHaveBeenCalled();
        });
    });

    describe('Staff Line Drawing', () => {
        it('should draw staff lines without error', () => {
            expect(() => {
                const ctx = component.canvas.nativeElement.getContext('2d')!;
                component.drawStaffLines(ctx, 400);
            }).not.toThrow();
        });
    });

    describe('Playhead Glow Drawing', () => {
        it('should draw playhead glow without error', () => {
            expect(() => {
                const ctx = component.canvas.nativeElement.getContext('2d')!;
                component.drawPlayheadGlow(ctx, 400);
            }).not.toThrow();
        });
    });
});
