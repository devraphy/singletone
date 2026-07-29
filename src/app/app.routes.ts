import { Routes, UrlMatcher } from '@angular/router';
import { detectPreferredLanguage } from './i18n/language.service';

const sectionMatcher =
  (section: 'projects' | 'notes'): UrlMatcher =>
  (segments) => {
    if (segments[0]?.path !== section || segments.length > 2) return null;
    return segments[1]
      ? { consumed: segments, posParams: { slug: segments[1] } }
      : { consumed: segments };
  };

const localizedRoutes = (): Routes => [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomeComponent),
  },
  {
    matcher: sectionMatcher('projects'),
    data: { preloadDelay: 0 },
    loadComponent: () => import('./pages/projects/projects').then((m) => m.ProjectsComponent),
  },
  {
    matcher: sectionMatcher('notes'),
    data: { preloadDelay: 600 },
    loadComponent: () => import('./pages/notes/notes').then((m) => m.NotesComponent),
  },
  {
    path: '404',
    data: { status: '404' },
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
  },
  {
    path: 'error',
    data: { status: 'error' },
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
  },
  {
    path: ':pageSlug',
    data: { preloadDelay: 1000 },
    loadComponent: () => import('./pages/page/page').then((m) => m.PageComponent),
  },
  {
    path: '**',
    data: { status: '404' },
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
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
