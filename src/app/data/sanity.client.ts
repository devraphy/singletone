import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageRef } from './content.types';

export const sanityClient = createClient({
  projectId: 'xdoaimqw',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
});

const builder = imageUrlBuilder(sanityClient);

export function imageUrl(source: SanityImageRef, width = 1200): string {
  return builder.image(source).width(width).fit('max').auto('format').url();
}

export function imageSrcSet(source: SanityImageRef, widths: number[]): string {
  return widths.map((width) => `${imageUrl(source, width)} ${width}w`).join(', ');
}
