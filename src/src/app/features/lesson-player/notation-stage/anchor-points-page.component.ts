import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoteheadAnchorDemoComponent } from './notehead-anchor-demo.component';
import { RestAnchorDemoComponent } from './rest-anchor-demo.component';
import { AccidentalAnchorDemoComponent } from './accidental-anchor-demo.component';
import { ClefDemoPageComponent } from './clef-demo-page.component';

/**
 * Anchor Points Page Component
 *
 * Контейнер для всіх демо точок прив'язки музичних елементів.
 * Дозволяє переключатися між різними елементами через вкладки.
 */
@Component({
  selector: 'app-anchor-points-page',
  standalone: true,
  imports: [
    CommonModule,
    NoteheadAnchorDemoComponent,
    RestAnchorDemoComponent,
    AccidentalAnchorDemoComponent,
    ClefDemoPageComponent
  ],
  template: `
    <div class="page-container">
      <div class="header">
        <h1>Точки прив'язки музичних елементів</h1>
        <p class="description">
          Кожен музичний елемент має точку прив'язки, яка визначає його позицію
          відносно ліній нотного стану. Використовуйте ці інтерактивні демо
          для визначення правильних координат.
        </p>
      </div>

      <div class="tabs">
        <button
          *ngFor="let tab of tabs"
          [class.active]="activeTab() === tab.id"
          (click)="setActiveTab(tab.id)"
          class="tab-button">
          {{ tab.label }}
        </button>
      </div>

      <div class="tab-content">
        @if (activeTab() === 'notehead') {
          <app-notehead-anchor-demo />
        }
        @if (activeTab() === 'rest') {
          <app-rest-anchor-demo />
        }
        @if (activeTab() === 'accidental') {
          <app-accidental-anchor-demo />
        }
        @if (activeTab() === 'clef') {
          <app-clef-demo-page />
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      min-height: 100vh;
      background: #0a0a15;
      color: #ffffff;
    }

    .header {
      padding: 40px 40px 20px 40px;
      background: linear-gradient(135deg, #1a1a2e 0%, #0a0a15 100%);
      border-bottom: 2px solid #3B82F6;
    }

    h1 {
      color: #3B82F6;
      margin: 0 0 15px 0;
      font-size: 32px;
    }

    .description {
      color: #aaaaaa;
      font-size: 16px;
      line-height: 1.6;
      max-width: 800px;
      margin: 0;
    }

    .tabs {
      display: flex;
      gap: 2px;
      padding: 0 40px;
      background: #0a0a15;
      border-bottom: 2px solid #1a1a2e;
    }

    .tab-button {
      padding: 15px 30px;
      background: #1a1a2e;
      color: #aaaaaa;
      border: none;
      border-top: 2px solid transparent;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .tab-button:hover {
      background: #252540;
      color: #ffffff;
    }

    .tab-button.active {
      background: #0a0a15;
      color: #3B82F6;
      border-top-color: #3B82F6;
    }

    .tab-content {
      background: #0a0a15;
    }
  `]
})
export class AnchorPointsPageComponent {
  activeTab = signal('notehead');

  tabs = [
    { id: 'notehead', label: 'Ноти (Noteheads)' },
    { id: 'rest', label: 'Паузи (Rests)' },
    { id: 'accidental', label: 'Альтерації (Accidentals)' },
    { id: 'clef', label: 'Ключі (Clefs)' }
  ];

  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId);
  }
}
