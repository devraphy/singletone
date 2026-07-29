import { Component, computed, input, signal } from '@angular/core';

/**
 * Print mount. Renders the real photograph when `src` resolves; falls back
 * to the placeholder gradient (with grain + plate number) if `src` is
 * unset or the file 404s, so dropping images in one at a time never breaks the page.
 */
@Component({
  selector: 'app-plate',
  standalone: true,
  templateUrl: './plate.html',
  styleUrl: './plate.scss',
})
export class PlateComponent {
  seed = input(0);
  ratio = input<'portrait' | 'square' | 'wide'>('portrait');
  /** Overrides `ratio` with the photo's own aspect ratio when known (e.g. from Sanity image metadata). */
  aspectRatio = input<number | undefined>(undefined);
  plateNumber = input<string>('');
  src = input<string | undefined>(undefined);
  srcset = input<string | undefined>(undefined);
  sizes = input<string | undefined>(undefined);
  alt = input<string>('');
  loading = input<'eager' | 'lazy'>('lazy');
  fetchPriority = input<'high' | 'low' | 'auto'>('auto');

  imgFailed = signal(false);
  loaded = signal(false);

  tone = computed(() => this.seed() % 5);
  showImage = computed(() => !!this.src() && !this.imgFailed());

  onImgLoad() {
    this.loaded.set(true);
  }

  onImgError() {
    this.imgFailed.set(true);
  }
}
