import { Injectable } from '@angular/core';

/**
 * Clef Renderer Service
 *
 * Централізована логіка малювання ключів.
 * Використовується як ClefComponent, так і notation-stage.
 *
 * Позиціонування базується на виміряних значеннях:
 * - Скрипковий: початок (-12px, 27px) при 200px шрифті
 * - Басовий: початок (-28px, -26px) при 180px шрифті
 */
@Injectable({
  providedIn: 'root'
})
export class ClefRendererService {

  /**
   * Намалювати скрипковий ключ
   *
   * @param ctx - Canvas context
   * @param anchorX - X координата початку малювання (де повинна бути лінія G4)
   * @param anchorY - Y координата лінії G4
   * @param lineSpacing - відстань між лініями нотоносця
   * @param scale - масштаб (опціонально)
   * @param color - колір (опціонально)
   */
  drawTrebleClef(
    ctx: CanvasRenderingContext2D,
    anchorX: number,
    anchorY: number,
    lineSpacing: number,
    scale: number = 1.0,
    color: string = '#ffffff'
  ): void {
    // Розмір шрифту: 3.2× відстань між лініями (reduced for better proportion)
    const fontSize = lineSpacing * 3.2 * scale;
    const scaleRatio = fontSize / 200; // Еталон: 200px

    // Розрахувати центр з початкової точки
    // Початок малювання: (-12, 27) від центру при 200px
    const centerX = anchorX - (-12 * scaleRatio);
    const centerY = anchorY - (27 * scaleRatio);

    // Намалювати ключ
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px Bravura, "Segoe UI Symbol", "Apple Color Emoji", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('𝄞', centerX, centerY);
    ctx.restore();
  }

  /**
   * Намалювати басовий ключ
   *
   * @param ctx - Canvas context
   * @param anchorX - X координата початку малювання (де повинна бути лінія F3)
   * @param anchorY - Y координата лінії F3
   * @param lineSpacing - відстань між лініями нотоносця
   * @param scale - масштаб (опціонально)
   * @param color - колір (опціонально)
   */
  drawBassClef(
    ctx: CanvasRenderingContext2D,
    anchorX: number,
    anchorY: number,
    lineSpacing: number,
    scale: number = 1.0,
    color: string = '#ffffff'
  ): void {
    // Розмір шрифту: 3.2× відстань між лініями (reduced for better proportion)
    const fontSize = lineSpacing * 3.2 * scale;

    // Розрахувати ефективні розміри з урахуванням масштабування
    const effectiveVerticalSize = fontSize * 1.4; // Вертикальне масштабування
    const effectiveHorizontalSize = fontSize * 0.75; // Горизонтальне масштабування

    const scaleRatioY = effectiveVerticalSize / 180; // Еталон: 180px для Y
    const scaleRatioX = effectiveHorizontalSize / 180; // Еталон: 180px для X

    // Розрахувати центр з початкової точки з урахуванням масштабування
    const centerX = anchorX - (-28 * scaleRatioX);
    const centerY = anchorY - (-26 * scaleRatioY);

    // Намалювати ключ з трансформацією: вужчий (75%) і довший (140%)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(0.75, 1.4); // Вужчий по горизонталі, довший по вертикалі

    ctx.fillStyle = color;
    ctx.font = `${fontSize}px Bravura, "Segoe UI Symbol", "Apple Color Emoji", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('𝄢', 0, 0);

    ctx.restore();
  }

  /**
   * Отримати MIDI ноту для лінії прив'язки
   */
  getAnchorNote(type: 'treble' | 'bass'): number {
    return type === 'treble' ? 67 : 53; // G4 / F3
  }

  /**
   * Отримати індекс лінії прив'язки (0 - знизу)
   */
  getAnchorLineIndex(type: 'treble' | 'bass'): number {
    return type === 'treble' ? 1 : 3; // 2-га / 4-та лінія знизу
  }
}
