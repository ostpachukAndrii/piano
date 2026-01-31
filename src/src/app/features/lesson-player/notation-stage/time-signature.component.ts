import { Component, Input, AfterViewInit, ViewChild, ElementRef, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeSignatureRendererService } from './time-signature-renderer.service';

/**
 * Time Signature Component
 *
 * Відображає тактовий розмір (метр) на нотному стані.
 * Використовує TimeSignatureRendererService для консистентного малювання.
 *
 * Приклади: 4/4, 3/4, 6/8, 2/2
 */
@Component({
  selector: 'app-time-signature',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas #timeSignatureCanvas
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
export class TimeSignatureComponent implements AfterViewInit, OnChanges {
  @ViewChild('timeSignatureCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private timeSignatureRenderer = inject(TimeSignatureRendererService);

  /** Чисельник (кількість долей в такті) */
  @Input() numerator: number = 4;

  /** Знаменник (тривалість долі: 4=чверть, 8=восьма, 2=половинна) */
  @Input() denominator: number = 4;

  /** Використовувати символ C для 4/4 */
  @Input() useCommonTime: boolean = false;

  /** Колір тексту */
  @Input() color: string = '#ffffff';

  /** Відстань між лініями нотного стану */
  @Input() lineSpacing: number = 12;

  /** Show anchor point (red dot) for Storybook */
  @Input() showAnchor = false;

  /** Розмір canvas */
  width = 60;
  height = 80;

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
    const fontSize = this.lineSpacing * 1.8;
    const maxDigits = Math.max(
      this.numerator.toString().length,
      this.denominator.toString().length
    );

    this.width = fontSize * 0.8 * maxDigits + this.lineSpacing;
    this.height = this.lineSpacing * 5 + 20;

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
    const staffTop = 10;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;

    for (let i = 0; i < 5; i++) {
      const y = staffTop + i * this.lineSpacing;
      ctx.beginPath();
      ctx.moveTo(5, y);
      ctx.lineTo(this.width - 5, y);
      ctx.stroke();
    }

    // Намалювати тактовий розмір в центрі
    const centerX = this.width / 2;

    if (this.useCommonTime && this.numerator === 4 && this.denominator === 4) {
      this.timeSignatureRenderer.drawCommonTime(
        ctx,
        centerX,
        staffTop,
        this.lineSpacing,
        'common',
        this.color
      );
    } else if (this.numerator === 2 && this.denominator === 2) {
      this.timeSignatureRenderer.drawCommonTime(
        ctx,
        centerX,
        staffTop,
        this.lineSpacing,
        'cut',
        this.color
      );
    } else {
      this.timeSignatureRenderer.drawTimeSignature(
        ctx,
        centerX,
        staffTop,
        this.lineSpacing,
        this.numerator,
        this.denominator,
        this.color
      );
    }

    // Draw anchor point if enabled
    if (this.showAnchor) {
      const staffMiddle = staffTop + this.lineSpacing * 2;

      // Red dot
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(centerX, staffMiddle, 5, 0, Math.PI * 2);
      ctx.fill();

      // White center
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, staffMiddle, 2, 0, Math.PI * 2);
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
   * Отримати назву тактового розміру
   */
  public getName(): string {
    return this.timeSignatureRenderer.getTimeSignatureName(this.numerator, this.denominator);
  }

  /**
   * Отримати кількість долей в такті (в чвертних нотах)
   */
  public getBeatsPerMeasure(): number {
    return this.timeSignatureRenderer.getBeatsPerMeasure(this.numerator, this.denominator);
  }
}
