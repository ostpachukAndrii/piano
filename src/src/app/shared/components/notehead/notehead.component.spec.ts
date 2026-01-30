import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
    NoteheadComponent,
    NoteDuration,
    NoteState,
    beatsToNoteDuration
} from './notehead.component';

describe('NoteheadComponent', () => {
    let component: NoteheadComponent;
    let fixture: ComponentFixture<NoteheadComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NoteheadComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(NoteheadComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Default Values', () => {
        it('should default to quarter note', () => {
            expect(component.duration).toBe('quarter');
        });

        it('should default to upcoming state', () => {
            expect(component.state).toBe('upcoming');
        });

        it('should default to medium size', () => {
            expect(component.size).toBe('medium');
        });

        it('should default to stem up', () => {
            expect(component.stemDirection).toBe('up');
        });

        it('should default to show hit effect', () => {
            expect(component.showHitEffect).toBe(true);
        });
    });

    describe('beatsToNoteDuration Helper', () => {
        it('should return whole for 4 beats', () => {
            expect(beatsToNoteDuration(4)).toBe('whole');
        });

        it('should return whole for beats > 4', () => {
            expect(beatsToNoteDuration(6)).toBe('whole');
        });

        it('should return half for 2 beats', () => {
            expect(beatsToNoteDuration(2)).toBe('half');
        });

        it('should return half for 3 beats', () => {
            expect(beatsToNoteDuration(3)).toBe('half');
        });

        it('should return quarter for 1 beat', () => {
            expect(beatsToNoteDuration(1)).toBe('quarter');
        });

        it('should return quarter for 1.5 beats (dotted quarter)', () => {
            expect(beatsToNoteDuration(1.5)).toBe('quarter');
        });

        it('should return eighth for 0.5 beats', () => {
            expect(beatsToNoteDuration(0.5)).toBe('eighth');
        });

        it('should return eighth for 0.75 beats (dotted eighth)', () => {
            expect(beatsToNoteDuration(0.75)).toBe('eighth');
        });

        it('should return sixteenth for 0.25 beats', () => {
            expect(beatsToNoteDuration(0.25)).toBe('sixteenth');
        });

        it('should return sixteenth for beats < 0.25', () => {
            expect(beatsToNoteDuration(0.125)).toBe('sixteenth');
        });
    });

    describe('Hollow vs Filled Noteheads', () => {
        it('should be hollow for whole notes', () => {
            component.duration = 'whole';
            fixture.detectChanges();
            expect(component.isHollow).toBe(true);
        });

        it('should be hollow for half notes', () => {
            component.duration = 'half';
            fixture.detectChanges();
            expect(component.isHollow).toBe(true);
        });

        it('should be filled for quarter notes', () => {
            component.duration = 'quarter';
            fixture.detectChanges();
            expect(component.isHollow).toBe(false);
        });

        it('should be filled for eighth notes', () => {
            component.duration = 'eighth';
            fixture.detectChanges();
            expect(component.isHollow).toBe(false);
        });

        it('should be filled for sixteenth notes', () => {
            component.duration = 'sixteenth';
            fixture.detectChanges();
            expect(component.isHollow).toBe(false);
        });
    });

    describe('Stem Rendering', () => {
        it('should NOT have stem for whole notes', () => {
            component.duration = 'whole';
            fixture.detectChanges();
            expect(component.hasStem).toBe(false);
        });

        it('should have stem for half notes', () => {
            component.duration = 'half';
            fixture.detectChanges();
            expect(component.hasStem).toBe(true);
        });

        it('should have stem for quarter notes', () => {
            component.duration = 'quarter';
            fixture.detectChanges();
            expect(component.hasStem).toBe(true);
        });

        it('should have stem for eighth notes', () => {
            component.duration = 'eighth';
            fixture.detectChanges();
            expect(component.hasStem).toBe(true);
        });

        it('should have stem for sixteenth notes', () => {
            component.duration = 'sixteenth';
            fixture.detectChanges();
            expect(component.hasStem).toBe(true);
        });
    });

    describe('State Colors', () => {
        it('should return white for upcoming state', () => {
            component.state = 'upcoming';
            fixture.detectChanges();
            expect(component.stateColor).toBe('#ffffff');
        });

        it('should return blue for active state', () => {
            component.state = 'active';
            fixture.detectChanges();
            expect(component.stateColor).toBe('#3B82F6');
        });

        it('should return green for hit state', () => {
            component.state = 'hit';
            fixture.detectChanges();
            expect(component.stateColor).toBe('#22c55e');
        });

        it('should return red for missed state', () => {
            component.state = 'missed';
            fixture.detectChanges();
            expect(component.stateColor).toBe('#ef4444');
        });
    });

    describe('SVG Dimensions', () => {
        it('should have smaller width for whole notes (no stem space needed)', () => {
            component.duration = 'whole';
            fixture.detectChanges();
            const wholeWidth = component.svgWidth;

            component.duration = 'quarter';
            fixture.detectChanges();
            const quarterWidth = component.svgWidth;

            expect(wholeWidth).toBeLessThan(quarterWidth);
        });

        it('should have smaller height for whole notes (no stem)', () => {
            component.duration = 'whole';
            fixture.detectChanges();
            const wholeHeight = component.svgHeight;

            component.duration = 'quarter';
            fixture.detectChanges();
            const quarterHeight = component.svgHeight;

            expect(wholeHeight).toBeLessThan(quarterHeight);
        });

        it('should scale dimensions with size=small', () => {
            component.size = 'medium';
            fixture.detectChanges();
            const mediumWidth = component.svgWidth;

            component.size = 'small';
            fixture.detectChanges();
            const smallWidth = component.svgWidth;

            expect(smallWidth).toBeLessThan(mediumWidth);
        });

        it('should scale dimensions with size=large', () => {
            component.size = 'medium';
            fixture.detectChanges();
            const mediumWidth = component.svgWidth;

            component.size = 'large';
            fixture.detectChanges();
            const largeWidth = component.svgWidth;

            expect(largeWidth).toBeGreaterThan(mediumWidth);
        });
    });

    describe('Stem Direction', () => {
        beforeEach(() => {
            component.duration = 'quarter';
            fixture.detectChanges();
        });

        it('should position stem on right side when direction is up', () => {
            component.stemDirection = 'up';
            fixture.detectChanges();

            const stemX = component.stemX;
            const noteheadCx = component.noteheadCx;

            expect(stemX).toBeGreaterThan(noteheadCx);
        });

        it('should position stem on left side when direction is down', () => {
            component.stemDirection = 'down';
            fixture.detectChanges();

            const stemX = component.stemX;
            const noteheadCx = component.noteheadCx;

            expect(stemX).toBeLessThan(noteheadCx);
        });

        it('should have stem going up when direction is up', () => {
            component.stemDirection = 'up';
            fixture.detectChanges();

            const y1 = component.stemY1;
            const y2 = component.stemY2;

            // Y2 should be less than Y1 (higher on screen = lower Y value)
            expect(y2).toBeLessThan(y1);
        });

        it('should have stem going down when direction is down', () => {
            component.stemDirection = 'down';
            fixture.detectChanges();

            const y1 = component.stemY1;
            const y2 = component.stemY2;

            // Y2 should be greater than Y1 (lower on screen = higher Y value)
            expect(y2).toBeGreaterThan(y1);
        });
    });

    describe('DOM Rendering', () => {
        it('should render SVG element', () => {
            const svg = fixture.nativeElement.querySelector('svg');
            expect(svg).toBeTruthy();
        });

        it('should render notehead ellipse', () => {
            const ellipse = fixture.nativeElement.querySelector('ellipse.notehead-oval');
            expect(ellipse).toBeTruthy();
        });

        it('should render stem line for quarter note', () => {
            component.duration = 'quarter';
            fixture.detectChanges();

            const stem = fixture.nativeElement.querySelector('line.notehead-stem');
            expect(stem).toBeTruthy();
        });

        it('should NOT render stem line for whole note', () => {
            component.duration = 'whole';
            fixture.detectChanges();

            const stem = fixture.nativeElement.querySelector('line.notehead-stem');
            expect(stem).toBeFalsy();
        });

        it('should render one flag for eighth note', () => {
            component.duration = 'eighth';
            fixture.detectChanges();

            const flags = fixture.nativeElement.querySelectorAll('path.notehead-flag');
            expect(flags.length).toBe(1);
        });

        it('should render two flags for sixteenth note', () => {
            component.duration = 'sixteenth';
            fixture.detectChanges();

            const flags = fixture.nativeElement.querySelectorAll('path.notehead-flag');
            expect(flags.length).toBe(2);
        });

        it('should NOT render flags for quarter note', () => {
            component.duration = 'quarter';
            fixture.detectChanges();

            const flags = fixture.nativeElement.querySelectorAll('path.notehead-flag');
            expect(flags.length).toBe(0);
        });

        it('should render hit ring when state is hit and showHitEffect is true', () => {
            component.state = 'hit';
            component.showHitEffect = true;
            fixture.detectChanges();

            const hitRing = fixture.nativeElement.querySelector('.hit-ring');
            expect(hitRing).toBeTruthy();
        });

        it('should NOT render hit ring when showHitEffect is false', () => {
            component.state = 'hit';
            component.showHitEffect = false;
            fixture.detectChanges();

            const hitRing = fixture.nativeElement.querySelector('.hit-ring');
            expect(hitRing).toBeFalsy();
        });

        it('should NOT render hit ring when state is not hit', () => {
            component.state = 'active';
            component.showHitEffect = true;
            fixture.detectChanges();

            const hitRing = fixture.nativeElement.querySelector('.hit-ring');
            expect(hitRing).toBeFalsy();
        });
    });

    describe('SVG Attributes', () => {
        it('should set correct fill for hollow note', () => {
            component.duration = 'half';
            component.state = 'upcoming';
            fixture.detectChanges();

            const ellipse = fixture.nativeElement.querySelector('ellipse.notehead-oval');
            expect(ellipse.getAttribute('fill')).toBe('none');
            expect(ellipse.getAttribute('stroke')).toBe('#ffffff');
        });

        it('should set correct fill for filled note', () => {
            component.duration = 'quarter';
            component.state = 'upcoming';
            fixture.detectChanges();

            const ellipse = fixture.nativeElement.querySelector('ellipse.notehead-oval');
            expect(ellipse.getAttribute('fill')).toBe('#ffffff');
        });

        it('should apply active class when state is active', () => {
            component.state = 'active';
            fixture.detectChanges();

            const svg = fixture.nativeElement.querySelector('svg');
            expect(svg.classList.contains('active')).toBe(true);
        });

        it('should apply hit class when state is hit', () => {
            component.state = 'hit';
            fixture.detectChanges();

            const svg = fixture.nativeElement.querySelector('svg');
            expect(svg.classList.contains('hit')).toBe(true);
        });

        it('should apply missed class when state is missed', () => {
            component.state = 'missed';
            fixture.detectChanges();

            const svg = fixture.nativeElement.querySelector('svg');
            expect(svg.classList.contains('missed')).toBe(true);
        });
    });

    describe('All Duration and State Combinations', () => {
        const durations: NoteDuration[] = ['whole', 'half', 'quarter', 'eighth', 'sixteenth'];
        const states: NoteState[] = ['upcoming', 'active', 'hit', 'missed'];

        durations.forEach(duration => {
            states.forEach(state => {
                it(`should render ${duration} note in ${state} state without error`, () => {
                    component.duration = duration;
                    component.state = state;

                    expect(() => fixture.detectChanges()).not.toThrow();

                    const svg = fixture.nativeElement.querySelector('svg');
                    expect(svg).toBeTruthy();

                    const ellipse = fixture.nativeElement.querySelector('ellipse');
                    expect(ellipse).toBeTruthy();
                });
            });
        });
    });

    describe('Notehead Dimensions', () => {
        it('should have consistent notehead radius', () => {
            expect(component.noteheadRx).toBe(10);
            expect(component.noteheadRy).toBe(7);
        });

        it('should apply rotation transform to notehead', () => {
            fixture.detectChanges();
            const ellipse = fixture.nativeElement.querySelector('ellipse.notehead-oval');
            const transform = ellipse.getAttribute('transform');

            expect(transform).toContain('rotate(-20');
        });
    });

    describe('Flag Paths', () => {
        it('should generate valid flag path for eighth note stem up', () => {
            component.duration = 'eighth';
            component.stemDirection = 'up';
            fixture.detectChanges();

            const path = component.flagPath1;
            expect(path).toContain('M');
            expect(path).toContain('Q');
        });

        it('should generate valid flag path for eighth note stem down', () => {
            component.duration = 'eighth';
            component.stemDirection = 'down';
            fixture.detectChanges();

            const path = component.flagPath1;
            expect(path).toContain('M');
            expect(path).toContain('Q');
        });

        it('should generate second flag path for sixteenth note', () => {
            component.duration = 'sixteenth';
            fixture.detectChanges();

            const path1 = component.flagPath1;
            const path2 = component.flagPath2;

            expect(path1).toBeTruthy();
            expect(path2).toBeTruthy();
            expect(path1).not.toBe(path2);
        });
    });
});
