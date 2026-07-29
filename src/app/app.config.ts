import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  withInMemoryScrolling,
  withPreloading,
  withViewTransitions,
} from '@angular/router';

import { routes } from './app.routes';

function routePath(snapshot: { firstChild: unknown; routeConfig?: { path?: string } | null }) {
  let current = snapshot;
  while (current.firstChild) {
    current = current.firstChild as typeof current;
  }
  return current.routeConfig?.path;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      // The site has only a few small lazy chunks. Loading them after the
      // initial navigation removes the pause on each route's first visit
      // without adding them to the critical initial bundle.
      withPreloading(PreloadAllModules),
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ from, to, transition }) => {
          // Project-to-project navigation already has its own content motion.
          // A root snapshot cross-fade keeps the old project visibly frozen for
          // 320ms, making a completed API request appear delayed.
          if (routePath(from) === 'projects/:slug' && routePath(to) === 'projects/:slug') {
            transition.skipTransition();
          }
        },
      }),
    ),
  ],
};
