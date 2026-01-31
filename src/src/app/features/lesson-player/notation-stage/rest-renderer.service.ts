import { Injectable } from '@angular/core';

/**
 * Rest Renderer Service
 *
 * Використовує Unicode символи для паузів (Bravura font).
 *
 * Типи паузів:
 * - Ціла пауза (4+ beats) - 𝄻 (U+1D13B)
 * - Половинна пауза (2-3.99 beats) - 𝄼 (U+1D13C)
 * - Чвертна пауза (1-1.99 beats) - 𝄽 (U+1D13D)
 * - Восьма пауза (0.5-0.99 beats) - 𝄾 (U+1D13E)
 * - Шістнадцята пауза (0.25-0.49 beats) - 𝄿 (U+1D13F)
 * - 32-га пауза (< 0.25 beats) - 𝅀 (U+1D140)
 */
@Injectable({
  providedIn: 'root'
})
export class RestRendererService {

  // Unicode символи паузів
  private readonly REST_SYMBOLS = {
    whole: '𝄻',      // U+1D13B
    half: '𝄼',       // U+1D13C
    quarter: '𝄽',    // U+1D13D
    eighth: '𝄾',     // U+1D13E
    sixteenth: '𝄿',  // U+1D13F
    thirtySecond: '𝅀' // U+1D140
  };

  // Еталонний lineSpacing, при якому були налаштовані якорі
  private readonly REFERENCE_LINE_SPACING = 35;

  // Якорі пауз (Y offset від центру символу, в пікселях при REFERENCE_LINE_SPACING)
  // Визначені за допомогою Rest Anchor Tuning UI при lineSpacing = 35
  // Якор цілої ноти співпадає з 4 рядком
  // Якор половинної ноти з 3 рядком
  // Якори решти з 3 рядком
  private readonly REST_ANCHOR_OFFSETS = {
    whole: -33,      // Whole rest - line 4 (at lineSpacing=35)
    half: -17,       // Half rest - line 3 (at lineSpacing=35)
    quarter: 0,      // Quarter rest - line 3 (at lineSpacing=35)
    eighth: -20,     // Eighth rest - line 3 (at lineSpacing=35)
    sixteenth: -12,  // Sixteenth rest - line 3 (at lineSpacing=35)
    thirtySecond: -8 // 32nd rest - line 3 (at lineSpacing=35)
  };

