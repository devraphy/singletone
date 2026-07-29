import { Injectable, computed, effect, inject, resource, signal } from '@angular/core';
import { sanityClient } from './sanity.client';
import { GroupDoc, NoteDoc, NoteGroupDoc, PageDoc, SeriesDoc } from './content.types';
import { Language, LanguageService } from '../i18n/language.service';

const ROOT_GROUP_QUERY = `*[_type == "group" && isRoot == true][0]{
  _id,
  "title": coalesce(select($lang == "ko" => titleKo, titleEn), title),
  children[@->hidden != true]->{
    _type,
    _id,
    "title": coalesce(select($lang == "ko" => titleKo, titleEn), title),
    "slug": slug.current,
    children[@->hidden != true]->{
      _type,
      _id,
      "title": coalesce(select($lang == "ko" => titleKo, titleEn), title),
      "slug": slug.current,
      children[@->hidden != true]->{
        _type,
        _id,
        "title": coalesce(select($lang == "ko" => titleKo, titleEn), title),
        "slug": slug.current,
        children[@->hidden != true]->{
          _type,
          _id,
          "title": coalesce(select($lang == "ko" => titleKo, titleEn), title),
          "slug": slug.current
        }
      }
    }
  }
}`;

const SERIES_QUERY = `*[_type == "series" && slug.current == $slug && hidden != true][0]{
  _id,
  "title": coalesce(select($lang == "ko" => titleKo, titleEn), title),
  "slug": slug.current,
  year,
  layout,
  "medium": coalesce(select($lang == "ko" => mediumKo, mediumEn), medium),
  "note": coalesce(select($lang == "ko" => noteKo, noteEn), note),
  "plates": coalesce(plates[]{
      _key,
      "title": coalesce(select($lang == "ko" => titleKo, titleEn), title),
      dimensions, edition, image,
      "imageAspectRatio": image.asset->metadata.dimensions.aspectRatio
    }, [])
}`;

const PAGES_QUERY = `*[_type == "page" && showInNav == true] | order(order asc){
  _id,
  "menuLabel": coalesce(select($lang == "ko" => menuLabelKo, menuLabelEn), menuLabel),
  "slug": slug.current,
  order,
  "body": coalesce(select($lang == "ko" => bodyKo, bodyEn), body),
  "exhibitions": exhibitions[]{
    ...,
    "title": coalesce(select($lang == "ko" => titleKo, titleEn), title),
    "venue": coalesce(select($lang == "ko" => venueKo, venueEn), venue)
  },
  "links": links[]{
    ...,
    "label": coalesce(select($lang == "ko" => labelKo, labelEn), label),
    "value": coalesce(select($lang == "ko" => valueKo, valueEn), value),
    "note": coalesce(select($lang == "ko" => noteKo, noteEn), note)
  },
  "location": coalesce(select($lang == "ko" => locationKo, locationEn), location)
}`;

const PAGE_QUERY = `*[_type == "page" && slug.current == $slug][0]{
  _id,
  "menuLabel": coalesce(select($lang == "ko" => menuLabelKo, menuLabelEn), menuLabel),
  "slug": slug.current,
  order,
  "body": coalesce(select($lang == "ko" => bodyKo, bodyEn), body),
  "exhibitions": exhibitions[]{
    ...,
    "title": coalesce(select($lang == "ko" => titleKo, titleEn), title),
    "venue": coalesce(select($lang == "ko" => venueKo, venueEn), venue)
  },
  "links": links[]{
    ...,
    "label": coalesce(select($lang == "ko" => labelKo, labelEn), label),
    "value": coalesce(select($lang == "ko" => valueKo, valueEn), value),
    "note": coalesce(select($lang == "ko" => noteKo, noteEn), note)
  },
  "location": coalesce(select($lang == "ko" => locationKo, locationEn), location)
}`;

const ROOT_NOTE_GROUP_QUERY = `*[_type == "noteGroup" && isRoot == true][0]{
  _id,
  "title": coalesce(select($lang == "ko" => titleKo, titleEn), title),
  children[]->{
    _type,
    _id,
    "title": coalesce(select($lang == "ko" => titleKo, titleEn), title),
    "slug": slug.current,
    children[]->{
      _type,
      _id,
      "title": coalesce(select($lang == "ko" => titleKo, titleEn), title),
      "slug": slug.current,
      children[]->{
        _type,
        _id,
        "title": coalesce(select($lang == "ko" => titleKo, titleEn), title),
        "slug": slug.current,
        children[]->{
          _type,
          _id,
          "title": coalesce(select($lang == "ko" => titleKo, titleEn), title),
          "slug": slug.current
        }
      }
    }
  }
}`;

