import { Component, Input, AfterViewInit, ViewChild, ElementRef, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoteheadRendererService } from './notehead-renderer.service';

/**
 * Note Component
 *
 * Відображає повну ноту з головою, стеблом та прапорцями.
 * Використовує NoteheadRendererService для консистентного малювання.
 *
 * Типи нот:
 * - Ціла нота (4 beats) - порожня овальна, БЕЗ стебла
 * - Половинна (2 beats) - порожня овальна зі стеблом
 * - Чвертна (1 beat) - заповнена овальна зі стеблом
 * - Восьма (0.5 beats) - заповнена овальна зі стеблом та 1 прапорцем
 * - Шістнадцята (0.25 beats) - заповнена овальна зі стеблом та 2 прапорцями
 */
@Component({
  selector: 'app-note',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas #noteCanvas
            [width]="width"
            [height]="height"
            [style.width.px]="width"
            [style.height.px]="height">
    </canvas>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    canvas {
      display: block;
      background: #0f0f23;
    }
  `]
})
export class NoteComponent implements AfterViewInit, OnChanges {
  @ViewChild('noteCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private noteheadRenderer = inject(NoteheadRendererService);

  /** Тривалість ноти в beats (визначає порожня/заповнена та наявність стебла) */
  @Input() duration: number = 1;

  /** Колір ноти */
  @Input() color: string = '#ffffff';

  /** Напрямок стебла (true = вгору, false = вниз) */
  @Input() stemUp: boolean = true;

  /** Чи є нота активною (ефект світіння) */
  @Input() isActive: boolean = false;

  /** Показати ефект попадання */
  @Input() showHitEffect: boolean = false;

  /** Розмір canvas */
  width = 60;
  height = 80;

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.canvasRef) {
      this.render();
    }
  }

  private render(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очистити canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Позиція ноти
    const noteheadX = this.width / 2;
    const noteheadY = this.height / 2;

    // Намалювати стебло ПЕРЕД головою (якщо потрібно)
    // Цілі ноти (4 beats) не мають стебла
    if (this.duration < 4) {
      this.noteheadRenderer.drawStem(
        ctx,
        noteheadX,
        noteheadY,
        this.color,
        this.stemUp,
        this.duration
      );
    }

    // Намалювати голову ноти ПОВЕРХ стебла
    this.noteheadRenderer.drawNotehead(
      ctx,
      noteheadX,
      noteheadY,
      this.color,
      this.isActive,
      this.duration,
      this.showHitEffect
    );
  }

  /**
   * Оновити малювання (викликати коли inputs змінюються)
   */
  public update(): void {
    this.render();
  }
}
