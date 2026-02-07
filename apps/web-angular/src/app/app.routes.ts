import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'lessons',
    loadComponent: () =>
      import('./pages/lesson-list/lesson-list.component').then(
        (m) => m.LessonListComponent
      ),
  },
  {
    path: 'lesson/:id',
    loadComponent: () =>
      import('./pages/lesson/lesson.component').then(
        (m) => m.LessonComponent
      ),
  },
  {
    path: 'results',
    loadComponent: () =>
      import('./pages/results/results.component').then(
        (m) => m.ResultsComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
