import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BACKEND_CLIENT, createBackendClient } from './core/api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    // Provide BackendClient for dependency injection
    {
      provide: BACKEND_CLIENT,
      useFactory: () => createBackendClient()
    }
  ]
};
