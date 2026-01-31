import { Component, AfterViewInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Bass Clef Demo - Find the starting point
 */
@Component({
  selector: 'app-bass-clef-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="demo-container">
      <h3>Басовий ключ</h3>
      <canvas #canvas width="300" height="400"></canvas>

      <div class="controls">
        <label>
          X (ліво ← → право):
          <input type="range"
                 min="-100"
                 max="100"
                 step="1"
                 [value]="dotX()"
                 (input)="onDotMoveX($event)" />
          <span>{{ dotX() }}px</span>
        </label>

        <label>
          Y (вгору ↑ ↓ вниз):
          <input type="range"
                 min="-150"
                 max="150"
                 step="1"
                 [value]="dotY()"
                 (input)="onDotMoveY($event)" />
          <span>{{ dotY() }}px</span>
        </label>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 20px;
      background: #1a1a2e;
      border-radius: 8px;
      margin: 10px;
      display: inline-block;
    }
    h3 {
      color: #ffffff;
      margin: 0 0 15px 0;
      text-align: center;
    }
    canvas {
      display: block;
      background: #0f0f23;
      border-radius: 4px;
      margin-bottom: 15px;
      cursor: crosshair;
    }
    .controls {
      background: #2a2a3e;
      padding: 15px;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .controls label {
      display: flex;
      flex-direction: column;
      gap: 8px;
      color: #ffffff;
      font-size: 13px;
    }
    .controls input[type="range"] {
      width: 100%;
    }
    .controls span {
      color: #ff6666;
      font-weight: bold;
      font-size: 14px;
      text-align: center;
      font-family: monospace;
    }
  `]
})
export class BassClefDemoComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  dotX = signal(0); // Dot X position relative to center
  dotY = signal(0); // Dot Y position relative to center

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;

    // Mouse click to position dot
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      this.dotX.set(Math.round(x - centerX));
      this.dotY.set(Math.round(y - centerY));
      this.draw();
    });

    this.draw();
  }

  onDotMoveX(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value);
    this.dotX.set(value);
    this.draw();
  }

  onDotMoveY(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value);
    this.dotY.set(value);
    this.draw();
  }

  private draw(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, width, height);

    // Draw center reference lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw bass clef
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '180px Bravura, "Segoe UI Symbol", "Apple Color Emoji", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('𝄢', centerX, centerY);

    // Draw RED DOT (smaller)
    const dotXPos = centerX + this.dotX();
    const dotYPos = centerY + this.dotY();

    // Glow
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(dotXPos, dotYPos, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Inner dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(dotXPos, dotYPos, 2, 0, Math.PI * 2);
    ctx.fill();

    // Show coordinates
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`X: ${this.dotX()}px`, 5, 5);
    ctx.fillText(`Y: ${this.dotY()}px`, 5, 20);
  }
}
