import { Component, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClefRendererService } from './clef-renderer.service';

/**
 * Clef Size Test Component
 * Tests that clef positioning scales correctly at different sizes
 */
@Component({
  selector: 'app-clef-size-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-container">
      <h1>Тест масштабування ключів</h1>
      <p class="subtitle">Червона лінія = лінія прив'язки (G4 для скрипкового, F3 для басового)</p>

      <div class="tests">
        <div class="test-group">
          <h2>Скрипковий ключ</h2>
          <canvas #trebleSmall width="200" height="250"></canvas>
          <p>Малий (L=20)</p>
        </div>

        <div class="test-group">
          <canvas #trebleMedium width="300" height="350"></canvas>
          <p>Середній (L=30)</p>
        </div>

        <div class="test-group">
          <canvas #trebleLarge width="400" height="450"></canvas>
          <p>Великий (L=40)</p>
        </div>
      </div>

      <div class="tests">
        <div class="test-group">
          <h2>Басовий ключ</h2>
          <canvas #bassSmall width="200" height="250"></canvas>
          <p>Малий (L=20)</p>
        </div>

        <div class="test-group">
          <canvas #bassMedium width="300" height="350"></canvas>
          <p>Середній (L=30)</p>
        </div>

        <div class="test-group">
          <canvas #bassLarge width="400" height="450"></canvas>
          <p>Великий (L=40)</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .test-container {
      padding: 40px;
      background: #0a0a15;
      min-height: 100vh;
      color: #ffffff;
    }

    h1 {
      text-align: center;
      color: #3B82F6;
      margin-bottom: 10px;
    }

    .subtitle {
      text-align: center;
      color: #ff6666;
      margin-bottom: 40px;
      font-size: 16px;
    }

    .tests {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-bottom: 50px;
      flex-wrap: wrap;
    }

    .test-group {
      text-align: center;
    }

    .test-group h2 {
      color: #60A5FA;
      margin-bottom: 20px;
    }

    .test-group canvas {
      background: #0f0f23;
      border-radius: 8px;
      border: 2px solid #1a1a2e;
    }

    .test-group p {
      color: #aaaaaa;
      margin-top: 10px;
      font-size: 14px;
    }
  `]
})
export class ClefSizeTestComponent implements AfterViewInit {
  @ViewChild('trebleSmall') trebleSmallRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trebleMedium') trebleMediumRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trebleLarge') trebleLargeRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bassSmall') bassSmallRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bassMedium') bassMediumRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bassLarge') bassLargeRef!: ElementRef<HTMLCanvasElement>;

  private clefRenderer = inject(ClefRendererService);

  ngAfterViewInit(): void {
    // Treble clefs
    this.drawTrebleClef(this.trebleSmallRef.nativeElement, 20);
    this.drawTrebleClef(this.trebleMediumRef.nativeElement, 30);
    this.drawTrebleClef(this.trebleLargeRef.nativeElement, 40);

    // Bass clefs
    this.drawBassClef(this.bassSmallRef.nativeElement, 20);
    this.drawBassClef(this.bassMediumRef.nativeElement, 30);
    this.drawBassClef(this.bassLargeRef.nativeElement, 40);
  }

  private drawTrebleClef(canvas: HTMLCanvasElement, L: number): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, width, height);

    // Draw staff lines
    const staffTop = height * 0.2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;

    for (let i = 0; i < 5; i++) {
      const y = staffTop + i * L;
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();
    }

    // Draw G4 line in RED
    const g4Line = staffTop + 3 * L;
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, g4Line);
    ctx.lineTo(width - 20, g4Line);
    ctx.stroke();

    // Draw treble clef using shared service
    const startX = 60;
    this.clefRenderer.drawTrebleClef(ctx, startX, g4Line, L);

    // Draw start point marker
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(startX, g4Line, 4, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`L=${L}px`, width - 10, height - 10);
  }

  private drawBassClef(canvas: HTMLCanvasElement, L: number): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, width, height);

    // Draw staff lines
    const staffTop = height * 0.2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;

    for (let i = 0; i < 5; i++) {
      const y = staffTop + i * L;
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();
    }

    // Draw F3 line in RED
    const f3Line = staffTop + 1 * L;
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, f3Line);
    ctx.lineTo(width - 20, f3Line);
    ctx.stroke();

    // Draw bass clef using shared service
    const startX = 60;
    this.clefRenderer.drawBassClef(ctx, startX, f3Line, L);

    // Draw start point marker
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(startX, f3Line, 4, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`L=${L}px`, width - 10, height - 10);
  }
}
