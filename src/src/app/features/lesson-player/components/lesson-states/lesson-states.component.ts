import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-lesson-states',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
    ],
    template: `
        <!-- Loading State -->
        <div class="loading-container" *ngIf="loading">
            <mat-spinner diameter="48"></mat-spinner>
            <p>Loading lesson...</p>
        </div>

        <!-- Error State -->
        <mat-card class="error-card" *ngIf="error">
            <mat-icon>error_outline</mat-icon>
            <div class="error-content">
                <h3>Failed to load lesson</h3>
                <p>{{ error }}</p>
                <button mat-raised-button color="primary" (click)="retry.emit()">
                    <mat-icon>refresh</mat-icon>
                    Retry
                </button>
                <button mat-stroked-button (click)="back.emit()">
                    <mat-icon>arrow_back</mat-icon>
                    Back to Lessons
                </button>
            </div>
        </mat-card>

        <!-- Browser Mode Warning -->
        <mat-card class="warning-card" *ngIf="!isTauri && !loading">
            <mat-icon>info</mat-icon>
            <div class="warning-content">
                <h3>Browser Mode</h3>
                <p>
                    Lessons require the Tauri backend. Run with
                    <code>cargo tauri dev</code>
                </p>
                <button mat-stroked-button (click)="back.emit()">
                    <mat-icon>arrow_back</mat-icon>
                    Back
                </button>
            </div>
        </mat-card>
    `,
    styles: [`
        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4rem;
            gap: 1rem;

            p {
                color: #666;
            }
        }

        .error-card,
        .warning-card {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 1.5rem;
            margin-bottom: 2rem;

            mat-icon {
                font-size: 32px;
                width: 32px;
                height: 32px;
            }

            h3 {
                margin: 0 0 0.5rem 0;
            }

            p {
                margin: 0 0 1rem 0;
                color: #666;
            }

            button {
                margin-right: 0.5rem;
            }
        }

        .error-card {
            background: #ffebee;

            mat-icon {
                color: #c62828;
            }

            h3 {
                color: #c62828;
            }
        }

        .warning-card {
            background: #fff3e0;

            mat-icon {
                color: #ef6c00;
            }
        }
    `]
})
export class LessonStatesComponent {
    @Input() loading = false;
    @Input() error: string | null = null;
    @Input() isTauri = false;

    @Output() retry = new EventEmitter<void>();
    @Output() back = new EventEmitter<void>();
}
