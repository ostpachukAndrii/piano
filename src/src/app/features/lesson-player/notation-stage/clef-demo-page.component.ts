import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrebleClefDemoComponent } from './treble-clef-demo.component';
import { BassClefDemoComponent } from './bass-clef-demo.component';

/**
 * Clef Demo Page - Find starting point
 */
@Component({
  selector: 'app-clef-demo-page',
  standalone: true,
  imports: [CommonModule, TrebleClefDemoComponent, BassClefDemoComponent],
  template: `
    <div class="page-container">
      <h1>Знайдіть початок малювання ключа</h1>
      <p class="description">
        <strong>Клацніть на ключ</strong> або <strong>рухайте повзунок</strong><br>
        щоб встановити червону точку на початок малювання
      </p>

      <div class="clefs-container">
        <app-treble-clef-demo></app-treble-clef-demo>
        <app-bass-clef-demo></app-bass-clef-demo>
      </div>

      <div class="explanation">
        <h2>Інструкції:</h2>
        <ol>
          <li><strong>Клацніть мишкою</strong> на ключ в місці, де починається його малювання</li>
          <li>Або використовуйте <strong>повзунок</strong> для точного налаштування</li>
          <li>Червона точка покаже позицію</li>
          <li>Значення Y (наприклад, "23px") - це зміщення від центру</li>
        </ol>

        <div class="note">
          <strong>Примітка:</strong> Ми шукаємо точку, де <em>починається малювання</em> самого символу ключа,
          незалежно від нотного стану.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
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

    .description {
      text-align: center;
      color: #aaaaaa;
      margin-bottom: 30px;
      font-size: 16px;
      line-height: 1.8;
    }

    .description strong {
      color: #ff6666;
      font-size: 18px;
    }

    .clefs-container {
      display: flex;
      justify-content: center;
      gap: 30px;
      flex-wrap: wrap;
      margin-bottom: 40px;
    }

    .explanation {
      max-width: 700px;
      margin: 0 auto;
      padding: 30px;
      background: #1a1a2e;
      border-radius: 8px;
    }

    .explanation h2 {
      color: #3B82F6;
      margin-bottom: 20px;
    }

    .explanation ol {
      color: #cccccc;
      line-height: 2;
      padding-left: 25px;
    }

    .explanation li {
      margin-bottom: 10px;
    }

    .explanation strong {
      color: #60A5FA;
    }

    .note {
      margin-top: 25px;
      padding: 15px;
      background: #0f0f23;
      border-left: 4px solid #ff6666;
      border-radius: 4px;
      color: #cccccc;
      line-height: 1.6;
    }

    .note strong {
      color: #ff6666;
    }

    .note em {
      color: #60A5FA;
      font-style: normal;
    }
  `]
})
export class ClefDemoPageComponent {}
