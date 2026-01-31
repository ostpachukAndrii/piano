import { Injectable } from '@angular/core';

/**
 * Staff Renderer Service
 *
 * Централізована логіка малювання нотного стану (п'яти ліній).
 *
 * Нотний стан складається з 5 горизонтальних ліній та 4 проміжків між ними.
 * Кожна лінія та проміжок представляє ноту діатонічної гами.
 */
@Injectable({
  providedIn: 'root'
})
export class StaffRendererService {

  /**
   * Намалювати нотний стан (5 ліній)
   *
   * @param ctx - Canvas context
   * @param topY - Y координата верхньої лінії стану
   * @param lineSpacing - відстань між лініями
   * @param width - ширина ліній
   * @param startX - початкова X координата (за замовчуванням 0)
   * @param color - колір ліній
   * @param lineWidth - товщина ліній
   */
  drawStaff(
    ctx: CanvasRenderingContext2D,
    topY: number,
    lineSpacing: number,
    width: number,
    startX: number = 0,
    color: string = 'rgba(255, 255, 255, 0.6)',
    lineWidth: number = 1.5
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    // Намалювати 5 ліній
    for (let i = 0; i < 5; i++) {
      const y = topY + i * lineSpacing;
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(startX + width, y);
      ctx.stroke();
    }
  }

  /**
   * Намалювати великий нотний стан (скрипковий та басовий разом)
   *
   * @param ctx - Canvas context
   * @param height - загальна висота canvas
   * @param width - ширина ліній
   * @param trebleTopPercent - верх скрипкового стану як відсоток висоти (за замовчуванням 0.1)
   * @param bassTopPercent - верх басового стану як відсоток висоти (за замовчуванням 0.55)
   * @param staffHeightPercent - висота кожного стану як відсоток загальної висоти (за замовчуванням 0.35)
   * @param color - колір ліній
   * @param lineWidth - товщина ліній
   */
  drawGrandStaff(
    ctx: CanvasRenderingContext2D,
    height: number,
    width: number,
    trebleTopPercent: number = 0.1,
    bassTopPercent: number = 0.55,
    staffHeightPercent: number = 0.35,
    color: string = 'rgba(255, 255, 255, 0.6)',
    lineWidth: number = 1.5
  ): void {
    const staffHeight = height * staffHeightPercent;
    const lineSpacing = staffHeight / 5;

    // Скрипковий стан (зверху)
    const trebleTop = height * trebleTopPercent;
    this.drawStaff(ctx, trebleTop, lineSpacing, width, 0, color, lineWidth);

    // Басовий стан (знизу)
    const bassTop = height * bassTopPercent;
    this.drawStaff(ctx, bassTop, lineSpacing, width, 0, color, lineWidth);
  }

  /**
   * Намалювати додаткові лінії (ledger lines) для нот поза станом
   *
   * @param ctx - Canvas context
   * @param x - X координата центру ноти
   * @param y - Y координата ноти
   * @param staffTop - верх нотного стану
   * @param staffBottom - низ нотного стану (staffTop + lineSpacing * 4)
   * @param lineSpacing - відстань між лініями
   * @param color - колір ліній
   * @param lineWidth - товщина ліній
   * @param ledgerWidth - ширина додаткової лінії (за замовчуванням 36px)
   */
  drawLedgerLines(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    staffTop: number,
    staffBottom: number,
    lineSpacing: number,
    color: string = 'rgba(255, 255, 255, 0.7)',
    lineWidth: number = 1.5,
    ledgerWidth: number = 36
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    const halfLedger = ledgerWidth / 2;

    // Додаткові лінії вище стану
    if (y < staffTop) {
      for (let ly = staffTop - lineSpacing; ly >= y - lineSpacing / 2; ly -= lineSpacing) {
        // Малюємо лише якщо нота близька до лінії
        if (Math.abs(y - ly) < lineSpacing / 4) {
          ctx.beginPath();
          ctx.moveTo(x - halfLedger, ly);
          ctx.lineTo(x + halfLedger, ly);
          ctx.stroke();
        }
      }
    }

    // Додаткові лінії нижче стану
    if (y > staffBottom) {
      for (let ly = staffBottom + lineSpacing; ly <= y + lineSpacing / 2; ly += lineSpacing) {
        // Малюємо лише якщо нота близька до лінії
        if (Math.abs(y - ly) < lineSpacing / 4) {
          ctx.beginPath();
          ctx.moveTo(x - halfLedger, ly);
          ctx.lineTo(x + halfLedger, ly);
          ctx.stroke();
        }
      }
    }
  }

  /**
   * Розрахувати відстань між лініями на основі висоти стану
   */
  getLineSpacing(staffHeight: number): number {
    return staffHeight / 5;
  }

  /**
   * Отримати Y координату певної лінії стану
   * @param staffTop - верх нотного стану
   * @param lineSpacing - відстань між лініями
   * @param lineIndex - індекс лінії (0 = верхня, 4 = нижня)
   */
  getLineY(staffTop: number, lineSpacing: number, lineIndex: number): number {
    return staffTop + lineIndex * lineSpacing;
  }
}