  /**
   * Намалювати паузу
   *
   * @param ctx - Canvas context
   * @param x - X координата центру паузи
   * @param staffTop - Y координата верху нотоносця
   * @param lineSpacing - відстань між лініями нотоносця
   * @param duration - тривалість паузи в beats
   * @param color - колір паузи
   */
  drawRest(
    ctx: CanvasRenderingContext2D,
    x: number,
    staffTop: number,
    lineSpacing: number,
    duration: number,
    color: string = '#ffffff'
  ): void {
    // Розрахунок позицій ліній (ЗАВЖДИ РАХУЄМО ВІД НИЗУ!)
    // Line 1 (bottom): staffTop + lineSpacing * 4
    // Line 2: staffTop + lineSpacing * 3
    // Line 3 (middle): staffTop + lineSpacing * 2
    // Line 4: staffTop + lineSpacing * 1
    // Line 5 (top): staffTop + lineSpacing * 0
    const line2 = staffTop + lineSpacing * 3; // Line 2 from bottom
    const line3 = staffTop + lineSpacing * 2; // Line 3 from bottom (middle)
    const line4 = staffTop + lineSpacing * 1; // Line 4 from bottom

    // Розрахувати scale factor для якорів
    const scaleFactor = lineSpacing / this.REFERENCE_LINE_SPACING;

    // Вибрати символ та розмір шрифту
    let symbol: string;
    let fontSize: number;
    let targetLineY: number; // Лінія, до якої прив'язується якір
    let anchorOffset: number; // Offset якоря від центру символу (масштабований)

    if (duration >= 4) {
      // Whole rest - anchor at line 4
      symbol = this.REST_SYMBOLS.whole;
      fontSize = lineSpacing * 2.5;
      targetLineY = line4;
      anchorOffset = this.REST_ANCHOR_OFFSETS.whole * scaleFactor;
    } else if (duration >= 2) {
      // Half rest - anchor at line 3
      symbol = this.REST_SYMBOLS.half;
      fontSize = lineSpacing * 2.5;
      targetLineY = line3;
      anchorOffset = this.REST_ANCHOR_OFFSETS.half * scaleFactor;
    } else if (duration >= 1) {
      // Quarter rest - anchor at line 3
      symbol = this.REST_SYMBOLS.quarter;
      fontSize = lineSpacing * 3.5;
      targetLineY = line3;
      anchorOffset = this.REST_ANCHOR_OFFSETS.quarter * scaleFactor;
    } else if (duration >= 0.5) {
      // Eighth rest - anchor at line 3
      symbol = this.REST_SYMBOLS.eighth;
      fontSize = lineSpacing * 3.5;
      targetLineY = line3;
      anchorOffset = this.REST_ANCHOR_OFFSETS.eighth * scaleFactor;
    } else if (duration >= 0.25) {
      // Sixteenth rest - anchor at line 3
      symbol = this.REST_SYMBOLS.sixteenth;
      fontSize = lineSpacing * 4;
      targetLineY = line3;
      anchorOffset = this.REST_ANCHOR_OFFSETS.sixteenth * scaleFactor;
    } else {
      // 32nd rest - anchor at line 3
      symbol = this.REST_SYMBOLS.thirtySecond;
      fontSize = lineSpacing * 4.5;
      targetLineY = line3;
      anchorOffset = this.REST_ANCHOR_OFFSETS.thirtySecond * scaleFactor;
    }

    // Розрахувати Y позицію центру символу
    // targetLineY - це де повинен бути якір
    // anchorOffset - це відстань від центру до якоря
    // Тому центр = targetLineY - anchorOffset
    const centerY = targetLineY - anchorOffset;

    // Намалювати символ
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px Bravura, "Segoe UI Symbol", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, x, centerY);
    ctx.restore();
  }

  /**
   * Отримати назву типу паузи для заданої тривалості
   */
  getRestType(duration: number): string {
    if (duration >= 4) return 'whole';
    if (duration >= 2) return 'half';
    if (duration >= 1) return 'quarter';
    if (duration >= 0.5) return 'eighth';
    if (duration >= 0.25) return 'sixteenth';
    return 'thirty-second';
  }

  /**
   * Отримати Y offset якоря від центру символу паузи
   * Використовується для позиціонування паузи на нотному стані
   *
   * @param duration - тривалість паузи в beats
   * @returns Y offset в пікселях (від центру символу)
   */
  getRestAnchorOffset(duration: number): number {
    if (duration >= 4) return this.REST_ANCHOR_OFFSETS.whole;
    if (duration >= 2) return this.REST_ANCHOR_OFFSETS.half;
    if (duration >= 1) return this.REST_ANCHOR_OFFSETS.quarter;
    if (duration >= 0.5) return this.REST_ANCHOR_OFFSETS.eighth;
    if (duration >= 0.25) return this.REST_ANCHOR_OFFSETS.sixteenth;
    return this.REST_ANCHOR_OFFSETS.thirtySecond;
  }

  /**
   * Отримати Y координату якоря паузи (anchor point)
   * ЗАВЖДИ РАХУЄМО ВІД НИЗУ!
   *
   * @param staffTop - Y координата верху нотоносця
   * @param lineSpacing - відстань між лініями
   * @param duration - тривалість паузи в beats
   * @returns Y координата якоря паузи (де повинна бути прив'язка до лінії)
   */
  getRestY(staffTop: number, lineSpacing: number, duration: number): number {
    // Line calculations (FROM BOTTOM):
    // Line 1 (bottom): staffTop + lineSpacing * 4
    // Line 2: staffTop + lineSpacing * 3
    // Line 3 (middle): staffTop + lineSpacing * 2
    // Line 4: staffTop + lineSpacing * 1
    // Line 5 (top): staffTop + lineSpacing * 0
    const line2 = staffTop + lineSpacing * 3; // Line 2 from bottom
    const line3 = staffTop + lineSpacing * 2; // Line 3 from bottom (middle)
    const line4 = staffTop + lineSpacing * 1; // Line 4 from bottom

    // Повертаємо Y позицію якоря (це targetLineY з drawRest)
    if (duration >= 4) {
      // Whole rest - anchor at line 4
      return line4;
    } else {
      // Half, quarter, eighth, sixteenth, 32nd - anchor at line 3
      return line3;
    }
  }
}
