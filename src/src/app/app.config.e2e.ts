import { ApplicationConfig, provideZoneChangeDetection, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BACKEND_CLIENT } from './core/api/backend-client.interface';
import { MockBackendClient } from './core/api/mock-backend-client';
import { GlobalErrorHandler } from './core/services/global-error-handler.service';
import { TauriService } from './core/services/tauri.service';
import { MockTauriService } from './core/services/mock-tauri.service';

/**
 * E2E test app configuration
 *
 * Uses MockBackendClient and MockTauriService so the app runs
 * fully in the browser without Tauri backend.
 * Exposes MockBackendClient on window.__mockBackend for Playwright access.
 */

const mockBackend = new MockBackendClient();

// Expose on window so Playwright can call simulateChord() / simulateNoteOff()
(window as any).__mockBackend = mockBackend;

export const appConfigE2E: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideAnimationsAsync(),
        {
            provide: BACKEND_CLIENT,
            useValue: mockBackend,
        },
        {
            provide: TauriService,
            useClass: MockTauriService,
        },
        {
            provide: ErrorHandler,
            useClass: GlobalErrorHandler,
        },
    ],
};
