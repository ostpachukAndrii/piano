import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PlaybackControlsComponent } from './playback-controls.component';

describe('PlaybackControlsComponent', () => {
    let component: PlaybackControlsComponent;
    let fixture: ComponentFixture<PlaybackControlsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PlaybackControlsComponent, BrowserAnimationsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(PlaybackControlsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Default Values', () => {
        it('should have isPlaying as false by default', () => {
            expect(component.isPlaying).toBe(false);
        });

        it('should have progressPercent as 0 by default', () => {
            expect(component.progressPercent).toBe(0);
        });

        it('should have tempoPercent as 100 by default', () => {
            expect(component.tempoPercent).toBe(100);
        });

        it('should have playMode as wait by default', () => {
            expect(component.playMode).toBe('wait');
        });
    });

    describe('Display - Play/Pause Icon', () => {
        it('should show play_arrow icon when not playing', () => {
            component.isPlaying = false;
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const icon = compiled.querySelector('.pause-btn mat-icon');
            expect(icon.textContent.trim()).toBe('play_arrow');
        });

        it('should show pause icon when playing', () => {
            component.isPlaying = true;
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const icon = compiled.querySelector('.pause-btn mat-icon');
            expect(icon.textContent.trim()).toBe('pause');
        });
    });

    describe('Display - Progress', () => {
        it('should display progress percentage', () => {
            component.progressPercent = 50;
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const progressText = compiled.querySelector('.progress-text');
            expect(progressText.textContent.trim()).toBe('50%');
        });

        it('should display 0% progress', () => {
            component.progressPercent = 0;
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const progressText = compiled.querySelector('.progress-text');
            expect(progressText.textContent.trim()).toBe('0%');
        });

        it('should display 100% progress', () => {
            component.progressPercent = 100;
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const progressText = compiled.querySelector('.progress-text');
            expect(progressText.textContent.trim()).toBe('100%');
        });

        it('should round decimal progress', () => {
            component.progressPercent = 33.333;
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const progressText = compiled.querySelector('.progress-text');
            expect(progressText.textContent.trim()).toBe('33%');
        });
    });

    describe('Display - Tempo', () => {
        it('should display tempo percentage', () => {
            component.tempoPercent = 75;
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const tempoText = compiled.querySelector('.tempo-text');
            expect(tempoText.textContent.trim()).toBe('75%');
        });

        it('should display minimum tempo (25%)', () => {
            component.tempoPercent = 25;
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const tempoText = compiled.querySelector('.tempo-text');
            expect(tempoText.textContent.trim()).toBe('25%');
        });

        it('should display maximum tempo (150%)', () => {
            component.tempoPercent = 150;
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const tempoText = compiled.querySelector('.tempo-text');
            expect(tempoText.textContent.trim()).toBe('150%');
        });
    });

    describe('Display - Mode Toggle', () => {
        it('should have Flow and Wait buttons', () => {
            const compiled = fixture.nativeElement;
            const toggles = compiled.querySelectorAll('mat-button-toggle');

            expect(toggles.length).toBe(2);
            expect(toggles[0].textContent).toContain('Flow');
            expect(toggles[1].textContent).toContain('Wait');
        });
    });

    describe('Events - Play Toggle', () => {
        it('should emit playToggle when play button clicked', () => {
            spyOn(component.playToggle, 'emit');

            const compiled = fixture.nativeElement;
            const playBtn = compiled.querySelector('.pause-btn');
            playBtn.click();

            expect(component.playToggle.emit).toHaveBeenCalled();
        });

        it('should call onPlayToggle method when button clicked', () => {
            spyOn(component, 'onPlayToggle');

            const compiled = fixture.nativeElement;
            const playBtn = compiled.querySelector('.pause-btn');
            playBtn.click();

            expect(component.onPlayToggle).toHaveBeenCalled();
        });
    });

    describe('Events - Restart', () => {
        it('should emit restart when restart button clicked', () => {
            spyOn(component.restart, 'emit');

            const compiled = fixture.nativeElement;
            const restartBtn = compiled.querySelector('.restart-btn');
            restartBtn.click();

            expect(component.restart.emit).toHaveBeenCalled();
        });

        it('should call onRestart method when button clicked', () => {
            spyOn(component, 'onRestart');

            const compiled = fixture.nativeElement;
            const restartBtn = compiled.querySelector('.restart-btn');
            restartBtn.click();

            expect(component.onRestart).toHaveBeenCalled();
        });
    });

    describe('Events - Tempo Change', () => {
        it('should emit tempoChange when slider changes', () => {
            spyOn(component.tempoChange, 'emit');

            component.onTempoSliderChange(75);

            expect(component.tempoChange.emit).toHaveBeenCalledWith(75);
        });

        it('should emit tempoChange with minimum value', () => {
            spyOn(component.tempoChange, 'emit');

            component.onTempoSliderChange(25);

            expect(component.tempoChange.emit).toHaveBeenCalledWith(25);
        });

        it('should emit tempoChange with maximum value', () => {
            spyOn(component.tempoChange, 'emit');

            component.onTempoSliderChange(150);

            expect(component.tempoChange.emit).toHaveBeenCalledWith(150);
        });
    });

    describe('Events - Mode Change', () => {
        it('should emit modeChange when mode toggled to flow', () => {
            spyOn(component.modeChange, 'emit');

            component.onModeToggleChange('flow');

            expect(component.modeChange.emit).toHaveBeenCalledWith('flow');
        });

        it('should emit modeChange when mode toggled to wait', () => {
            spyOn(component.modeChange, 'emit');

            component.onModeToggleChange('wait');

            expect(component.modeChange.emit).toHaveBeenCalledWith('wait');
        });
    });

    describe('DOM Structure', () => {
        it('should have control-bar container', () => {
            const compiled = fixture.nativeElement;
            const controlBar = compiled.querySelector('.control-bar');
            expect(controlBar).toBeTruthy();
        });

        it('should have restart button', () => {
            const compiled = fixture.nativeElement;
            const restartBtn = compiled.querySelector('.restart-btn');
            expect(restartBtn).toBeTruthy();
        });

        it('should have progress section', () => {
            const compiled = fixture.nativeElement;
            const progressSection = compiled.querySelector('.progress-section');
            expect(progressSection).toBeTruthy();
        });

        it('should have tempo section', () => {
            const compiled = fixture.nativeElement;
            const tempoSection = compiled.querySelector('.tempo-section');
            expect(tempoSection).toBeTruthy();
        });

        it('should have custom progress bar', () => {
            const compiled = fixture.nativeElement;
            const progressTrack = compiled.querySelector('.progress-track');
            const progressFill = compiled.querySelector('.progress-fill');
            const indicatorDot = compiled.querySelector('.indicator-dot');
            expect(progressTrack).toBeTruthy();
            expect(progressFill).toBeTruthy();
            expect(indicatorDot).toBeTruthy();
        });

        it('should have mat-slider', () => {
            const compiled = fixture.nativeElement;
            const slider = compiled.querySelector('mat-slider');
            expect(slider).toBeTruthy();
        });

        it('should have mat-button-toggle-group', () => {
            const compiled = fixture.nativeElement;
            const toggleGroup = compiled.querySelector('mat-button-toggle-group');
            expect(toggleGroup).toBeTruthy();
        });
    });

    describe('Accessibility', () => {
        it('should have aria-label on play button', () => {
            const compiled = fixture.nativeElement;
            const playBtn = compiled.querySelector('.pause-btn');
            expect(playBtn.getAttribute('aria-label')).toBe('Play/Pause');
        });

        it('should have aria-label on mode toggle group', () => {
            const compiled = fixture.nativeElement;
            const toggleGroup = compiled.querySelector('mat-button-toggle-group');
            expect(toggleGroup.getAttribute('aria-label')).toBe('Play Mode');
        });
    });

    describe('Input Binding', () => {
        it('should update display when isPlaying changes', () => {
            component.isPlaying = true;
            fixture.detectChanges();

            let icon = fixture.nativeElement.querySelector('.pause-btn mat-icon');
            expect(icon.textContent.trim()).toBe('pause');

            component.isPlaying = false;
            fixture.detectChanges();

            icon = fixture.nativeElement.querySelector('.pause-btn mat-icon');
            expect(icon.textContent.trim()).toBe('play_arrow');
        });

        it('should update display when progressPercent changes', () => {
            component.progressPercent = 25;
            fixture.detectChanges();

            let text = fixture.nativeElement.querySelector('.progress-text');
            expect(text.textContent.trim()).toBe('25%');

            component.progressPercent = 75;
            fixture.detectChanges();

            text = fixture.nativeElement.querySelector('.progress-text');
            expect(text.textContent.trim()).toBe('75%');
        });

        it('should update progress fill width when progressPercent changes', () => {
            component.progressPercent = 50;
            fixture.detectChanges();

            const fill = fixture.nativeElement.querySelector('.progress-fill');
            expect(fill.style.width).toBe('50%');

            component.progressPercent = 75;
            fixture.detectChanges();

            expect(fill.style.width).toBe('75%');
        });

        it('should update display when tempoPercent changes', () => {
            component.tempoPercent = 50;
            fixture.detectChanges();

            let text = fixture.nativeElement.querySelector('.tempo-text');
            expect(text.textContent.trim()).toBe('50%');

            component.tempoPercent = 125;
            fixture.detectChanges();

            text = fixture.nativeElement.querySelector('.tempo-text');
            expect(text.textContent.trim()).toBe('125%');
        });
    });
});