const NOTE_QUERY = `*[_type == "note" && slug.current == $slug][0]{
  _id,
  "title": coalesce(select($lang == "ko" => titleKo, titleEn), title),
  "slug": slug.current,
  date,
  "excerpt": coalesce(select($lang == "ko" => excerptKo, excerptEn), excerpt),
  "body": coalesce(select($lang == "ko" => bodyKo, bodyEn), body)
}`;

@Injectable({ providedIn: 'root' })
export class ContentService {
  private language = inject(LanguageService);
  private navigationTreesEnabled = signal(false);
  private seriesRequests = new Map<string, Promise<SeriesDoc | null>>();
  private noteRequests = new Map<string, Promise<NoteDoc | null>>();
  private pageRequests = new Map<string, Promise<PageDoc | null>>();

  /**
   * Project and note trees are only needed by their index pages and the
   * expanded mobile menu. Keeping params undefined prevents Angular resource
   * from starting either Sanity request during the critical first render.
   */
  rootGroup = resource<GroupDoc | undefined, Language | undefined>({
    params: () => (this.navigationTreesEnabled() ? this.language.language() : undefined),
    loader: ({ params }) =>
      sanityClient.fetch<GroupDoc | undefined>(ROOT_GROUP_QUERY, { lang: params }),
  });

  fetchSeries(slug: string, lang = this.language.language()): Promise<SeriesDoc | null> {
    if (!slug) return Promise.resolve(null);
    return this.cachedFetch(this.seriesRequests, `${lang}:${slug}`, () =>
      sanityClient.fetch<SeriesDoc | null>(SERIES_QUERY, { slug, lang }),
    );
  }

  /** Nav-visible CMS pages (Statement, Contact, and any added later), in menu order. */
  pages = resource<PageDoc[], Language>({
    params: this.language.language,
    loader: ({ params }) => sanityClient.fetch<PageDoc[]>(PAGES_QUERY, { lang: params }),
  });

  fetchPage(slug: string, lang = this.language.language()): Promise<PageDoc | null> {
    if (!slug) return Promise.resolve(null);
    const loadedPage =
      lang === this.language.language()
        ? this.pages.value()?.find((page) => page.slug === slug)
        : null;
    if (loadedPage) return Promise.resolve(loadedPage);
    return this.cachedFetch(this.pageRequests, `${lang}:${slug}`, () =>
      sanityClient.fetch<PageDoc | null>(PAGE_QUERY, { slug, lang }),
    );
  }

  rootNoteGroup = resource<NoteGroupDoc | undefined, Language | undefined>({
    params: () => (this.navigationTreesEnabled() ? this.language.language() : undefined),
    loader: ({ params }) =>
      sanityClient.fetch<NoteGroupDoc | undefined>(ROOT_NOTE_GROUP_QUERY, { lang: params }),
  });

  navigationTreesLoading = computed(
    () =>
      this.navigationTreesEnabled() &&
      (this.rootGroup.status() === 'loading' || this.rootNoteGroup.status() === 'loading'),
  );

  loadNavigationTrees() {
    this.navigationTreesEnabled.set(true);
  }

  fetchNote(slug: string, lang = this.language.language()): Promise<NoteDoc | null> {
    if (!slug) return Promise.resolve(null);
    return this.cachedFetch(this.noteRequests, `${lang}:${slug}`, () =>
      sanityClient.fetch<NoteDoc | null>(NOTE_QUERY, { slug, lang }),
    );
  }

  prefetchSeries(slug?: string) {
    if (slug) void this.fetchSeries(slug);
  }

  prefetchNote(slug?: string) {
    if (slug) void this.fetchNote(slug);
  }

  prefetchPage(slug?: string) {
    if (slug) void this.fetchPage(slug);
  }

  constructor() {
    // Prepare the default detail behind the two primary navigation targets.
    // The request cache means the route reuses this exact promise/result.
    effect(() => {
      const firstSeries = this.firstLeafSlug(this.rootGroup.value()?.children, 'series');
      if (firstSeries) this.prefetchSeries(firstSeries);

      const firstNote = this.firstLeafSlug(this.rootNoteGroup.value()?.children, 'note');
      if (firstNote) this.prefetchNote(firstNote);
    });
  }

  private cachedFetch<T>(
    cache: Map<string, Promise<T>>,
    key: string,
    request: () => Promise<T>,
  ): Promise<T> {
    const cached = cache.get(key);
    if (cached) return cached;

    const pending = request().catch((error) => {
      cache.delete(key);
      throw error;
    });
    cache.set(key, pending);
    return pending;
  }

  private firstLeafSlug(
    children: Array<{ _type: string; slug?: string; children?: unknown[] }> | undefined,
    leafType: 'series' | 'note',
  ): string | undefined {
    for (const child of children ?? []) {
      if (child._type === leafType && child.slug) return child.slug;
      const nested = this.firstLeafSlug(
        child.children as Array<{ _type: string; slug?: string; children?: unknown[] }> | undefined,
        leafType,
      );
      if (nested) return nested;
    }
    return undefined;
  }
}
