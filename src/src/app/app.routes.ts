import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { LessonPlayerComponent } from './features/lesson-player/lesson-player.component';
import { LessonSelectorComponent } from './features/lesson-selector/lesson-selector.component';
import { SettingsComponent } from './features/settings/settings.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'lessons', component: LessonSelectorComponent },
    { path: 'lesson/:id', component: LessonPlayerComponent },
    { path: 'settings', component: SettingsComponent },
    { path: '**', redirectTo: '' }
];
