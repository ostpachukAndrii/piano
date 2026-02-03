import { ApplicationConfig, provideZoneChangeDetection, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BACKEND_CLIENT, createBackendClient } from './core/api';
import { GlobalErrorHandler } from './core/services/global-error-handler.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    // Provide BackendClient for dependency injection
    {
      provide: BACKEND_CLIENT,
      useFactory: () => createBackendClient()
    },
    // Global error handler for unhandled errors
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    }
  ]
};
