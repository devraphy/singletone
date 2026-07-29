import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, switchMap, timer } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UxPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    const delay = route.data?.['preloadDelay'];
    if (typeof delay !== 'number') return of(null);

    return timer(delay).pipe(switchMap(() => load()));
  }
}
