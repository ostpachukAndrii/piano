import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BarLineComponent, BarLineType } from './bar-line.component';

describe('BarLineComponent', () => {
    let component: BarLineComponent;
    let fixture: ComponentFixture<BarLineComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BarLineComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(BarLineComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Default Values', () => {
        it('should default to single type', () => {
            expect(component.type).toBe('single');
        });

        it('should default to 60px height', () => {
            expect(component.height).toBe(60);
        });

        it('should default to dark gray color', () => {
            expect(component.color).toBe('#333333');
        });

        it('should default to medium size', () => {
            expect(component.size).toBe('medium');
        });
    });

    describe('Line Width Constants', () => {
        it('should have thin line width of 1.5', () => {
            expect(component.thinLineWidth).toBe(1.5);
        });

        it('should have thick line width of 4', () => {
            expect(component.thickLineWidth).toBe(4);
        });

        it('should have dot radius of 3', () => {
            expect(component.dotRadius).toBe(3);
        });

        it('should return correct line width via helper method', () => {
            expect(component.getLineWidth('thin')).toBe(1.5);
            expect(component.getLineWidth('thick')).toBe(4);
        });

        it('should return dot radius via helper method', () => {
            expect(component.getDotRadius()).toBe(3);
        });
    });

    describe('SVG Dimensions', () => {
        it('should have narrow width for single bar line', () => {
            component.type = 'single';
            fixture.detectChanges();
            expect(component.svgWidth).toBe(10);
        });

        it('should have wider width for double bar line', () => {
            component.type = 'double';
            fixture.detectChanges();
            expect(component.svgWidth).toBe(16);
        });

        it('should have wider width for end bar line', () => {
            component.type = 'end';
            fixture.detectChanges();
            expect(component.svgWidth).toBe(18);
        });

        it('should have widest width for repeat-start bar line', () => {
            component.type = 'repeat-start';
            fixture.detectChanges();
            expect(component.svgWidth).toBe(28);
        });

        it('should have widest width for repeat-end bar line', () => {
            component.type = 'repeat-end';
            fixture.detectChanges();
            expect(component.svgWidth).toBe(28);
        });

        it('should use height input for svgHeight', () => {
            component.height = 80;
            fixture.detectChanges();
            expect(component.svgHeight).toBe(80);
        });

        it('should scale width with size=small', () => {
            component.type = 'single';
            component.size = 'small';
            fixture.detectChanges();
            expect(component.svgWidth).toBe(7); // 10 * 0.7
        });

        it('should scale width with size=large', () => {
            component.type = 'single';
            component.size = 'large';
            fixture.detectChanges();
            expect(component.svgWidth).toBe(14); // 10 * 1.4
        });

        it('should scale height with size=small', () => {
            component.height = 60;
            component.size = 'small';
            fixture.detectChanges();
            expect(component.svgHeight).toBe(42); // 60 * 0.7
        });

        it('should scale height with size=large', () => {
            component.height = 60;
            component.size = 'large';
            fixture.detectChanges();
            expect(component.svgHeight).toBe(84); // 60 * 1.4
        });
    });

    describe('ViewBox', () => {
        it('should have correct viewBox for single type', () => {
            component.type = 'single';
            fixture.detectChanges();
            expect(component.viewBox).toBe('0 0 10 60');
        });

        it('should have correct viewBox for double type', () => {
            component.type = 'double';
            fixture.detectChanges();
            expect(component.viewBox).toBe('0 0 16 60');
        });

        it('should have correct viewBox for end type', () => {
            component.type = 'end';
            fixture.detectChanges();
            expect(component.viewBox).toBe('0 0 18 60');
        });

        it('should have correct viewBox for repeat-start type', () => {
            component.type = 'repeat-start';
            fixture.detectChanges();
            expect(component.viewBox).toBe('0 0 28 60');
        });

        it('should update viewBox when height changes', () => {
            component.type = 'single';
            component.height = 100;
            fixture.detectChanges();
            expect(component.viewBox).toBe('0 0 10 100');
        });
    });

    describe('Line Y Coordinates', () => {
        it('should have lineY1 at 0 (top)', () => {
            expect(component.lineY1).toBe(0);
        });

        it('should have lineY2 at height (bottom)', () => {
            component.height = 80;
            fixture.detectChanges();
            expect(component.lineY2).toBe(80);
        });
    });

    describe('Single Bar Line', () => {
        beforeEach(() => {
            component.type = 'single';
            fixture.detectChanges();
        });

        it('should have lineX centered', () => {
            expect(component.lineX).toBe(5);
        });
    });

    describe('Double Bar Line', () => {
        beforeEach(() => {
            component.type = 'double';
            fixture.detectChanges();
        });

        it('should have doubleLineX1 at 5', () => {
            expect(component.doubleLineX1).toBe(5);
        });

        it('should have doubleLineX2 spaced from first line', () => {
            expect(component.doubleLineX2).toBe(11); // 5 + 6 (lineSpacing)
        });

        it('should have correct spacing between lines', () => {
            const spacing = component.doubleLineX2 - component.doubleLineX1;
            expect(spacing).toBe(component.lineSpacing);
        });
    });

    describe('End Bar Line', () => {
        beforeEach(() => {
            component.type = 'end';
            fixture.detectChanges();
        });

        it('should have thin line first', () => {
            expect(component.endThinLineX).toBe(6);
        });

        it('should have thick line second', () => {
            expect(component.endThickLineX).toBe(14);
        });

        it('should have thin line before thick line', () => {
            expect(component.endThinLineX).toBeLessThan(component.endThickLineX);
        });
    });

    describe('Repeat Start Bar Line', () => {
        beforeEach(() => {
            component.type = 'repeat-start';
            fixture.detectChanges();
        });

        it('should have thick line first', () => {
            expect(component.repeatStartThickX).toBe(4);
        });

        it('should have thin line second', () => {
            expect(component.repeatStartThinX).toBe(12);
        });

        it('should have dots last', () => {
            expect(component.repeatStartDotX).toBe(22);
        });

        it('should have thick line before thin line', () => {
            expect(component.repeatStartThickX).toBeLessThan(component.repeatStartThinX);
        });

        it('should have thin line before dots', () => {
            expect(component.repeatStartThinX).toBeLessThan(component.repeatStartDotX);
        });
    });

    describe('Repeat End Bar Line', () => {
        beforeEach(() => {
            component.type = 'repeat-end';
            fixture.detectChanges();
        });

        it('should have dots first', () => {
            expect(component.repeatEndDotX).toBe(6);
        });

        it('should have thin line second', () => {
            expect(component.repeatEndThinX).toBe(16);
        });

        it('should have thick line last', () => {
            expect(component.repeatEndThickX).toBe(24);
        });

        it('should have dots before thin line', () => {
            expect(component.repeatEndDotX).toBeLessThan(component.repeatEndThinX);
        });

        it('should have thin line before thick line', () => {
            expect(component.repeatEndThinX).toBeLessThan(component.repeatEndThickX);
        });
    });

    describe('Repeat Dot Positions', () => {
        it('should have dot Y1 at 35% of height', () => {
            component.height = 100;
            fixture.detectChanges();
            expect(component.repeatDotY1).toBe(35);
        });

        it('should have dot Y2 at 65% of height', () => {
            component.height = 100;
            fixture.detectChanges();
            expect(component.repeatDotY2).toBe(65);
        });

        it('should have dots vertically centered around middle', () => {
            component.height = 60;
            fixture.detectChanges();
            const middle = component.height / 2;
            const avgDotY = (component.repeatDotY1 + component.repeatDotY2) / 2;
            expect(avgDotY).toBe(middle);
        });
    });

    describe('DOM Rendering', () => {
        it('should render SVG element', () => {
            const svg = fixture.nativeElement.querySelector('svg');
            expect(svg).toBeTruthy();
        });

        it('should render single line for single type', () => {
            component.type = 'single';
            fixture.detectChanges();

            const lines = fixture.nativeElement.querySelectorAll('line');
            expect(lines.length).toBe(1);
        });

        it('should render two lines for double type', () => {
            component.type = 'double';
            fixture.detectChanges();

            const lines = fixture.nativeElement.querySelectorAll('line');
            expect(lines.length).toBe(2);
        });

        it('should render two lines for end type', () => {
            component.type = 'end';
            fixture.detectChanges();

            const lines = fixture.nativeElement.querySelectorAll('line');
            expect(lines.length).toBe(2);
        });

        it('should render two lines and two circles for repeat-start', () => {
            component.type = 'repeat-start';
            fixture.detectChanges();

            const lines = fixture.nativeElement.querySelectorAll('line');
            const circles = fixture.nativeElement.querySelectorAll('circle');
            expect(lines.length).toBe(2);
            expect(circles.length).toBe(2);
        });

        it('should render two lines and two circles for repeat-end', () => {
            component.type = 'repeat-end';
            fixture.detectChanges();

            const lines = fixture.nativeElement.querySelectorAll('line');
            const circles = fixture.nativeElement.querySelectorAll('circle');
            expect(lines.length).toBe(2);
            expect(circles.length).toBe(2);
        });

        it('should NOT render circles for single type', () => {
            component.type = 'single';
            fixture.detectChanges();

            const circles = fixture.nativeElement.querySelectorAll('circle');
            expect(circles.length).toBe(0);
        });

        it('should NOT render circles for double type', () => {
            component.type = 'double';
            fixture.detectChanges();

            const circles = fixture.nativeElement.querySelectorAll('circle');
            expect(circles.length).toBe(0);
        });

        it('should NOT render circles for end type', () => {
            component.type = 'end';
            fixture.detectChanges();

            const circles = fixture.nativeElement.querySelectorAll('circle');
            expect(circles.length).toBe(0);
        });
    });

    describe('SVG Attributes', () => {
        it('should set correct stroke color on lines', () => {
            component.type = 'single';
            component.color = '#ff0000';
            fixture.detectChanges();

            const line = fixture.nativeElement.querySelector('line');
            expect(line.getAttribute('stroke')).toBe('#ff0000');
        });

        it('should set correct fill color on repeat dots', () => {
            component.type = 'repeat-start';
            component.color = '#00ff00';
            fixture.detectChanges();

            const circle = fixture.nativeElement.querySelector('circle');
            expect(circle.getAttribute('fill')).toBe('#00ff00');
        });

        it('should set correct stroke-width for thin line', () => {
            component.type = 'single';
            fixture.detectChanges();

            const line = fixture.nativeElement.querySelector('line');
            expect(line.getAttribute('stroke-width')).toBe('1.5');
        });

        it('should set correct stroke-width for thick line in end type', () => {
            component.type = 'end';
            fixture.detectChanges();

            const thickLine = fixture.nativeElement.querySelector('.thick-line');
            expect(thickLine.getAttribute('stroke-width')).toBe('4');
        });
    });

    describe('CSS Classes', () => {
        it('should apply single class for single type', () => {
            component.type = 'single';
            fixture.detectChanges();

            const svg = fixture.nativeElement.querySelector('svg');
            expect(svg.classList.contains('single')).toBe(true);
        });

        it('should apply double class for double type', () => {
            component.type = 'double';
            fixture.detectChanges();

            const svg = fixture.nativeElement.querySelector('svg');
            expect(svg.classList.contains('double')).toBe(true);
        });

        it('should apply end class for end type', () => {
            component.type = 'end';
            fixture.detectChanges();

            const svg = fixture.nativeElement.querySelector('svg');
            expect(svg.classList.contains('end')).toBe(true);
        });

        it('should apply repeat-start class for repeat-start type', () => {
            component.type = 'repeat-start';
            fixture.detectChanges();

            const svg = fixture.nativeElement.querySelector('svg');
            expect(svg.classList.contains('repeat-start')).toBe(true);
        });

        it('should apply repeat-end class for repeat-end type', () => {
            component.type = 'repeat-end';
            fixture.detectChanges();

            const svg = fixture.nativeElement.querySelector('svg');
            expect(svg.classList.contains('repeat-end')).toBe(true);
        });

        it('should have thin-line class on thin lines', () => {
            component.type = 'single';
            fixture.detectChanges();

            const thinLine = fixture.nativeElement.querySelector('.thin-line');
            expect(thinLine).toBeTruthy();
        });

        it('should have thick-line class on thick lines', () => {
            component.type = 'end';
            fixture.detectChanges();

            const thickLine = fixture.nativeElement.querySelector('.thick-line');
            expect(thickLine).toBeTruthy();
        });

        it('should have repeat-dot class on dots', () => {
            component.type = 'repeat-start';
            fixture.detectChanges();

            const dots = fixture.nativeElement.querySelectorAll('.repeat-dot');
            expect(dots.length).toBe(2);
        });
    });

    describe('All Types Render Without Error', () => {
        const types: BarLineType[] = ['single', 'double', 'end', 'repeat-start', 'repeat-end'];

        types.forEach(type => {
            it(`should render ${type} type without error`, () => {
                component.type = type;

                expect(() => fixture.detectChanges()).not.toThrow();

                const svg = fixture.nativeElement.querySelector('svg');
                expect(svg).toBeTruthy();
            });
        });
    });

    describe('Height Variations', () => {
        const heights = [40, 60, 80, 100];

        heights.forEach(height => {
            it(`should render correctly with height=${height}`, () => {
                component.height = height;
                fixture.detectChanges();

                expect(component.svgHeight).toBe(height);
                expect(component.lineY2).toBe(height);
            });
        });
    });

    describe('Size Variations', () => {
        it('should scale all dimensions correctly for small size', () => {
            component.type = 'repeat-start';
            component.height = 60;
            component.size = 'small';
            fixture.detectChanges();

            expect(component.svgWidth).toBe(20); // 28 * 0.7 = 19.6 rounded
            expect(component.svgHeight).toBe(42); // 60 * 0.7
        });

        it('should scale all dimensions correctly for large size', () => {
            component.type = 'repeat-start';
            component.height = 60;
            component.size = 'large';
            fixture.detectChanges();

            expect(component.svgWidth).toBe(39); // 28 * 1.4 = 39.2 rounded
            expect(component.svgHeight).toBe(84); // 60 * 1.4
        });
    });
});
