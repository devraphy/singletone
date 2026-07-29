import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withInMemoryScrolling,
  withPreloading,
  withViewTransitions,
} from '@angular/router';

import { routes } from './app.routes';
import { UxPreloadingStrategy } from './ux-preloading.strategy';

function routeSection(snapshot: {
  firstChild: unknown;
  data?: Record<string, unknown>;
}): string | undefined {
  let current = snapshot;
  while (current.firstChild) {
    current = current.firstChild as typeof current;
  }
  return typeof current.data?.['section'] === 'string' ? current.data['section'] : undefined;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      withPreloading(UxPreloadingStrategy),
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ from, to, transition }) => {
          // Internal project and note changes have their own content motion.
          // Running the root cross-fade too makes the tree and content flash
          // once during navigation and again when the fetched content arrives.
          const fromSection = routeSection(from);
          if (fromSection && fromSection === routeSection(to)) {
            transition.skipTransition();
          }
        },
      }),
    ),
  ],
};
