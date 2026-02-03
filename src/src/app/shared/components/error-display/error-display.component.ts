import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { animate, style, transition, trigger } from '@angular/animations';
import { ErrorService, AppError } from '../../../core/services/error.service';

@Component({
    selector: 'app-error-display',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
    ],
    animations: [
        trigger('slideIn', [
            transition(':enter', [
                style({ transform: 'translateX(100%)', opacity: 0 }),
                animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
            ])
        ])
    ],
    template: `
        <div class="error-container" *ngIf="errorService.hasErrors()">
            <div
                class="error-toast"
                *ngFor="let error of errorService.activeErrors()"
                [@slideIn]
                [class.error]="error.severity === 'error'"
                [class.warning]="error.severity === 'warning'"
                [class.info]="error.severity === 'info'">

                <div class="error-icon">
                    <mat-icon>{{ getIcon(error.severity) }}</mat-icon>
                </div>

                <div class="error-content">
                    <div class="error-message">{{ error.message }}</div>
                    <div class="error-details" *ngIf="error.details && showDetails[error.id]">
                        <pre>{{ error.details }}</pre>
                    </div>
                    <button
                        *ngIf="error.details"
                        class="details-toggle"
                        (click)="toggleDetails(error.id)">
                        {{ showDetails[error.id] ? 'Hide details' : 'Show details' }}
                    </button>
                </div>

                <button
                    mat-icon-button
                    class="dismiss-button"
                    (click)="dismiss(error.id)"
                    aria-label="Dismiss">
                    <mat-icon>close</mat-icon>
                </button>
            </div>

            <button
                *ngIf="errorService.errorCount() > 1"
                mat-stroked-button
                class="dismiss-all-button"
                (click)="dismissAll()">
                Dismiss all ({{ errorService.errorCount() }})
            </button>
        </div>
    `,
    styles: [`
        .error-container {
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            max-width: 400px;
            max-height: calc(100vh - 100px);
            overflow-y: auto;
        }

        .error-toast {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            background: white;
            border-left: 4px solid;

            &.error {
                border-left-color: #f44336;
                background: #ffebee;

                .error-icon mat-icon {
                    color: #c62828;
                }
            }

            &.warning {
                border-left-color: #ff9800;
                background: #fff3e0;

                .error-icon mat-icon {
                    color: #ef6c00;
                }
            }

            &.info {
                border-left-color: #2196f3;
                background: #e3f2fd;

                .error-icon mat-icon {
                    color: #1565c0;
                }
            }
        }

        .error-icon {
            flex-shrink: 0;

            mat-icon {
                font-size: 24px;
                width: 24px;
                height: 24px;
            }
        }

        .error-content {
            flex: 1;
            min-width: 0;

            .error-message {
                font-weight: 500;
                color: #333;
                word-wrap: break-word;
            }

            .error-details {
                margin-top: 0.5rem;
                padding: 0.5rem;
                background: rgba(0, 0, 0, 0.05);
                border-radius: 4px;
                max-height: 200px;
                overflow: auto;

                pre {
                    margin: 0;
                    font-size: 0.75rem;
                    white-space: pre-wrap;
                    word-break: break-all;
                    color: #666;
                }
            }

            .details-toggle {
                margin-top: 0.5rem;
                padding: 0;
                background: none;
                border: none;
                color: #666;
                font-size: 0.8rem;
                cursor: pointer;
                text-decoration: underline;

                &:hover {
                    color: #333;
                }
            }
        }

        .dismiss-button {
            flex-shrink: 0;
            width: 32px;
            height: 32px;
            line-height: 32px;

            mat-icon {
                font-size: 18px;
                width: 18px;
                height: 18px;
            }
        }

        .dismiss-all-button {
            align-self: flex-end;
            font-size: 0.85rem;
        }
    `]
})
export class ErrorDisplayComponent {
    errorService = inject(ErrorService);

    showDetails: Record<string, boolean> = {};

    getIcon(severity: 'error' | 'warning' | 'info'): string {
        switch (severity) {
            case 'error': return 'error';
            case 'warning': return 'warning';
            case 'info': return 'info';
        }
    }

    toggleDetails(id: string): void {
        this.showDetails[id] = !this.showDetails[id];
    }

    dismiss(id: string): void {
        this.errorService.dismissError(id);
        delete this.showDetails[id];
    }

    dismissAll(): void {
        this.errorService.dismissAll();
        this.showDetails = {};
    }
}
