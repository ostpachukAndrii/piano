import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { LessonPlayerComponent } from './features/lesson-player/lesson-player.component';
import { LessonSelectorComponent } from './features/lesson-selector/lesson-selector.component';
import { SettingsComponent } from './features/settings/settings.component';
import { ClefDemoPageComponent } from './features/lesson-player/notation-stage/clef-demo-page.component';
import { ClefSizeTestComponent } from './features/lesson-player/notation-stage/clef-size-test.component';
import { AnchorPointsPageComponent } from './features/lesson-player/notation-stage/anchor-points-page.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'lessons', component: LessonSelectorComponent },
    { path: 'lesson/:id', component: LessonPlayerComponent },
    { path: 'settings', component: SettingsComponent },
    { path: 'clef-demo', component: ClefDemoPageComponent },
    { path: 'clef-test', component: ClefSizeTestComponent },
    { path: 'anchor-points', component: AnchorPointsPageComponent },
    { path: '**', redirectTo: '' }
];
