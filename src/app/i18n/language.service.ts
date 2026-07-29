import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export type Language = 'ko' | 'en';

const STORAGE_KEY = 'singletone-language';

export function detectPreferredLanguage(): Language {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'ko' || saved === 'en') return saved;
  return navigator.languages.some((language) => language.toLowerCase().startsWith('ko'))
    ? 'ko'
    : 'en';
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private router = inject(Router);
  private document = inject(DOCUMENT);

  readonly language = signal<Language>(this.languageFromPath() ?? this.preferredLanguage());

  constructor() {
    this.applyDocumentLanguage(this.language());
    this.updateAlternateLinks();
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      const routeLanguage = this.languageFromPath();
      if (routeLanguage && routeLanguage !== this.language()) {
        this.language.set(routeLanguage);
        this.applyDocumentLanguage(routeLanguage);
      }
      this.updateAlternateLinks();
    });
  }

  preferredLanguage(): Language {
    return detectPreferredLanguage();
  }

  path(...segments: Array<string | undefined>): string[] {
    return ['/', this.language(), ...segments.filter((segment): segment is string => !!segment)];
  }

  switchLanguage(language: Language) {
    localStorage.setItem(STORAGE_KEY, language);
    this.language.set(language);
    this.applyDocumentLanguage(language);

    const tree = this.router.parseUrl(this.router.url);
    const primary = tree.root.children['primary'];
    const segments = primary?.segments.map((segment) => segment.path) ?? [];
    if (segments[0] === 'ko' || segments[0] === 'en') segments[0] = language;
    else segments.unshift(language);

    this.router.navigateByUrl(
      this.router.createUrlTree(['/', ...segments], {
        queryParams: tree.queryParams,
        fragment: tree.fragment ?? undefined,
      }),
    );
  }

  private languageFromPath(): Language | undefined {
    const firstSegment = location.pathname.split('/').filter(Boolean)[0];
    return firstSegment === 'ko' || firstSegment === 'en' ? firstSegment : undefined;
  }

  private applyDocumentLanguage(language: Language) {
    this.document.documentElement.lang = language;
  }

  private updateAlternateLinks() {
    const segments = location.pathname.split('/').filter(Boolean);
    const rest = segments[0] === 'ko' || segments[0] === 'en' ? segments.slice(1) : segments;

    for (const language of ['ko', 'en'] as const) {
      let link = this.document.head.querySelector<HTMLLinkElement>(
        `link[rel="alternate"][hreflang="${language}"]`,
      );
      if (!link) {
        link = this.document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = language;
        this.document.head.appendChild(link);
      }
      link.href = new URL(`/${[language, ...rest].join('/')}`, location.origin).toString();
    }

    let xDefault = this.document.head.querySelector<HTMLLinkElement>(
      'link[rel="alternate"][hreflang="x-default"]',
    );
    if (!xDefault) {
      xDefault = this.document.createElement('link');
      xDefault.rel = 'alternate';
      xDefault.hreflang = 'x-default';
      this.document.head.appendChild(xDefault);
    }
    xDefault.href = new URL(`/${['en', ...rest].join('/')}`, location.origin).toString();
  }
}
