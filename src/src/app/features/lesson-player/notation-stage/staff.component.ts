import { Component, Input, AfterViewInit, ViewChild, ElementRef, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffRendererService } from './staff-renderer.service';

/**
 * Staff Component
 *
 * Відображає нотний стан (5 ліній).
 * Використовує StaffRendererService для консистентного малювання.
 *
 * Може відображати:
 * - Одинарний стан (treble або bass)
 * - Великий стан (grand staff) - скрипковий та басовий разом
 */
@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas #staffCanvas
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
    }
  `]
})
export class StaffComponent implements AfterViewInit, OnChanges {
  @ViewChild('staffCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private staffRenderer = inject(StaffRendererService);

  /** Тип стану: 'single' для одного, 'grand' для великого */
  @Input() type: 'single' | 'grand' = 'single';

  /** Відстань між лініями */
  @Input() lineSpacing: number = 12;

  /** Колір ліній */
  @Input() color: string = 'rgba(255, 255, 255, 0.6)';

  /** Товщина ліній */
  @Input() lineWidth: number = 1.5;

  /** Розмір canvas */
  width = 300;
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
    if (this.type === 'single') {
      // Одинарний стан: 5 ліній + трохи простору зверху та знизу
      this.height = this.lineSpacing * 4 + 40;
    } else {
      // Великий стан: два стани + простір між ними
      this.height = 300;
    }

    const canvas = this.canvasRef.nativeElement;
    canvas.width = this.width;
    canvas.height = this.height;
  }

  private render(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очистити canvas
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (this.type === 'single') {
      // Намалювати одинарний стан
      const topY = 20;
      this.staffRenderer.drawStaff(
        ctx,
        topY,
        this.lineSpacing,
        this.width,
        0,
        this.color,
        this.lineWidth
      );
    } else {
      // Намалювати великий стан (скрипковий та басовий)
      this.staffRenderer.drawGrandStaff(
        ctx,
        this.height,
        this.width,
        0.1,
        0.55,
        0.35,
        this.color,
        this.lineWidth
      );
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
   * Отримати відстань між лініями
   */
  public getLineSpacing(): number {
    return this.lineSpacing;
  }
}
