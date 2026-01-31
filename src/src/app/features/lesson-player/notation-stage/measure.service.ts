import { Injectable } from '@angular/core';

/**
 * Note or Rest in a measure
 */
export interface MeasureElement {
  /** Тривалість в beats (чвертних нотах) */
  duration: number;
  /** Чи є це паузою */
  isRest: boolean;
  /** Позиція в такті (0-based, в beats) */
  position?: number;
}

/**
 * Measure (такт) definition
 */
export interface Measure {
  /** Номер такту */
  measureNumber: number;
  /** Тактовий розмір - чисельник */
  timeSignatureNumerator: number;
  /** Тактовий розмір - знаменник */
  timeSignatureDenominator: number;
  /** Елементи (ноти і паузи) в такті */
  elements: MeasureElement[];
}

/**
 * Validation result
 */
export interface MeasureValidationResult {
  /** Чи валідний такт */
  isValid: boolean;
  /** Очікувана тривалість такту в beats */
  expectedDuration: number;
  /** Фактична тривалість такту в beats */
  actualDuration: number;
  /** Різниця (actualDuration - expectedDuration) */
  difference: number;
  /** Повідомлення про помилки */
  errors: string[];
}

/**
 * Measure Service
 *
 * Сервіс для роботи з тактами:
 * - Валідація тактів (чи відповідають ноти тактовому розміру)
 * - Розрахунок позицій нот/пауз всередині такту
 * - Пропорційне розміщення елементів
 */
@Injectable({
  providedIn: 'root'
})
export class MeasureService {

  /**
   * Валідувати такт
   *
   * Перевіряє чи сумарна тривалість нот і пауз відповідає тактовому розміру.
   */
  validateMeasure(measure: Measure): MeasureValidationResult {
    const errors: string[] = [];

    // Розрахувати очікувану тривалість такту в beats (чвертних нотах)
    const expectedDuration = this.getMeasureDuration(
      measure.timeSignatureNumerator,
      measure.timeSignatureDenominator
    );

    // Розрахувати фактичну тривалість
    const actualDuration = measure.elements.reduce((sum, el) => sum + el.duration, 0);

    // Перевірити чи співпадають
    const difference = actualDuration - expectedDuration;
    const isValid = Math.abs(difference) < 0.001; // Толерантність для float

    if (!isValid) {
      if (difference > 0) {
        errors.push(
          `Такт переповнений: ${actualDuration} beats замість ${expectedDuration}. ` +
          `Зайвих ${difference.toFixed(3)} beats.`
        );
      } else {
        errors.push(
          `Такт не заповнений: ${actualDuration} beats замість ${expectedDuration}. ` +
          `Не вистачає ${Math.abs(difference).toFixed(3)} beats.`
        );
      }
    }

    // Перевірити чи всі елементи мають валідну тривалість
    for (let i = 0; i < measure.elements.length; i++) {
      const el = measure.elements[i];
      if (el.duration <= 0) {
        errors.push(`Елемент ${i + 1}: неваліднатривалість ${el.duration}`);
      }
    }

    return {
      isValid: isValid && errors.length === 0,
      expectedDuration,
      actualDuration,
      difference,
      errors
    };
  }

  /**
   * Розрахувати тривалість такту в beats (чвертних нотах)
   *
   * Приклади:
   * - 4/4 = 4 beats
   * - 3/4 = 3 beats
   * - 6/8 = 3 beats (6 × 1/8 = 6/8, конвертовано в чверті: 6/8 ÷ 1/4 = 6/8 × 4 = 3)
   * - 2/2 = 4 beats (2 половинні = 4 чверті)
   */
  getMeasureDuration(numerator: number, denominator: number): number {
    return numerator * (4 / denominator);
  }

  /**
   * Розрахувати позиції елементів всередині такту
   *
   * Повертає масив елементів з обчисленими позиціями.
   */
  calculateElementPositions(measure: Measure): MeasureElement[] {
    const elements = [...measure.elements];
    let currentPosition = 0;

    for (const element of elements) {
      element.position = currentPosition;
      currentPosition += element.duration;
    }

    return elements;
  }

  /**
   * Розрахувати X координату елемента всередині такту
   *
   * @param element - елемент (нота або пауза)
   * @param measureStartX - X координата початку такту
   * @param measureWidth - ширина такту в пікселях
   * @param measureDuration - тривалість такту в beats
   * @returns X координата елемента
   */
  getElementX(
    element: MeasureElement,
    measureStartX: number,
    measureWidth: number,
    measureDuration: number
  ): number {
    if (!element.position) {
      throw new Error('Element position not calculated. Call calculateElementPositions first.');
    }

    // Пропорційне розміщення
    const proportionInMeasure = element.position / measureDuration;
    return measureStartX + proportionInMeasure * measureWidth;
  }

  /**
   * Центрувати цілу паузу в такті
   *
   * Ціла пауза завжди розміщується в центрі такту незалежно від тактового розміру.
   */
  centerWholeRest(measureStartX: number, measureWidth: number): number {
    return measureStartX + measureWidth / 2;
  }

  /**
   * Перевірити чи елемент є цілою паузою
   */
  isWholeRest(element: MeasureElement, measureDuration: number): boolean {
    return element.isRest && element.duration >= measureDuration;
  }

  /**
   * Створити порожній такт (з однією цілою паузою)
   */
  createEmptyMeasure(
    measureNumber: number,
    numerator: number,
    denominator: number
  ): Measure {
    const duration = this.getMeasureDuration(numerator, denominator);

    return {
      measureNumber,
      timeSignatureNumerator: numerator,
      timeSignatureDenominator: denominator,
      elements: [{
        duration,
        isRest: true,
        position: 0
      }]
    };
  }

  /**
   * Розбити ноти/паузи на такти
   *
   * @param elements - масив нот/пауз з їх позиціями в beats
   * @param numerator - чисельник тактового розміру
   * @param denominator - знаменник тактового розміру
   * @returns масив тактів
   */
  groupIntoMeasures(
    elements: MeasureElement[],
    numerator: number,
    denominator: number
  ): Measure[] {
    const measures: Measure[] = [];
    const measureDuration = this.getMeasureDuration(numerator, denominator);

    let currentMeasure: Measure = {
      measureNumber: 1,
      timeSignatureNumerator: numerator,
      timeSignatureDenominator: denominator,
      elements: []
    };

    let currentBeat = 0;

    for (const element of elements) {
      const elementEnd = currentBeat + element.duration;

      // Якщо елемент вміщується в поточний такт
      if (elementEnd <= measureDuration * currentMeasure.measureNumber) {
        currentMeasure.elements.push({
          ...element,
          position: currentBeat % measureDuration
        });
        currentBeat = elementEnd;
      } else {
        // Елемент переходить в наступний такт або його потрібно розбити
        // (наразі проста логіка - просто починаємо новий такт)
        measures.push(currentMeasure);

        currentMeasure = {
          measureNumber: currentMeasure.measureNumber + 1,
          timeSignatureNumerator: numerator,
          timeSignatureDenominator: denominator,
          elements: [{
            ...element,
            position: 0
          }]
        };

        currentBeat = element.duration;
      }
    }

    // Додати останній такт
    if (currentMeasure.elements.length > 0) {
      measures.push(currentMeasure);
    }

    return measures;
  }
}
