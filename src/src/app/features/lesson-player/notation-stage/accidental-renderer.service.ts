import { Injectable } from '@angular/core';
import { KeySignature } from '../models/scrolling-note.model';

/**
 * Accidental Renderer Service
 *
 * Централізована логіка малювання знаків альтерації (дієзів та бемолів).
 *
 * Знаки альтерації:
 * - ♯ (sharp / дієз) - підвищення на півтон
 * - ♭ (flat / бемоль) - пониження на півтон
 * - ♮ (natural / бекар) - скасування альтерації
 */
@Injectable({
  providedIn: 'root'
})
export class AccidentalRendererService {

  /**
   * Намалювати знак альтерації (дієз або бемоль) для ноти
   *
   * @param ctx - Canvas context
   * @param x - X координата ноти (альтерація буде зліва)
   * @param y - Y координата ноти
   * @param midi - MIDI номер ноти
   * @param color - колір символу
   * @param keySignature - тональність (для визначення дієз/бемоль)
   */
  drawAccidental(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    midi: number,
    color: string = '#ffffff',
    keySignature?: KeySignature | null
  ): void {
    const noteInOctave = midi % 12;
    const blackKeys = [1, 3, 6, 8, 10]; // C#/Db, D#/Eb, F#/Gb, G#/Ab, A#/Bb

    // Тільки для чорних клавіш
    if (!blackKeys.includes(noteInOctave)) return;

    ctx.save();

    // Позиція альтерації зліва від ноти
    const accidentalX = x - 20;
    const fontSize = 20;  // Більший розмір для кращої видимості

    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Визначити чи показувати дієз або бемоль на основі тональності
    let symbol = '♯'; // За замовчуванням дієз (U+266F)

    if (keySignature) {
      // Перевірити чи ця нота є в тональності
      if (keySignature.sharpNotes.includes(noteInOctave)) {
        symbol = '♯';
      } else if (keySignature.flatNotes.includes(noteInOctave)) {
        symbol = '♭';
      } else if (keySignature.accidentals < 0) {
        // В бемольних тональностях переважно бемолі для випадкових знаків
        symbol = '♭';  // U+266D
      }
    }

    // Намалювати тінь/обведення для кращої видимості
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeText(symbol, accidentalX, y);

    // Намалювати символ (завжди повна непрозорість)
    ctx.fillStyle = color;
    ctx.fillText(symbol, accidentalX, y);

    ctx.restore();
  }

  /**
   * Перевірити чи потрібен знак альтерації для даної ноти
   */
  needsAccidental(midi: number): boolean {
    const noteInOctave = midi % 12;
    const blackKeys = [1, 3, 6, 8, 10]; // C#/Db, D#/Eb, F#/Gb, G#/Ab, A#/Bb
    return blackKeys.includes(noteInOctave);
  }

  /**
   * Визначити тип альтерації (sharp або flat) на основі тональності
   */
  getAccidentalType(midi: number, keySignature?: KeySignature | null): 'sharp' | 'flat' | null {
    if (!this.needsAccidental(midi)) return null;

    const noteInOctave = midi % 12;

    if (keySignature) {
      if (keySignature.sharpNotes.includes(noteInOctave)) {
        return 'sharp';
      } else if (keySignature.flatNotes.includes(noteInOctave)) {
        return 'flat';
      } else if (keySignature.accidentals < 0) {
        return 'flat'; // В бемольних тональностях
      }
    }

    return 'sharp'; // За замовчуванням
  }

  /**
   * Отримати символ для альтерації
   */
  getAccidentalSymbol(type: 'sharp' | 'flat' | 'natural'): string {
    switch (type) {
      case 'sharp':
        return '♯';
      case 'flat':
        return '♭';
      case 'natural':
        return '♮';
    }
  }
}
