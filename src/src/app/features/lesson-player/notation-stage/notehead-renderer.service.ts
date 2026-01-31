import { Injectable } from '@angular/core';

/**
 * Notehead Renderer Service
 *
 * Централізована логіка малювання нот.
 * Підтримує різні тривалості: цілі, половинні, чвертні та коротші ноти.
 *
 * Правила:
 * - Цілі ноти (4 beats) та половинні (2 beats) - порожні
 * - Чвертні (1 beat) та коротші - заповнені
 */
@Injectable({
  providedIn: 'root'
})
export class NoteheadRendererService {

  /**
   * Намалювати ноту
   *
   * @param ctx - Canvas context
   * @param x - X координата центру ноти
   * @param y - Y координата центру ноти
   * @param color - колір ноти
   * @param isActive - чи є нота активною (для ефекту світіння)
   * @param duration - тривалість ноти в beats (визначає порожня/заповнена)
   * @param showHitEffect - показати ефект попадання
   */
  drawNotehead(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    isActive: boolean = false,
    duration: number = 1,
    showHitEffect: boolean = false
  ): void {
    // Визначити чи має бути нота порожньою
    // Цілі ноти (4 beats) та половинні (2 beats) - порожні
    // Чвертні (1 beat) та коротші - заповнені
    const isHollow = duration >= 2;

    // Ефект світіння для активних нот
    if (isActive) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
    }

    // Намалювати ноту з невеликим нахилом для музичного вигляду
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.3); // Невеликий нахил як справжні ноти
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2);

    if (isHollow) {
      // Намалювати порожню ноту з обведенням
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Намалювати заповнену ноту
      ctx.fillStyle = color;
      ctx.fill();
    }

    ctx.restore();
    ctx.shadowBlur = 0;

    // Ефект вибуху при попаданні
    if (showHitEffect) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  /**
   * Отримати радіус ноти (для розрахунку позиції штиля)
   */
  getNoteheadRadius(): number {
    return 10;
  }

  /**
   * Отримати радіуси еліпса ноти
   */
  getNoteheadRadii(): { x: number; y: number } {
    return { x: 10, y: 7 }; // Horizontal and vertical radii
  }

  /**
   * Визначити чи повинна бути нота порожньою
   */
  isHollow(duration: number): boolean {
    return duration >= 2;
  }

  /**
   * Намалювати stem (палку) для ноти
   *
   * @param ctx - Canvas context
   * @param x - X координата центру ноти
   * @param y - Y координата центру ноти
   * @param color - колір stem
   * @param stemUp - напрямок stem (true = вгору, false = вниз)
   * @param duration - тривалість ноти в beats (для flag)
   * @param stemLength - довжина stem (опціонально)
   * @returns Y координата кінця stem (для beaming)
   */
  drawStem(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    stemUp: boolean,
    duration: number,
    stemLength: number = 35
  ): number {
    const radii = this.getNoteheadRadii();

    // Stem X position: at left or right edge of notehead
    const stemX = stemUp ? x + radii.x : x - radii.x;

    // Stem attaches at top or bottom edge of notehead
    // Account for notehead rotation (-0.3 radians ≈ -17°)
    // The rotation shifts the edge position, so we overlap slightly to ensure connection
    const attachY = stemUp ? y - (radii.y - 2) : y + (radii.y - 2);
    const stemEndY = stemUp ? attachY - stemLength : attachY + stemLength;

    // Draw stem line
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(stemX, attachY);
    ctx.lineTo(stemX, stemEndY);
    ctx.stroke();

    // Draw flags for eighth and sixteenth notes
    if (duration <= 0.5) {
      this.drawFlag(ctx, stemX, stemEndY, stemUp, color);
    }
    if (duration <= 0.25) {
      // Second flag for sixteenth notes
      const flagOffset = stemUp ? 8 : -8;
      this.drawFlag(ctx, stemX, stemEndY + flagOffset, stemUp, color);
    }

    ctx.restore();

    return stemEndY;
  }

  /**
   * Намалювати flag (прапорець) на stem
   *
   * @param ctx - Canvas context
   * @param x - X координата stem
   * @param y - Y координата де малювати flag
   * @param stemUp - напрямок stem
   * @param color - колір flag
   */
  private drawFlag(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    stemUp: boolean,
    color: string
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();

    if (stemUp) {
      // Flag curves to the right for upward stems
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 8, y + 5, x + 6, y + 12);
      ctx.lineTo(x, y + 8);
    } else {
      // Flag curves to the right for downward stems
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 8, y - 5, x + 6, y - 12);
      ctx.lineTo(x, y - 8);
    }

    ctx.closePath();
    ctx.fill();
  }
}
