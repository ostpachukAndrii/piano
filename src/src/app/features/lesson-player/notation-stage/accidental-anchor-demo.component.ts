import { Component, AfterViewInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccidentalRendererService } from './accidental-renderer.service';

/**
 * Accidental Anchor Demo Component
 *
 * Інтерактивна демонстрація для визначення точки прив'язки знаку альтерації.
 * Червона точка показує де розташовується знак відносно ноти.
 */
@Component({
  selector: 'app-accidental-anchor-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="demo-container">
      <h2>Точка прив'язки знаку альтерації (Accidental Anchor Point)</h2>
      <p class="description">
        Червона точка показує позицію ноти. Знак альтерації (дієз/бемоль) повинен
        розташовуватися зліва від ноти на відстані ~20px.
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
          <label>X координата ноти: {{ noteX() }}px</label>
          <input type="range"
                 [value]="noteX()"
                 (input)="onNoteXChange($event)"
                 min="50"
                 max="350"
                 step="1">
        </div>

        <div class="control-group">
          <label>Y координата: {{ noteY() }}px</label>
          <input type="range"
                 [value]="noteY()"
                 (input)="onNoteYChange($event)"
                 min="0"
                 max="300"
                 step="1">
        </div>

        <div class="control-group">
          <label>Тип знаку:</label>
          <select [value]="accidentalType()" (change)="onTypeChange($event)">
            <option value="sharp">Дієз (♯)</option>
            <option value="flat">Бемоль (♭)</option>
            <option value="natural">Бекар (♮)</option>
          </select>
        </div>

        <div class="info-panel">
          <h3>Інформація:</h3>
          <p>Позиція ноти: {{ noteX() }}px, {{ noteY() }}px</p>
          <p>Позиція знаку: {{ noteX() - 20 }}px, {{ noteY() }}px</p>
          <p>Відстань від ноти: 20px вліво</p>
          <p class="note">
            Знаки альтерації завжди розташовуються зліва від ноти
            на однаковій висоті з центром ноти.
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
export class AccidentalAnchorDemoComponent implements AfterViewInit {
  @ViewChild('demoCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private accidentalRenderer = inject(AccidentalRendererService);

  // Signals for reactive state
  noteX = signal(200);
  noteY = signal(150);
  accidentalType = signal<'sharp' | 'flat' | 'natural'>('sharp');

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

    this.noteX.set(Math.round(x));
    this.noteY.set(Math.round(y));
    this.draw();
  }

  onNoteXChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value);
    this.noteX.set(value);
    this.draw();
  }

  onNoteYChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value);
    this.noteY.set(value);
    this.draw();
  }

  onTypeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'sharp' | 'flat' | 'natural';
    this.accidentalType.set(value);
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

    // Draw accidental symbol
    const symbol = this.accidentalRenderer.getAccidentalSymbol(this.accidentalType());
    const accidentalX = this.noteX() - 20;

    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeText(symbol, accidentalX, this.noteY());

    // Symbol
    ctx.fillStyle = '#ffffff';
    ctx.fillText(symbol, accidentalX, this.noteY());

    // Draw notehead outline (to show where note would be)
    ctx.save();
    ctx.translate(this.noteX(), this.noteY());
    ctx.rotate(-0.3);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Draw red anchor point at note position
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(this.noteX(), this.noteY(), 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw line connecting accidental to note
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(accidentalX, this.noteY());
    ctx.lineTo(this.noteX(), this.noteY());
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw distance label
    ctx.fillStyle = '#ffaa00';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('20px', accidentalX + 10, this.noteY() - 15);
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
}
