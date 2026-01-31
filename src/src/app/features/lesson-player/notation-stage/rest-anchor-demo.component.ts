import { Component, AfterViewInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestRendererService } from './rest-renderer.service';

/**
 * Rest Anchor Demo Component
 *
 * Інтерактивна демонстрація для визначення точки прив'язки паузи.
 * Червона точка показує X координату паузи (паузи центровані по X).
 */
@Component({
  selector: 'app-rest-anchor-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="demo-container">
      <h2>Точка прив'язки паузи (Rest Anchor Point)</h2>
      <p class="description">
        Червона точка показує X координату центру паузи.
        Паузи розміщуються відносно ліній нотного стану автоматично залежно від типу.
      </p>

      <div class="canvas-wrapper">
        <canvas #demoCanvas
                width="400"
                height="300"
                (click)="onCanvasClick($event)">
        </canvas>
      </div>

      <div class="controls">
        <div class="control-group">
          <label>X координата: {{ anchorX() }}px</label>
          <input type="range"
                 [value]="anchorX()"
                 (input)="onAnchorXChange($event)"
                 min="0"
                 max="400"
                 step="1">
        </div>

        <div class="control-group">
          <label>Тривалість (duration):</label>
          <select [value]="duration()" (change)="onDurationChange($event)">
            <option value="4">Ціла пауза (4 beats)</option>
            <option value="2">Половинна (2 beats)</option>
            <option value="1">Чвертна (1 beat)</option>
            <option value="0.5">Восьма (0.5 beats)</option>
            <option value="0.25">Шістнадцята (0.25 beats)</option>
            <option value="0.125">32-га (0.125 beats)</option>
          </select>
        </div>

        <div class="info-panel">
          <h3>Інформація про паузу:</h3>
          <p>X: {{ anchorX() }}px</p>
          <p>Тип: {{ getRestType() }}</p>
          <p class="note">
            Паузи автоматично позиціонуються по Y:
            <br>• Ціла - висить від 4-ї лінії
            <br>• Половинна - сидить на 3-й лінії
            <br>• Інші - центровані на 3-й лінії
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 20px;
      background: #0a0a15;
      min-height: 100vh;
      color: #ffffff;
    }

    h2 {
      color: #3B82F6;
      margin-bottom: 10px;
    }

    .description {
      color: #aaaaaa;
      margin-bottom: 20px;
      font-size: 14px;
    }

    .canvas-wrapper {
      display: inline-block;
      background: #0f0f23;
      border-radius: 8px;
      border: 2px solid #1a1a2e;
      margin-bottom: 20px;
    }

    canvas {
      display: block;
      cursor: crosshair;
    }

    .controls {
      max-width: 400px;
    }

    .control-group {
      margin-bottom: 20px;
    }

    .control-group label {
      display: block;
      color: #60A5FA;
      margin-bottom: 8px;
      font-size: 14px;
    }

    input[type="range"] {
      width: 100%;
    }

    select {
      width: 100%;
      padding: 8px;
      background: #1a1a2e;
      color: #ffffff;
      border: 1px solid #3B82F6;
      border-radius: 4px;
      font-size: 14px;
    }

    .info-panel {
      background: #1a1a2e;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #3B82F6;
    }

    .info-panel h3 {
      color: #3B82F6;
      margin-bottom: 10px;
      font-size: 16px;
    }

    .info-panel p {
      color: #ffffff;
      margin: 5px 0;
      font-size: 14px;
    }

    .info-panel .note {
      color: #aaaaaa;
      font-size: 12px;
      margin-top: 10px;
      line-height: 1.5;
    }
  `]
})
export class RestAnchorDemoComponent implements AfterViewInit {
  @ViewChild('demoCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private restRenderer = inject(RestRendererService);

  // Signals for reactive state
  anchorX = signal(200);
  duration = signal(1);

  // Staff configuration
  private readonly staffTop = 80;
  private readonly lineSpacing = 20;

  ngAfterViewInit(): void {
    this.draw();
  }

  onCanvasClick(event: MouseEvent): void {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const x = event.clientX - rect.left;

    this.anchorX.set(Math.round(x));
    this.draw();
  }

  onAnchorXChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value);
    this.anchorX.set(value);
    this.draw();
  }

  onDurationChange(event: Event): void {
    const value = parseFloat((event.target as HTMLSelectElement).value);
    this.duration.set(value);
    this.draw();
  }

  private draw(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw staff lines
    this.drawStaff(ctx);

    // Draw reference lines (3rd and 4th lines in color)
    this.drawReferenceLine(ctx, this.staffTop + this.lineSpacing * 2, '#ffaa00', '3-я лінія');
    this.drawReferenceLine(ctx, this.staffTop + this.lineSpacing * 3, '#ff6600', '4-та лінія');

    // Draw the rest at anchor point
    this.restRenderer.drawRest(
      ctx,
      this.anchorX(),
      this.staffTop,
      this.lineSpacing,
      this.duration(),
      '#ffffff'
    );

    // Draw red anchor point (vertical line at X)
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(this.anchorX(), 0);
    ctx.lineTo(this.anchorX(), canvas.height);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw red dot at top
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(this.anchorX(), 20, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawStaff(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;

    for (let i = 0; i < 5; i++) {
      const y = this.staffTop + i * this.lineSpacing;
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(380, y);
      ctx.stroke();
    }
  }

  private drawReferenceLine(ctx: CanvasRenderingContext2D, y: number, color: string, label: string): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);

    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(380, y);
    ctx.stroke();

    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = color;
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(label, 15, y + 4);
  }

  getRestType(): string {
    const duration = this.duration();
    if (duration >= 4) return 'Ціла пауза (whole rest)';
    if (duration >= 2) return 'Половинна пауза (half rest)';
    if (duration >= 1) return 'Чвертна пауза (quarter rest)';
    if (duration >= 0.5) return 'Восьма пауза (eighth rest)';
    if (duration >= 0.25) return 'Шістнадцята пауза (sixteenth rest)';
    return '32-га пауза (thirty-second rest)';
  }
}
