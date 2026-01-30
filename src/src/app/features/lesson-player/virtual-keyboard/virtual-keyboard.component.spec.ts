import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VirtualKeyboardComponent } from './virtual-keyboard.component';

describe('VirtualKeyboardComponent', () => {
    let component: VirtualKeyboardComponent;
    let fixture: ComponentFixture<VirtualKeyboardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [VirtualKeyboardComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(VirtualKeyboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Key Generation', () => {
        it('should generate keys for default range (C3 to C5)', () => {
            const keys = component.visibleKeys();
            expect(keys.length).toBeGreaterThan(0);

            // Default range is 48-72 (C3 to C5)
            const midiValues = keys.map(k => k.midi);
            expect(midiValues).toContain(48); // C3
            expect(midiValues).toContain(60); // C4
            expect(midiValues).toContain(72); // C5
        });

        it('should generate correct number of keys for custom range', () => {
            component.keyboardRange = { min: 60, max: 72 };
            fixture.detectChanges();

            const keys = component.visibleKeys();
            // From C4 (60) to C5 (72) = 13 notes
            expect(keys.length).toBe(13);
        });

        it('should identify black keys correctly', () => {
            // C# (1), D# (3), F# (6), G# (8), A# (10) are black
            expect(component.isBlackKey(61)).toBe(true);  // C#4
            expect(component.isBlackKey(63)).toBe(true);  // D#4
            expect(component.isBlackKey(66)).toBe(true);  // F#4
            expect(component.isBlackKey(68)).toBe(true);  // G#4
            expect(component.isBlackKey(70)).toBe(true);  // A#4
        });

        it('should identify white keys correctly', () => {
            // C (0), D (2), E (4), F (5), G (7), A (9), B (11) are white
            expect(component.isBlackKey(60)).toBe(false); // C4
            expect(component.isBlackKey(62)).toBe(false); // D4
            expect(component.isBlackKey(64)).toBe(false); // E4
            expect(component.isBlackKey(65)).toBe(false); // F4
            expect(component.isBlackKey(67)).toBe(false); // G4
            expect(component.isBlackKey(69)).toBe(false); // A4
            expect(component.isBlackKey(71)).toBe(false); // B4
        });

        it('should position white keys sequentially', () => {
            component.keyboardRange = { min: 60, max: 64 };
            fixture.detectChanges();

            const keys = component.visibleKeys();
            const whiteKeys = keys.filter(k => !k.isBlack);

            // White keys should be at x = 0, 40, 80 (40px each)
            expect(whiteKeys[0].x).toBe(0);
            expect(whiteKeys[1].x).toBe(40);
            expect(whiteKeys[2].x).toBe(80);
        });

        it('should position black keys between white keys', () => {
            component.keyboardRange = { min: 60, max: 63 };
            fixture.detectChanges();

            const keys = component.visibleKeys();
            const blackKey = keys.find(k => k.midi === 61); // C#4

            // Black key should be positioned at edge of white key minus half black width
            // After C4 (white at x=0, width=40), C#4 should be at 40 - 12 = 28
            expect(blackKey).toBeTruthy();
            expect(blackKey!.x).toBe(40 - 12); // 40 - (24/2)
        });

        it('should label white keys with note names', () => {
            component.keyboardRange = { min: 60, max: 64 };
            fixture.detectChanges();

            const keys = component.visibleKeys();
            const cKey = keys.find(k => k.midi === 60);
            const dKey = keys.find(k => k.midi === 62);
            const eKey = keys.find(k => k.midi === 64);

            expect(cKey?.label).toBe('C');
            expect(dKey?.label).toBe('D');
            expect(eKey?.label).toBe('E');
        });

        it('should not label black keys', () => {
            component.keyboardRange = { min: 60, max: 63 };
            fixture.detectChanges();

            const keys = component.visibleKeys();
            const blackKey = keys.find(k => k.midi === 61);

            expect(blackKey?.label).toBe('');
        });
    });

    describe('Visual States', () => {
        beforeEach(() => {
            component.keyboardRange = { min: 60, max: 72 };
            fixture.detectChanges();
        });

        it('should apply hint state to hint notes', () => {
            component.hintNotes = [60, 64, 67]; // C Major chord
            fixture.detectChanges();

            const keys = component.visibleKeys();
            const cKey = keys.find(k => k.midi === 60);
            const eKey = keys.find(k => k.midi === 64);
            const gKey = keys.find(k => k.midi === 67);
            const dKey = keys.find(k => k.midi === 62);

            expect(cKey?.isHint).toBe(true);
            expect(eKey?.isHint).toBe(true);
            expect(gKey?.isHint).toBe(true);
            expect(dKey?.isHint).toBe(false);
        });

        it('should apply active state to active notes', () => {
            component.activeNotes = [60];
            fixture.detectChanges();

            const keys = component.visibleKeys();
            const cKey = keys.find(k => k.midi === 60);
            const dKey = keys.find(k => k.midi === 62);

            expect(cKey?.isActive).toBe(true);
            expect(dKey?.isActive).toBe(false);
        });

        it('should apply correct state to correct notes', () => {
            component.correctNotes = [60, 64];
            fixture.detectChanges();

            const keys = component.visibleKeys();
            const cKey = keys.find(k => k.midi === 60);
            const eKey = keys.find(k => k.midi === 64);

            expect(cKey?.isCorrect).toBe(true);
            expect(eKey?.isCorrect).toBe(true);
        });

        it('should apply wrong state to wrong notes', () => {
            component.wrongNotes = [61]; // C# (wrong note)
            fixture.detectChanges();

            const keys = component.visibleKeys();
            const cSharpKey = keys.find(k => k.midi === 61);

            expect(cSharpKey?.isWrong).toBe(true);
        });

        it('should allow multiple states on same key', () => {
            component.hintNotes = [60];
            component.activeNotes = [60];
            fixture.detectChanges();

            const keys = component.visibleKeys();
            const cKey = keys.find(k => k.midi === 60);

            expect(cKey?.isHint).toBe(true);
            expect(cKey?.isActive).toBe(true);
        });

        it('should clear states when inputs change', () => {
            component.hintNotes = [60];
            fixture.detectChanges();

            let keys = component.visibleKeys();
            expect(keys.find(k => k.midi === 60)?.isHint).toBe(true);

            component.hintNotes = [];
            fixture.detectChanges();

            keys = component.visibleKeys();
            expect(keys.find(k => k.midi === 60)?.isHint).toBe(false);
        });
    });

    describe('Keyboard Width Calculation', () => {
        it('should calculate width based on white keys only', () => {
            // One octave: 7 white keys × 40px = 280px
            component.keyboardRange = { min: 60, max: 71 }; // C4 to B4
            fixture.detectChanges();

            expect(component.keyboardWidth()).toBe(280);
        });

        it('should update width when range changes', () => {
            component.keyboardRange = { min: 60, max: 71 };
            fixture.detectChanges();
            const width1 = component.keyboardWidth();

            component.keyboardRange = { min: 48, max: 83 }; // 3 octaves
            fixture.detectChanges();
            const width2 = component.keyboardWidth();

            expect(width2).toBeGreaterThan(width1);
        });

        it('should count white keys correctly', () => {
            // C4 to C5 = 8 white keys
            const count = component.countWhiteKeys(60, 72);
            expect(count).toBe(8);
        });
    });

    describe('DOM Rendering', () => {
        it('should render piano keys in DOM', () => {
            fixture.detectChanges();
            const compiled = fixture.nativeElement;
            const keys = compiled.querySelectorAll('.piano-key');

            expect(keys.length).toBeGreaterThan(0);
        });

        it('should apply white class to white keys', () => {
            component.keyboardRange = { min: 60, max: 62 };
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const whiteKeys = compiled.querySelectorAll('.piano-key.white');

            // C4, D4 are white (E4 not included since range is 60-62)
            expect(whiteKeys.length).toBe(2);
        });

        it('should apply black class to black keys', () => {
            component.keyboardRange = { min: 60, max: 63 };
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const blackKeys = compiled.querySelectorAll('.piano-key.black');

            // C#4 (61) and D#4 (63) are black keys in range 60-63
            expect(blackKeys.length).toBe(2);
        });

        it('should apply hint class when key is hinted', () => {
            component.keyboardRange = { min: 60, max: 64 };
            component.hintNotes = [60];
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const hintKeys = compiled.querySelectorAll('.piano-key.hint');

            expect(hintKeys.length).toBe(1);
        });

        it('should apply correct class when key is correct', () => {
            component.keyboardRange = { min: 60, max: 64 };
            component.correctNotes = [60, 64];
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const correctKeys = compiled.querySelectorAll('.piano-key.correct');

            expect(correctKeys.length).toBe(2);
        });

        it('should apply wrong class when key is wrong', () => {
            component.keyboardRange = { min: 60, max: 64 };
            component.wrongNotes = [61];
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const wrongKeys = compiled.querySelectorAll('.piano-key.wrong');

            expect(wrongKeys.length).toBe(1);
        });

        it('should display key label only on white keys', () => {
            component.keyboardRange = { min: 60, max: 63 };
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const labels = compiled.querySelectorAll('.key-label');

            // Only C4 and D4 should have labels (white keys)
            expect(labels.length).toBe(2);
        });
    });
});
