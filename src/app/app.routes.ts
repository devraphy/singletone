import { Routes } from '@angular/router';
import { detectPreferredLanguage } from './i18n/language.service';

const localizedRoutes = (): Routes => [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'projects',
    loadComponent: () => import('./pages/projects/projects').then((m) => m.ProjectsComponent),
  },
  {
    path: 'projects/:slug',
    loadComponent: () => import('./pages/projects/projects').then((m) => m.ProjectsComponent),
  },
  {
    path: 'notes',
    loadComponent: () => import('./pages/notes/notes').then((m) => m.NotesComponent),
  },
  {
    path: 'notes/:slug',
    loadComponent: () => import('./pages/notes/notes').then((m) => m.NotesComponent),
  },
  {
    path: '404',
    data: { status: '404' },
    loadComponent: () =>
      import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
  },
  {
    path: 'error',
    data: { status: 'error' },
    loadComponent: () =>
      import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
  },
  {
    path: ':pageSlug',
    loadComponent: () => import('./pages/page/page').then((m) => m.PageComponent),
  },
  {
    path: '**',
    data: { status: '404' },
    loadComponent: () =>
      import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];

export const routes: Routes = [
  { path: 'ko', children: localizedRoutes() },
  { path: 'en', children: localizedRoutes() },
  {
    path: '**',
    redirectTo: ({ url }) => {
      const language = detectPreferredLanguage();
      const legacyPath = url.map((segment) => segment.path).join('/');
      return legacyPath ? `/${language}/${legacyPath}` : `/${language}`;
    },
  },
];
