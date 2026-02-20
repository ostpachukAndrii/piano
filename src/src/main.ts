import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

const isE2E = new URLSearchParams(window.location.search).has('e2e');

(isE2E
  ? import('./app/app.config.e2e').then(m => m.appConfigE2E)
  : import('./app/app.config').then(m => m.appConfig)
).then(config =>
  bootstrapApplication(AppComponent, config)
).catch((err) => console.error(err));
