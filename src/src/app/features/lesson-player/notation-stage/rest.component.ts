import { Component, Input, AfterViewInit, ViewChild, ElementRef, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestRendererService } from './rest-renderer.service';

/**
 * Rest Component
 *
 * Відображає паузу різної тривалості на нотному стані.
 * Використовує RestRendererService для консистентного малювання.
 *
 * Типи пауз:
 * - Ціла пауза (4+ beats) - блок вниз від 4-ї лінії
 * - Половинна (2-3.99 beats) - блок на 3-й лінії
 * - Чвертна (1-1.99 beats) - завиток
 * - Восьма (0.5-0.99 beats) - прапорець
 * - Шістнадцята (0.25-0.49 beats) - подвійний прапорець
 * - 32-га (< 0.25 beats) - потрійний прапорець
 */
@Component({
  selector: 'app-rest',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas #restCanvas
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
export class RestComponent implements AfterViewInit, OnChanges {
  @ViewChild('restCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private restRenderer = inject(RestRendererService);

  /** Тривалість паузи в beats */
  @Input() duration: number = 1;

  /** Колір паузи */
  @Input() color: string = '#ffffff';

  /** Відстань між лініями нотного стану */
  @Input() lineSpacing: number = 12;

  /** Show anchor point (red dot) for Storybook */
  @Input() showAnchor = false;

  /** Розмір canvas */
  width = 80;
  height = 100;

  ngAfterViewInit(): void {
    this.calculateDimensions();
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.canvasRef) {
      this.calculateDimensions();
      this.render();
    }
  }

  private calculateDimensions(): void {
    // Розрахувати розмір canvas на основі відстані між лініями
    this.width = this.lineSpacing * 4;
    this.height = this.lineSpacing * 8;

    const canvas = this.canvasRef.nativeElement;
    canvas.width = this.width;
    canvas.height = this.height;
  }

  private render(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очистити canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Намалювати нотний стан (5 ліній) для контексту
    const staffTop = this.height * 0.2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;

    for (let i = 0; i < 5; i++) {
      const y = staffTop + i * this.lineSpacing;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Намалювати паузу в центрі
    const centerX = this.width / 2;
    this.restRenderer.drawRest(
      ctx,
      centerX,
      staffTop,
      this.lineSpacing,
      this.duration,
      this.color
    );

    // Draw anchor point if enabled
    if (this.showAnchor) {
      const anchorY = this.restRenderer.getRestY(staffTop, this.lineSpacing, this.duration);

      // Red dot
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(centerX, anchorY, 5, 0, Math.PI * 2);
      ctx.fill();

      // White center
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, anchorY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Оновити малювання (викликати коли inputs змінюються)
   */
  public update(): void {
    this.calculateDimensions();
    this.render();
  }

  /**
   * Отримати тип паузи для поточної тривалості
   */
  public getRestType(): string {
    return this.restRenderer.getRestType(this.duration);
  }
}
