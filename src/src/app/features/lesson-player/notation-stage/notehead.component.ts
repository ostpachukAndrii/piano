import { Component, Input, AfterViewInit, ViewChild, ElementRef, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoteheadRendererService } from './notehead-renderer.service';

/**
 * Notehead Component
 *
 * Відображає ноту різної тривалості на нотному стані.
 * Використовує NoteheadRendererService для консистентного малювання.
 *
 * Типи нот:
 * - Ціла нота (4 beats) - порожня овальна
 * - Половинна (2 beats) - порожня овальна
 * - Чвертна (1 beat) - заповнена овальна
 * - Восьма (0.5 beats) - заповнена овальна
 */
@Component({
  selector: 'app-notehead',
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
export class NoteheadComponent implements AfterViewInit, OnChanges {
  @ViewChild('noteCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private noteheadRenderer = inject(NoteheadRendererService);

  /** Тривалість ноти в beats (визначає порожня/заповнена) */
  @Input() duration: number = 1;

  /** Колір ноти */
  @Input() color: string = '#ffffff';

  /** Чи є нота активною (ефект світіння) */
  @Input() isActive: boolean = false;

  /** Показати ефект попадання */
  @Input() showHitEffect: boolean = false;

  /** Розмір canvas */
  width = 60;
  height = 60;

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

    // Намалювати ноту в центрі
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.noteheadRenderer.drawNotehead(
      ctx,
      centerX,
      centerY,
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
