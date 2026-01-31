import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClefRendererService } from './clef-renderer.service';

/**
 * Clef Component
 *
 * Renders treble (G-clef) or bass (F-clef) on a musical staff.
 * Uses ClefRendererService for consistent rendering across the app.
 *
 * Technical Requirements:
 * - Treble Clef: Center spiral wraps around 2nd line (G4 - 392Hz)
 * - Bass Clef: Large dot sits on 4th line (F3 - 174.6Hz)
 *
 * @see https://en.wikipedia.org/wiki/Clef
 */
@Component({
  selector: 'app-clef',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas #clefCanvas
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
export class ClefComponent implements AfterViewInit, OnChanges {
  @ViewChild('clefCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private clefRenderer = inject(ClefRendererService);

  /** Type of clef: 'treble' (G-clef) or 'bass' (F-clef) */
  @Input() type: 'treble' | 'bass' = 'treble';

  /** Line spacing (distance between staff lines) */
  @Input() lineSpacing = 10;

  /** Color of the clef */
  @Input() color = '#ffffff';

  /** Scale factor for the clef size */
  @Input() scale = 1.0;

  /** Show anchor point (red dot) for Storybook */
  @Input() showAnchor = false;

  /** Canvas width */
  width = 60;

  /** Canvas height */
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
    // Treble clef needs more vertical space (extends above and below staff)
    // Bass clef is more compact
    if (this.type === 'treble') {
      this.width = 50 * this.scale;
      this.height = this.lineSpacing * 7 * this.scale; // Extends beyond 5 lines
    } else {
      this.width = 45 * this.scale;
      this.height = this.lineSpacing * 5 * this.scale; // Fits within staff
    }

    const canvas = this.canvasRef.nativeElement;
    canvas.width = this.width;
    canvas.height = this.height;
  }

  private render(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set rendering properties
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5 * this.scale;

    if (this.type === 'treble') {
      this.drawTrebleClef(ctx);
    } else {
      this.drawBassClef(ctx);
    }

    // Draw anchor point if enabled
    if (this.showAnchor) {
      this.drawAnchorPoint(ctx);
    }
  }

  /**
   * Draw Treble Clef using shared renderer service
   */
  private drawTrebleClef(ctx: CanvasRenderingContext2D): void {
    const L = this.lineSpacing;
    // G4 line is 2nd from bottom: canvas is bottom-up, so Y = L * 1
    const anchorLineY = this.height - L * 2; // From bottom
    const anchorX = 15; // Where we want the start point

    this.clefRenderer.drawTrebleClef(ctx, anchorX, anchorLineY, L, this.scale, this.color);
  }

  /**
   * Draw Bass Clef using shared renderer service
   */
  private drawBassClef(ctx: CanvasRenderingContext2D): void {
    const L = this.lineSpacing;
    // F3 line is 4th from bottom: canvas is bottom-up, so Y = L * 3
    const anchorLineY = this.height - L * 4; // From bottom
    const anchorX = 15; // Where we want the start point

    this.clefRenderer.drawBassClef(ctx, anchorX, anchorLineY, L, this.scale, this.color);
  }

  /**
   * Draw anchor point (red dot at reference line)
   */
  private drawAnchorPoint(ctx: CanvasRenderingContext2D): void {
    const L = this.lineSpacing;
    const anchorLineY = this.type === 'treble'
      ? this.height - L * 2  // G4 line for treble
      : this.height - L * 4; // F3 line for bass
    const anchorX = 15;

    // Red dot
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(anchorX, anchorLineY, 5, 0, Math.PI * 2);
    ctx.fill();

    // White center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(anchorX, anchorLineY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Update the clef rendering (call when inputs change)
   */
  public update(): void {
    this.calculateDimensions();
    this.render();
  }

  /**
   * Get the MIDI note number for the anchor line
   * - Treble: G4 (MIDI 67)
   * - Bass: F3 (MIDI 53)
   */
  public getAnchorNote(): number {
    return this.clefRenderer.getAnchorNote(this.type);
  }

  /**
   * Get the anchor line index (0-indexed from bottom)
   * - Treble: Line 1 (2nd line from bottom)
   * - Bass: Line 3 (4th line from bottom)
   */
  public getAnchorLineIndex(): number {
    return this.clefRenderer.getAnchorLineIndex(this.type);
  }
}
