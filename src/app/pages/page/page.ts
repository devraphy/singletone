import { Component, computed, effect, inject, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { toHTML, uriLooksSafe } from '@portabletext/to-html';
import { ContentService } from '../../data/content.service';
import { LanguageService } from '../../i18n/language.service';
import { SeoService } from '../../seo/seo.service';

@Component({
  selector: 'app-page',
  standalone: true,
  templateUrl: './page.html',
  styleUrl: './page.scss',
})
export class PageComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private content = inject(ContentService);
  private seo = inject(SeoService);
  language = inject(LanguageService);

  private slug = toSignal(this.route.paramMap.pipe(map((p) => p.get('pageSlug') ?? '')), {
    initialValue: '',
  });

  private pageResource = resource({
    params: () => ({ slug: this.slug(), lang: this.language.language() }),
    loader: ({ params }) => this.content.fetchPage(params.slug, params.lang),
  });

  page = computed(() =>
    this.pageResource.hasValue() ? (this.pageResource.value() ?? undefined) : undefined,
  );

  constructor() {
    effect(() => {
      if (this.pageResource.status() === 'error') {
        this.router.navigate(this.language.path('error'), { replaceUrl: true });
      }
    });

    // Unknown slugs (bad links, deleted CMS pages) fall back to home instead of a blank page.
    effect(() => {
      if (this.pageResource.status() === 'resolved' && !this.pageResource.value()) {
        this.router.navigate(this.language.path('404'), { replaceUrl: true });
      }
    });

    effect(() => {
      const page = this.page();
      if (page) this.seo.update({ title: page.menuLabel });
    });
  }

  bodyHtml = computed(() => {
    const body = this.page()?.body;
    if (!body?.length) return '';
    return toHTML(body as never, {
      components: {
        marks: {
          link: ({ children, value }) => {
            const href = value?.['href'] ?? '';
            if (!uriLooksSafe(href)) return children;
            const external = /^https?:/.test(href);
            const rel = external ? ' target="_blank" rel="noopener noreferrer"' : '';
            return `<a href="${href}"${rel}>${children}</a>`;
          },
        },
      },
    });
  });

  isExternal(url: string) {
    return /^https?:/.test(url);
  }

}
