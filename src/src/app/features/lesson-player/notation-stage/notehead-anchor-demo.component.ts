import { Component, AfterViewInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoteheadRendererService } from './notehead-renderer.service';

/**
 * Notehead Anchor Demo Component
 *
 * Інтерактивна демонстрація для визначення точки прив'язки ноти.
 * Червона точка показує де саме розташовується нота відносно лінії нотного стану.
 */
@Component({
  selector: 'app-notehead-anchor-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="demo-container">
      <h2>Точка прив'язки ноти (Notehead Anchor Point)</h2>
      <p class="description">
        Червона точка показує центр ноти. Ця точка повинна співпадати з лінією нотного стану.
      </p>

      <div class="canvas-wrapper">
        <canvas #demoCanvas
                width="400"
                height="300"
                (click)="onCanvasClick($event)"
                (mousemove)="onCanvasMouseMove($event)">
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
          <label>Y координата: {{ anchorY() }}px</label>
          <input type="range"
                 [value]="anchorY()"
                 (input)="onAnchorYChange($event)"
                 min="0"
                 max="300"
                 step="1">
        </div>

        <div class="control-group">
          <label>Тривалість (duration):</label>
          <select [value]="duration()" (change)="onDurationChange($event)">
            <option value="4">Ціла нота (4 beats)</option>
            <option value="2">Половинна (2 beats)</option>
            <option value="1">Чвертна (1 beat)</option>
            <option value="0.5">Восьма (0.5 beats)</option>
            <option value="0.25">Шістнадцята (0.25 beats)</option>
          </select>
        </div>

        <div class="info-panel">
          <h3>Поточні координати:</h3>
          <p>X: {{ anchorX() }}px, Y: {{ anchorY() }}px</p>
          <p>Відносно лінії: {{ getLinePosition() }}</p>
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
  `]
})
export class NoteheadAnchorDemoComponent implements AfterViewInit {
  @ViewChild('demoCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private noteheadRenderer = inject(NoteheadRendererService);

  // Signals for reactive state
  anchorX = signal(200);
  anchorY = signal(150);
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
    const y = event.clientY - rect.top;

    this.anchorX.set(Math.round(x));
    this.anchorY.set(Math.round(y));
    this.draw();
  }

  onCanvasMouseMove(event: MouseEvent): void {
    // Could show preview of anchor point while hovering
  }

  onAnchorXChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value);
    this.anchorX.set(value);
    this.draw();
  }

  onAnchorYChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value);
    this.anchorY.set(value);
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

    // Draw the notehead at anchor point
    this.noteheadRenderer.drawNotehead(
      ctx,
      this.anchorX(),
      this.anchorY(),
      '#ffffff',
      false,
      this.duration(),
      false
    );

    // Draw red anchor point
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(this.anchorX(), this.anchorY(), 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw crosshair at anchor point
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(this.anchorX(), 0);
    ctx.lineTo(this.anchorX(), canvas.height);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, this.anchorY());
    ctx.lineTo(canvas.width, this.anchorY());
    ctx.stroke();

    ctx.setLineDash([]);
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

  getLinePosition(): string {
    const y = this.anchorY();
    const closestLineIndex = Math.round((y - this.staffTop) / this.lineSpacing);

    if (closestLineIndex < 0) {
      return `${Math.abs(closestLineIndex)} ліній вище стану`;
    } else if (closestLineIndex > 4) {
      return `${closestLineIndex - 4} ліній нижче стану`;
    } else if (closestLineIndex === 0) {
      return 'На 1-й лінії (верхня)';
    } else if (closestLineIndex === 1) {
      return 'На 2-й лінії';
    } else if (closestLineIndex === 2) {
      return 'На 3-й лінії (середня)';
    } else if (closestLineIndex === 3) {
      return 'На 4-й лінії';
    } else if (closestLineIndex === 4) {
      return 'На 5-й лінії (нижня)';
    }

    return `Між лініями`;
  }
}
