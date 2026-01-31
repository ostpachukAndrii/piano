import { Component, Input, AfterViewInit, ViewChild, ElementRef, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccidentalRendererService } from './accidental-renderer.service';

/**
 * Accidental Component
 *
 * Відображає знак альтерації (дієз, бемоль або бекар).
 * Використовує AccidentalRendererService для консистентного малювання.
 *
 * Типи альтерацій:
 * - Sharp (♯) - дієз, підвищення на півтон
 * - Flat (♭) - бемоль, пониження на півтон
 * - Natural (♮) - бекар, скасування альтерації
 */
@Component({
  selector: 'app-accidental',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas #accidentalCanvas
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
export class AccidentalComponent implements AfterViewInit, OnChanges {
  @ViewChild('accidentalCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private accidentalRenderer = inject(AccidentalRendererService);

  /** Тип альтерації: 'sharp', 'flat', або 'natural' */
  @Input() type: 'sharp' | 'flat' | 'natural' = 'sharp';

  /** Колір символу */
  @Input() color: string = '#ffffff';

  /** Розмір символу */
  @Input() size: number = 24;

  /** Show anchor point (red dot) for Storybook */
  @Input() showAnchor = false;

  /** Розмір canvas */
  width = 40;
  height = 60;

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
    this.width = this.size * 1.5;
    this.height = this.size * 2.5;

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

    // Намалювати символ в центрі
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    const symbol = this.accidentalRenderer.getAccidentalSymbol(this.type);

    ctx.font = `bold ${this.size}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Тінь для кращої видимості
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeText(symbol, centerX, centerY);

    // Символ
    ctx.fillStyle = this.color;
    ctx.fillText(symbol, centerX, centerY);

    // Draw anchor point if enabled
    if (this.showAnchor) {
      // Anchor Y position depends on accidental type
      let anchorY = centerY;

      if (this.type === 'flat') {
        // Flat anchor adjusted to be 6px higher than the bulb
        anchorY = centerY + this.size * 0.3 - 6;
      } else if (this.type === 'sharp') {
        // Sharp anchor at center
        anchorY = centerY;
      } else if (this.type === 'natural') {
        // Natural anchor at center
        anchorY = centerY;
      }

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
   * Отримати символ для поточного типу
   */
  public getSymbol(): string {
    return this.accidentalRenderer.getAccidentalSymbol(this.type);
  }
}
