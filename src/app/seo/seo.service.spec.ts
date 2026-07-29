import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { afterEach, describe, expect, it } from 'vitest';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  afterEach(() => {
    document.head.querySelector('link[rel="canonical"]')?.remove();
  });

  it('updates the document title, social metadata, and canonical URL', () => {
    const service = TestBed.inject(SeoService);
    const title = TestBed.inject(Title);
    const meta = TestBed.inject(Meta);

    service.update({
      title: 'Hanrabong',
      description: 'A photographic project.',
      image: 'https://cdn.example/image.jpg',
    });

    expect(title.getTitle()).toBe('Hanrabong — Lee Gyun Hyoung');
    expect(meta.getTag('property="og:title"')?.content).toBe(
      'Hanrabong — Lee Gyun Hyoung',
    );
    expect(meta.getTag('property="og:image"')?.content).toBe(
      'https://cdn.example/image.jpg',
    );
    expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toBe(
      location.href,
    );
  });
});
