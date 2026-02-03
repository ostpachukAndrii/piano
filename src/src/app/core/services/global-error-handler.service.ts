import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { ErrorService } from './error.service';

/**
 * Global error handler that catches all unhandled errors in the application
 * Extends Angular's ErrorHandler to provide centralized error handling
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    private errorService = inject(ErrorService);
    private ngZone = inject(NgZone);

    handleError(error: unknown): void {
        // Run inside NgZone to ensure change detection triggers
        this.ngZone.run(() => {
            // Extract error information
            const errorInfo = this.extractErrorInfo(error);

            // Log to console for debugging
            console.error('[GlobalErrorHandler] Unhandled error:', error);

            // Add to error service for UI display
            this.errorService.addError(errorInfo.message, {
                details: errorInfo.details,
                severity: 'error',
                source: errorInfo.source,
            });
        });
    }

    /**
     * Extract meaningful information from various error types
     */
    private extractErrorInfo(error: unknown): {
        message: string;
        details?: string;
        source?: string;
    } {
        // Handle Error objects
        if (error instanceof Error) {
            return {
                message: this.getUserFriendlyMessage(error),
                details: error.stack,
                source: error.name,
            };
        }

        // Handle HTTP errors (Angular HttpErrorResponse)
        if (this.isHttpError(error)) {
            const httpError = error as { status: number; statusText: string; message: string; url?: string };
            return {
                message: this.getHttpErrorMessage(httpError.status, httpError.statusText),
                details: `URL: ${httpError.url || 'unknown'}\nStatus: ${httpError.status}`,
                source: 'HttpError',
            };
        }

        // Handle string errors
        if (typeof error === 'string') {
            return {
                message: error,
                source: 'StringError',
            };
        }

        // Handle unknown errors
        return {
            message: 'An unexpected error occurred',
            details: JSON.stringify(error, null, 2),
            source: 'UnknownError',
        };
    }

    /**
     * Convert technical error messages to user-friendly messages
     */
    private getUserFriendlyMessage(error: Error): string {
        const message = error.message.toLowerCase();

        // Chunk loading errors (lazy loading failures)
        if (message.includes('chunk') || message.includes('loading chunk')) {
            return 'Failed to load a part of the application. Please refresh the page.';
        }

        // Network errors
        if (message.includes('network') || message.includes('fetch')) {
            return 'Network error. Please check your connection and try again.';
        }

        // Tauri/Backend errors
        if (message.includes('tauri') || message.includes('invoke')) {
            return 'Failed to communicate with the backend. Please restart the application.';
        }

        // MIDI errors
        if (message.includes('midi')) {
            return 'MIDI error. Please check your keyboard connection.';
        }

        // Audio context errors
        if (message.includes('audiocontext') || message.includes('audio')) {
            return 'Audio error. Please click anywhere on the page to enable audio.';
        }

        // Return original message if no specific handling
        return error.message || 'An unexpected error occurred';
    }

    /**
     * Get user-friendly message for HTTP status codes
     */
    private getHttpErrorMessage(status: number, statusText: string): string {
        switch (status) {
            case 0:
                return 'Unable to connect to the server. Please check your connection.';
            case 400:
                return 'Invalid request. Please check your input and try again.';
            case 401:
                return 'Authentication required. Please log in again.';
            case 403:
                return 'You do not have permission to perform this action.';
            case 404:
                return 'The requested resource was not found.';
            case 500:
                return 'Server error. Please try again later.';
            case 502:
            case 503:
            case 504:
                return 'Service temporarily unavailable. Please try again later.';
            default:
                return `Request failed: ${statusText || 'Unknown error'}`;
        }
    }

    /**
     * Check if error is an HTTP error response
     */
    private isHttpError(error: unknown): boolean {
        return (
            typeof error === 'object' &&
            error !== null &&
            'status' in error &&
            typeof (error as { status: unknown }).status === 'number'
        );
    }
}
