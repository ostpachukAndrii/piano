import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClefComponent } from './clef.component';

describe('ClefComponent', () => {
  let component: ClefComponent;
  let fixture: ComponentFixture<ClefComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClefComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ClefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Treble Clef', () => {
    beforeEach(() => {
      component.type = 'treble';
      component.ngAfterViewInit();
    });

    it('should have correct anchor note (G4 = MIDI 67)', () => {
      expect(component.getAnchorNote()).toBe(67);
    });

    it('should have correct anchor line (2nd line = index 1)', () => {
      expect(component.getAnchorLineIndex()).toBe(1);
    });

    it('should calculate correct dimensions for treble clef', () => {
      component.lineSpacing = 10;
      component.scale = 1.0;
      component.ngAfterViewInit();

      expect(component.width).toBe(50);
      expect(component.height).toBe(70); // 7 * lineSpacing
    });
  });

  describe('Bass Clef', () => {
    beforeEach(() => {
      component.type = 'bass';
      component.ngAfterViewInit();
    });

    it('should have correct anchor note (F3 = MIDI 53)', () => {
      expect(component.getAnchorNote()).toBe(53);
    });

    it('should have correct anchor line (4th line = index 3)', () => {
      expect(component.getAnchorLineIndex()).toBe(3);
    });

    it('should calculate correct dimensions for bass clef', () => {
      component.lineSpacing = 10;
      component.scale = 1.0;
      component.ngAfterViewInit();

      expect(component.width).toBe(45);
      expect(component.height).toBe(50); // 5 * lineSpacing
    });
  });

  describe('Scaling', () => {
    it('should scale dimensions correctly', () => {
      component.type = 'treble';
      component.lineSpacing = 10;
      component.scale = 2.0;
      component.ngAfterViewInit();

      expect(component.width).toBe(100); // 50 * 2
      expect(component.height).toBe(140); // 70 * 2
    });
  });

  describe('Update', () => {
    it('should re-render when update() is called', () => {
      const spy = spyOn<any>(component, 'render');
      component.update();
      expect(spy).toHaveBeenCalled();
    });
  });
});
