import type { Meta, StoryObj } from '@storybook/angular';
import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Rest Anchor Tuning Component
 * Налаштування якорів для пауз - як для ключів, без нотного стану
 */
@Component({
  selector: 'app-rest-anchor-tuning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="controls">
        <h2>Rest Anchor Tuning</h2>
        <p class="description">Налаштуй позицію якоря відносно центру символу паузи.<br>
        <strong>Зелена пунктирна лінія</strong> - де повинен бути якір (line 4 для whole, line 3 для всіх інших).<br>
        <strong>Жовта пунктирна лінія</strong> - центр символу (автоматично розраховується так, щоб якір був на зеленій лінії).<br>
        <strong>Червона точка</strong> - якір (завжди на зеленій лінії).</p>

        <h3>Whole Rest (4 beats) 𝄻</h3>
        <div class="control-group">
          <label>
            Anchor Y Offset (від центру, px):
            <input type="range" [(ngModel)]="wholeRestAnchorY"
                   [min]="-50" [max]="50" [step]="1"
                   (input)="render()">
            <span class="value">{{ wholeRestAnchorY }}</span>
          </label>
        </div>

        <h3>Half Rest (2 beats) 𝄼</h3>
        <div class="control-group">
          <label>
            Anchor Y Offset (від центру, px):
            <input type="range" [(ngModel)]="halfRestAnchorY"
                   [min]="-50" [max]="50" [step]="1"
                   (input)="render()">
            <span class="value">{{ halfRestAnchorY }}</span>
          </label>
        </div>

        <h3>Quarter Rest (1 beat) 𝄽</h3>
        <div class="control-group">
          <label>
            Anchor Y Offset (від центру, px):
            <input type="range" [(ngModel)]="quarterRestAnchorY"
                   [min]="-50" [max]="50" [step]="1"
                   (input)="render()">
            <span class="value">{{ quarterRestAnchorY }}</span>
          </label>
        </div>

        <h3>Eighth Rest (0.5 beats) 𝄾</h3>
        <div class="control-group">
          <label>
            Anchor Y Offset (від центру, px):
            <input type="range" [(ngModel)]="eighthRestAnchorY"
                   [min]="-50" [max]="50" [step]="1"
                   (input)="render()">
            <span class="value">{{ eighthRestAnchorY }}</span>
          </label>
        </div>

        <h3>Sixteenth Rest (0.25 beats) 𝄿</h3>
        <div class="control-group">
          <label>
            Anchor Y Offset (від центру, px):
            <input type="range" [(ngModel)]="sixteenthRestAnchorY"
                   [min]="-50" [max]="50" [step]="1"
                   (input)="render()">
            <span class="value">{{ sixteenthRestAnchorY }}</span>
          </label>
        </div>

        <h3>32nd Rest (0.125 beats) 𝅀</h3>
        <div class="control-group">
          <label>
            Anchor Y Offset (від центру, px):
            <input type="range" [(ngModel)]="thirtySecondRestAnchorY"
                   [min]="-50" [max]="50" [step]="1"
                   (input)="render()">
            <span class="value">{{ thirtySecondRestAnchorY }}</span>
          </label>
        </div>

        <div class="info">
          <h4>Line Spacing: {{ lineSpacing }}px</h4>
          <h4>Font Size Multipliers:</h4>
          <p><strong>Whole/Half:</strong> lineSpacing * 2.5</p>
          <p><strong>Quarter/Eighth:</strong> lineSpacing * 3.5</p>
          <p><strong>16th:</strong> lineSpacing * 4.0</p>
          <p><strong>32nd:</strong> lineSpacing * 4.5</p>
        </div>

        <div class="code-output">
          <h4>Anchor Offsets (copy values):</h4>
          <pre>{{ getAnchorValues() }}</pre>
        </div>
      </div>

      <div class="canvas-container">
        <canvas #canvas [width]="canvasWidth" [height]="canvasHeight"></canvas>
      </div>
    </div>
  `,
  styles: [`
    .container {
      display: flex;
      gap: 2rem;
      padding: 2rem;
      background: #0f0f23;
      color: white;
      min-height: 600px;
    }

    .controls {
      flex: 0 0 400px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-height: 100vh;
      overflow-y: auto;
      padding-right: 1rem;
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    input[type="range"] {
      width: 100%;
    }

    .value {
      font-weight: bold;
      color: #3B82F6;
      font-size: 1.1rem;
    }

    .info {
      background: rgba(59, 130, 246, 0.1);
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .info h4 {
      margin: 0 0 0.5rem 0;
      color: #3B82F6;
    }

    .info p {
      margin: 0.25rem 0;
      font-size: 0.9rem;
    }

    .code-output {
      background: rgba(34, 197, 94, 0.1);
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .code-output h4 {
      margin: 0 0 0.5rem 0;
      color: #22c55e;
    }

    .code-output pre {
      margin: 0;
      font-size: 0.85rem;
      white-space: pre-wrap;
      color: #22c55e;
    }

    .canvas-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    canvas {
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: #0f0f23;
    }

    h2 {
      margin: 0 0 0.5rem 0;
      color: #3B82F6;
      font-size: 1.3rem;
    }

    .description {
      margin: 0 0 1.5rem 0;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      line-height: 1.4;
    }

    h3 {
      margin: 0;
      color: #fff;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding-bottom: 0.3rem;
      font-size: 0.95rem;
    }
  `]
})
class RestAnchorTuningComponent implements AfterViewInit, OnChanges {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() lineSpacing = 25;
  @Input() wholeRestAnchorY = 0;
  @Input() halfRestAnchorY = 0;
  @Input() quarterRestAnchorY = 0;
  @Input() eighthRestAnchorY = 0;
  @Input() sixteenthRestAnchorY = 0;
  @Input() thirtySecondRestAnchorY = 0;

  canvasWidth = 1400;
  canvasHeight = 600;

  private ctx!: CanvasRenderingContext2D;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.ctx) {
      this.render();
    }
  }

  render(): void {
    if (!this.ctx) return;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    const centerY = this.canvasHeight / 2;
    const spacing = 190;
    const startX = 120;

    // Calculate staff position (5 lines centered on canvas)
    const staffTop = centerY - (this.lineSpacing * 2); // Top of staff (line 5)

    const rests = [
      { duration: 4, x: startX, anchorOffsetY: this.wholeRestAnchorY, color: '#3B82F6', label: 'Whole (4)' },
      { duration: 2, x: startX + spacing * 1, anchorOffsetY: this.halfRestAnchorY, color: '#22c55e', label: 'Half (2)' },
      { duration: 1, x: startX + spacing * 2, anchorOffsetY: this.quarterRestAnchorY, color: '#f59e0b', label: 'Quarter (1)' },
      { duration: 0.5, x: startX + spacing * 3, anchorOffsetY: this.eighthRestAnchorY, color: '#8b5cf6', label: 'Eighth (0.5)' },
      { duration: 0.25, x: startX + spacing * 4, anchorOffsetY: this.sixteenthRestAnchorY, color: '#ec4899', label: '16th (0.25)' },
      { duration: 0.125, x: startX + spacing * 5, anchorOffsetY: this.thirtySecondRestAnchorY, color: '#06b6d4', label: '32nd (0.125)' },
    ];

    rests.forEach(rest => {
      // Draw 5 staff lines for each rest (counting from bottom)
      // Line 5 (top): staffTop + 0
      // Line 4: staffTop + lineSpacing * 1
      // Line 3 (middle): staffTop + lineSpacing * 2
      // Line 2: staffTop + lineSpacing * 3
      // Line 1 (bottom): staffTop + lineSpacing * 4
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      for (let i = 0; i < 5; i++) {
        const lineY = staffTop + i * this.lineSpacing;
        ctx.beginPath();
        ctx.moveTo(rest.x - 70, lineY);
        ctx.lineTo(rest.x + 70, lineY);
        ctx.stroke();
      }

      // Calculate target line for anchor (same as in rest-renderer.service.ts)
      const line2 = staffTop + this.lineSpacing * 3; // Line 2 from bottom
      const line3 = staffTop + this.lineSpacing * 2; // Line 3 from bottom (middle)
      const line4 = staffTop + this.lineSpacing * 1; // Line 4 from bottom

      let targetLineY: number;
      if (rest.duration >= 4) {
        // Whole rest - anchor at line 4
        targetLineY = line4;
      } else {
        // Half, quarter, eighth, sixteenth, 32nd - anchor at line 3
        targetLineY = line3;
      }

      // Calculate symbol center using the same formula as rest-renderer.service.ts:
      // centerY = targetLineY - anchorOffset
      const symbolCenterY = targetLineY - rest.anchorOffsetY;

      // Draw rest symbol at calculated center
      this.drawRest(ctx, rest.x, symbolCenterY, rest.duration, rest.color);

      // Draw symbol center reference line (dashed yellow)
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(rest.x - 70, symbolCenterY);
      ctx.lineTo(rest.x + 70, symbolCenterY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw target line reference (dashed green) - this is where anchor should land
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(rest.x - 70, targetLineY);
      ctx.lineTo(rest.x + 70, targetLineY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw anchor point at target line
      // anchorY = symbolCenterY + anchorOffsetY = (targetLineY - anchorOffsetY) + anchorOffsetY = targetLineY
      this.drawAnchor(ctx, rest.x, targetLineY, '#ff0000');

      // Draw label
      ctx.fillStyle = rest.color;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(rest.label, rest.x, 30);

      // Draw offset value
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px monospace';
      ctx.fillText(`Y: ${rest.anchorOffsetY > 0 ? '+' : ''}${rest.anchorOffsetY}`, rest.x, this.canvasHeight - 20);
    });
  }

  private drawRest(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    duration: number,
    color: string
  ): void {
    let symbol: string;
    let fontSize: number;

    if (duration >= 4) {
      symbol = '𝄻';
      fontSize = this.lineSpacing * 2.5;
    } else if (duration >= 2) {
      symbol = '𝄼';
      fontSize = this.lineSpacing * 2.5;
    } else if (duration >= 1) {
      symbol = '𝄽';
      fontSize = this.lineSpacing * 3.5;
    } else if (duration >= 0.5) {
      symbol = '𝄾';
      fontSize = this.lineSpacing * 3.5;
    } else if (duration >= 0.25) {
      symbol = '𝄿';
      fontSize = this.lineSpacing * 4;
    } else {
      symbol = '𝅀';
      fontSize = this.lineSpacing * 4.5;
    }

    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px Bravura, "Segoe UI Symbol", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, x, y);
    ctx.restore();
  }

  private drawAnchor(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
    // Red dot (smaller for precision)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();

    // White center (smaller)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  getAnchorValues(): string {
    return `wholeRestAnchorY: ${this.wholeRestAnchorY}
halfRestAnchorY: ${this.halfRestAnchorY}
quarterRestAnchorY: ${this.quarterRestAnchorY}
eighthRestAnchorY: ${this.eighthRestAnchorY}
sixteenthRestAnchorY: ${this.sixteenthRestAnchorY}
thirtySecondRestAnchorY: ${this.thirtySecondRestAnchorY}`;
  }
}

const meta: Meta<RestAnchorTuningComponent> = {
  title: 'Notation/Rest Anchor Tuning',
  component: RestAnchorTuningComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f0f23' },
      ],
    },
  },
  argTypes: {
    lineSpacing: {
      control: { type: 'range', min: 10, max: 35, step: 1 },
      description: 'Відстань між лініями (для розміру шрифту)',
    },
    wholeRestAnchorY: {
      control: { type: 'range', min: -50, max: 50, step: 1 },
      description: 'Anchor Y offset для цілої паузи (від центру, px)',
    },
    halfRestAnchorY: {
      control: { type: 'range', min: -50, max: 50, step: 1 },
      description: 'Anchor Y offset для половинної паузи (від центру, px)',
    },
    quarterRestAnchorY: {
      control: { type: 'range', min: -50, max: 50, step: 1 },
      description: 'Anchor Y offset для чвертної паузи (від центру, px)',
    },
    eighthRestAnchorY: {
      control: { type: 'range', min: -50, max: 50, step: 1 },
      description: 'Anchor Y offset для восьмої паузи (від центру, px)',
    },
    sixteenthRestAnchorY: {
      control: { type: 'range', min: -50, max: 50, step: 1 },
      description: 'Anchor Y offset для шістнадцятої паузи (від центру, px)',
    },
    thirtySecondRestAnchorY: {
      control: { type: 'range', min: -50, max: 50, step: 1 },
      description: 'Anchor Y offset для 32-гої паузи (від центру, px)',
    },
  },
};

export default meta;
type Story = StoryObj<RestAnchorTuningComponent>;

/**
 * Інтерактивне налаштування якорів
 * Налаштуй позицію якоря відносно центру кожного символу паузи
 * За замовчуванням всі якорі в центрі (0)
 */
export const Interactive: Story = {
  args: {
    lineSpacing: 35, // Збільшено для більших символів
    wholeRestAnchorY: -33,
    halfRestAnchorY: -17,
    quarterRestAnchorY: 0,
    eighthRestAnchorY: -20,
    sixteenthRestAnchorY: -12,
    thirtySecondRestAnchorY: -8,
  },
};

/**
 * З меншим line spacing (менші символи)
 * Scaled from lineSpacing 35 to 10 (factor: 10/35 ≈ 0.286)
 */
export const SmallSpacing: Story = {
  args: {
    lineSpacing: 10,
    wholeRestAnchorY: -9,        // -33 * 10/35 ≈ -9
    halfRestAnchorY: -5,         // -17 * 10/35 ≈ -5
    quarterRestAnchorY: 0,       // 0 * 10/35 = 0
    eighthRestAnchorY: -6,       // -20 * 10/35 ≈ -6
    sixteenthRestAnchorY: -3,    // -12 * 10/35 ≈ -3
    thirtySecondRestAnchorY: -2, // -8 * 10/35 ≈ -2
  },
};

/**
 * З більшим line spacing (більші символи)
 * Scaled from lineSpacing 35 to 18 (factor: 18/35 ≈ 0.514)
 */
export const LargeSpacing: Story = {
  args: {
    lineSpacing: 18,
    wholeRestAnchorY: -17,       // -33 * 18/35 ≈ -17
    halfRestAnchorY: -9,         // -17 * 18/35 ≈ -9
    quarterRestAnchorY: 0,       // 0 * 18/35 = 0
    eighthRestAnchorY: -10,      // -20 * 18/35 ≈ -10
    sixteenthRestAnchorY: -6,    // -12 * 18/35 ≈ -6
    thirtySecondRestAnchorY: -4, // -8 * 18/35 ≈ -4
  },
};
