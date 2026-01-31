import { Injectable } from '@angular/core';

/**
 * Time Signature Renderer Service
 *
 * Централізована логіка малювання тактового розміру (метра).
 *
 * Тактовий розмір показує кількість долей в такті та їх тривалість.
 * Наприклад: 4/4 означає 4 чвертні ноти в такті, 3/4 - 3 чвертні, 6/8 - 6 восьмих.
 *
 * Позиція: після ключа та ключових знаків на початку твору.
 */
@Injectable({
  providedIn: 'root'
})
export class TimeSignatureRendererService {

  /**
   * Намалювати тактовий розмір
   *
   * @param ctx - Canvas context
   * @param x - X координата центру тактового розміру
   * @param staffTop - Y координата верхньої лінії нотного стану
   * @param lineSpacing - відстань між лініями
   * @param numerator - чисельник (кількість долей)
   * @param denominator - знаменник (тривалість долі: 4=чверть, 8=восьма, 2=половинна)
   * @param color - колір тексту
   */
  drawTimeSignature(
    ctx: CanvasRenderingContext2D,
    x: number,
    staffTop: number,
    lineSpacing: number,
    numerator: number,
    denominator: number,
    color: string = '#ffffff'
  ): void {
    const fontSize = lineSpacing * 1.5; // Reduced for better proportion
    const staffMiddle = staffTop + lineSpacing * 2; // Середня лінія

    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px Arial, sans-serif`; // Removed bold for thinner appearance
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Чисельник (верхнє число) - над серединою стану
    const numeratorY = staffMiddle - lineSpacing * 0.7;
    ctx.fillText(numerator.toString(), x, numeratorY);

    // Знаменник (нижнє число) - під серединою стану
    const denominatorY = staffMiddle + lineSpacing * 0.7;
    ctx.fillText(denominator.toString(), x, denominatorY);

    ctx.restore();
  }

  /**
   * Намалювати спеціальні тактові розміри (C та ¢)
   *
   * @param ctx - Canvas context
   * @param x - X координата центру
   * @param staffTop - Y координата верхньої лінії
   * @param lineSpacing - відстань між лініями
   * @param type - тип: 'common' (C для 4/4) або 'cut' (¢ для 2/2)
   * @param color - колір символу
   */
  drawCommonTime(
    ctx: CanvasRenderingContext2D,
    x: number,
    staffTop: number,
    lineSpacing: number,
    type: 'common' | 'cut' = 'common',
    color: string = '#ffffff'
  ): void {
    const fontSize = lineSpacing * 2.4; // Reduced for better proportion
    const staffMiddle = staffTop + lineSpacing * 2;

    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px Arial, sans-serif`; // Removed bold for thinner appearance
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // C для 4/4 (common time) або ¢ для 2/2 (cut time, alla breve)
    const symbol = type === 'common' ? 'C' : 'ℂ';
    ctx.fillText(symbol, x, staffMiddle);

    ctx.restore();
  }

  /**
   * Розрахувати ширину тактового розміру для правильного розміщення наступних елементів
   */
  getWidth(numerator: number, denominator: number, lineSpacing: number): number {
    // Приблизна ширина на основі розміру шрифту
    const fontSize = lineSpacing * 1.5;
    const maxDigits = Math.max(
      numerator.toString().length,
      denominator.toString().length
    );
    return fontSize * 0.6 * maxDigits + lineSpacing * 0.5;
  }

  /**
   * Перевірити чи є тактовий розмір валідним
   */
  isValidTimeSignature(numerator: number, denominator: number): boolean {
    // Чисельник повинен бути > 0
    if (numerator <= 0) return false;

    // Знаменник повинен бути степенем 2 (1, 2, 4, 8, 16, 32, ...)
    if (denominator <= 0) return false;
    if ((denominator & (denominator - 1)) !== 0) return false;

    return true;
  }

  /**
   * Отримати кількість долей в такті (в чвертних нотах)
   */
  getBeatsPerMeasure(numerator: number, denominator: number): number {
    // Конвертувати в чвертні ноти
    // 4/4 = 4 чверті, 3/4 = 3 чверті, 6/8 = 3 чверті (6 * 1/8 / 1/4 = 6/8 * 4 = 3)
    return numerator * (4 / denominator);
  }

  /**
   * Отримати назву тактового розміру
   */
  getTimeSignatureName(numerator: number, denominator: number): string {
    if (numerator === 4 && denominator === 4) return 'Common Time (4/4)';
    if (numerator === 2 && denominator === 2) return 'Cut Time (2/2)';
    if (numerator === 3 && denominator === 4) return 'Waltz Time (3/4)';
    if (numerator === 6 && denominator === 8) return 'Compound Duple (6/8)';
    return `${numerator}/${denominator}`;
  }
}
