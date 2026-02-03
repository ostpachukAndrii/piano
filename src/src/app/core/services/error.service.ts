import { Injectable, signal, computed } from '@angular/core';

export interface AppError {
    id: string;
    message: string;
    details?: string;
    timestamp: Date;
    severity: 'error' | 'warning' | 'info';
    dismissed: boolean;
    source?: string;
}

/**
 * Service for managing application errors
 * Provides centralized error state management with signals
 */
@Injectable({
    providedIn: 'root'
})
export class ErrorService {
    private readonly _errors = signal<AppError[]>([]);
    private readonly _lastError = signal<AppError | null>(null);

    // Public readonly signals
    readonly errors = this._errors.asReadonly();
    readonly lastError = this._lastError.asReadonly();

    // Computed values
    readonly hasErrors = computed(() => this._errors().some(e => !e.dismissed));
    readonly activeErrors = computed(() => this._errors().filter(e => !e.dismissed));
    readonly errorCount = computed(() => this.activeErrors().length);

    /**
     * Add a new error to the error list
     */
    addError(
        message: string,
        options?: {
            details?: string;
            severity?: 'error' | 'warning' | 'info';
            source?: string;
            autoDismiss?: number;
        }
    ): string {
        const id = this.generateId();
        const error: AppError = {
            id,
            message,
            details: options?.details,
            timestamp: new Date(),
            severity: options?.severity ?? 'error',
            dismissed: false,
            source: options?.source,
        };

        this._errors.update(errors => [...errors, error]);
        this._lastError.set(error);

        // Auto-dismiss after specified time (default: no auto-dismiss for errors)
        if (options?.autoDismiss) {
            setTimeout(() => this.dismissError(id), options.autoDismiss);
        }

        return id;
    }

    /**
     * Add an error from an Error object
     */
    addErrorFromException(error: Error, source?: string): string {
        return this.addError(error.message, {
            details: error.stack,
            severity: 'error',
            source: source ?? error.name,
        });
    }

    /**
     * Add a warning (auto-dismisses after 10 seconds)
     */
    addWarning(message: string, details?: string): string {
        return this.addError(message, {
            details,
            severity: 'warning',
            autoDismiss: 10000,
        });
    }

    /**
     * Add an info message (auto-dismisses after 5 seconds)
     */
    addInfo(message: string, details?: string): string {
        return this.addError(message, {
            details,
            severity: 'info',
            autoDismiss: 5000,
        });
    }

    /**
     * Dismiss a specific error by ID
     */
    dismissError(id: string): void {
        this._errors.update(errors =>
            errors.map(e => e.id === id ? { ...e, dismissed: true } : e)
        );
    }

    /**
     * Dismiss all errors
     */
    dismissAll(): void {
        this._errors.update(errors =>
            errors.map(e => ({ ...e, dismissed: true }))
        );
    }

    /**
     * Clear all errors (including dismissed)
     */
    clearAll(): void {
        this._errors.set([]);
        this._lastError.set(null);
    }

    /**
     * Clear old dismissed errors (older than 5 minutes)
     */
    clearOldErrors(): void {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        this._errors.update(errors =>
            errors.filter(e => !e.dismissed || e.timestamp > fiveMinutesAgo)
        );
    }

    /**
     * Generate a unique error ID
     */
    private generateId(): string {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
