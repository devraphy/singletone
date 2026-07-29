import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  resource,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { map } from 'rxjs';
import { PlateComponent } from '../../shared/plate/plate';
import { ContentService } from '../../data/content.service';
import { imageSrcSet, imageUrl } from '../../data/sanity.client';
import { Plate } from '../../data/content.types';
import {
  flattenProjectTree,
  parentGroupIdsForSeries,
  seriesInProjectTree,
} from '../../data/project-tree';
import { LanguageService } from '../../i18n/language.service';
import { SeoService } from '../../seo/seo.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, PlateComponent],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class ProjectsComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private content = inject(ContentService);
  private seo = inject(SeoService);
  language = inject(LanguageService);

  private slug = toSignal(this.route.paramMap.pipe(map((p) => p.get('slug') ?? '')), {
    initialValue: '',
  });

  projectTree = computed(() => this.content.rootGroup.value()?.children ?? []);
  allSeries = computed(() => seriesInProjectTree(this.projectTree()));
  private selectedSlug = computed(() => this.slug() || this.allSeries()[0]?.slug || '');
  expandedGroups = signal<ReadonlySet<string>>(new Set());

  visibleProjectItems = computed(() =>
    flattenProjectTree(this.projectTree()).filter((item) =>
      item.parentIds.every((parentId) => this.expandedGroups().has(parentId)),
    ),
  );

  constructor() {
    this.content.loadNavigationTrees();

    effect(() => {
      const detailFailed = this.seriesResource.status() === 'error';
      const treeFailed = !this.slug() && this.content.rootGroup.status() === 'error';
      if (detailFailed || treeFailed) {
        this.router.navigate(this.language.path('error'), { replaceUrl: true });
      }
    });

    // Keep the parents of the currently selected child project expanded.
    effect(() => {
      const activeId = this.active()?._id;
      if (!activeId) return;
      const parentIds = parentGroupIdsForSeries(this.projectTree(), activeId);
      if (parentIds.every((id) => untracked(this.expandedGroups).has(id))) return;
      this.expandedGroups.update((current) => new Set([...current, ...parentIds]));
    });

    effect(() => {
      const series = this.active();
      if (!series) return;
      this.seo.update({
        title: series.title.replace(/\n/g, ' '),
        description: series.note,
        image: series.plates[0]?.image ? imageUrl(series.plates[0].image, 1600) : undefined,
      });
    });
  }

  private seriesResource = resource({
    params: () => ({ slug: this.selectedSlug(), lang: this.language.language() }),
    loader: ({ params }) => this.content.fetchSeries(params.slug, params.lang),
  });

  active = computed(() =>
    this.seriesResource.hasValue() ? (this.seriesResource.value() ?? undefined) : undefined,
  );
  imageUrl = imageUrl;
  imageSrcSet = imageSrcSet;

  prefetchSeries(slug?: string) {
    this.content.prefetchSeries(slug);
  }

  toggleGroup(groupId: string) {
    const opening = !this.expandedGroups().has(groupId);
    this.expandedGroups.update((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });

    if (opening) {
      const group = flattenProjectTree(this.projectTree()).find(
        (item) => item.node._id === groupId,
      )?.node;
      const firstChild = seriesInProjectTree(group?.children ?? [])[0];
      if (firstChild?.slug) {
        this.router.navigate(this.language.path('projects', firstChild.slug));
      }
    }
  }

  // Standard print ratios (3:2 landscape, 2:3 portrait) instead of each
  // photo's exact aspect ratio — keeps the grid visually consistent instead
  // of every cell being a slightly different shape, at the cost of a small
  // crop on photos that aren't already close to 3:2.
  plateAspectRatio(plate: Plate, layout?: 'default' | 'cinematic'): number {
    const ratio = plate.imageAspectRatio;
    if (layout === 'cinematic') return ratio ?? 21 / 9;
    if (!ratio) return 4 / 5;
    return ratio >= 1 ? 3 / 2 : 2 / 3;
  }

  lightboxPlate = signal<Plate | null>(null);
  lightboxLoaded = signal(false);
  lightboxLandscape = signal(false);
  lightboxPreviewSrc = signal('');
  lightboxHighResReady = signal(false);
  zoomScale = signal(1);
  zoomOriginX = signal(50);
  zoomOriginY = signal(50);
  private lightbox = viewChild<ElementRef<HTMLElement>>('lightbox');
  private lightboxClose = viewChild<ElementRef<HTMLButtonElement>>('lightboxClose');
  private lightboxTrigger: HTMLElement | null = null;
  private highResPreloads = new Map<string, Promise<boolean>>();

  private static readonly MAX_ZOOM = 4;
  private static readonly CLICK_ZOOM = 2.5;
  private static readonly LIGHTBOX_WIDTH = 3000;

  open(plate: Plate, event: MouseEvent) {
    const trigger = event.currentTarget as HTMLElement;
    this.lightboxTrigger = trigger;
    this.lightboxPreviewSrc.set(
      trigger.querySelector('img')?.currentSrc || imageUrl(plate.image, 700),
    );
    this.lightboxLoaded.set(true);
    this.lightboxLandscape.set((plate.imageAspectRatio ?? 0) >= 1);
    this.lightboxHighResReady.set(false);
    this.lightboxPlate.set(plate);
    this.resetZoom();
    document.body.style.overflow = 'hidden';
    queueMicrotask(() => this.lightboxClose()?.nativeElement.focus());
    this.prepareLightboxImage(plate);
  }

  close() {
    if (!this.lightboxPlate()) return;
    this.lightboxPlate.set(null);
    document.body.style.overflow = '';
    this.resetZoom();
    const trigger = this.lightboxTrigger;
    this.lightboxTrigger = null;
    queueMicrotask(() => trigger?.focus());
  }

  onLightboxBackdropClick(event: MouseEvent) {
    if (event.target !== event.currentTarget || !this.lightboxPlate()) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.stepLightbox(event.clientX < rect.left + rect.width / 2 ? -1 : 1);
  }

  stepLightbox(offset: number) {
    const current = this.lightboxPlate();
    const plates = this.active()?.plates ?? [];
    if (!current || plates.length < 2) return;
    const index = plates.findIndex((plate) => plate._key === current._key);
    const next = plates[(index + offset + plates.length) % plates.length];
    this.lightboxPreviewSrc.set(imageUrl(next.image, 700));
    this.lightboxLoaded.set(true);
    this.lightboxLandscape.set((next.imageAspectRatio ?? 0) >= 1);
    this.lightboxHighResReady.set(false);
    this.lightboxPlate.set(next);
    this.resetZoom();
    this.prepareLightboxImage(next);
  }

  preloadPlate(plate: Plate) {
    void this.preloadHighRes(plate);
  }

  lightboxImageSrc(plate: Plate): string {
    return this.lightboxHighResReady()
      ? imageUrl(plate.image, ProjectsComponent.LIGHTBOX_WIDTH)
      : this.lightboxPreviewSrc();
  }

  private async prepareLightboxImage(plate: Plate) {
    this.preloadAdjacent(plate);
    const loaded = await this.preloadHighRes(plate);
    if (loaded && this.lightboxPlate()?._key === plate._key) {
      this.lightboxHighResReady.set(true);
    }
  }

  private preloadAdjacent(plate: Plate) {
    const plates = this.active()?.plates ?? [];
    if (plates.length < 2) return;
    const index = plates.findIndex((item) => item._key === plate._key);
    if (index < 0) return;
    void this.preloadHighRes(plates[(index - 1 + plates.length) % plates.length]);
    void this.preloadHighRes(plates[(index + 1) % plates.length]);
  }

  private preloadHighRes(plate: Plate): Promise<boolean> {
    const url = imageUrl(plate.image, ProjectsComponent.LIGHTBOX_WIDTH);
    const existing = this.highResPreloads.get(url);
    if (existing) return existing;

    const request = new Promise<boolean>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = url;
    });
    this.highResPreloads.set(url, request);
    return request;
  }

  onLightboxImgLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    this.lightboxLandscape.set(img.naturalWidth > img.naturalHeight);
    this.lightboxLoaded.set(true);
  }

  onLightboxWheel(event: WheelEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.updateZoomOrigin(event);
    const next = this.zoomScale() - event.deltaY * 0.012;
    this.zoomScale.set(Math.min(ProjectsComponent.MAX_ZOOM, Math.max(1, next)));
  }

  onLightboxImgClick(event: MouseEvent) {
    event.stopPropagation();
    if (this.zoomScale() > 1) {
      this.resetZoom();
    } else {
      this.updateZoomOrigin(event);
      this.zoomScale.set(ProjectsComponent.CLICK_ZOOM);
    }
  }

  onLightboxMouseMove(event: MouseEvent) {
    if (this.zoomScale() > 1) {
      this.updateZoomOrigin(event);
    }
  }

  private updateZoomOrigin(event: MouseEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.zoomOriginX.set(Math.min(100, Math.max(0, x)));
    this.zoomOriginY.set(Math.min(100, Math.max(0, y)));
  }

  private resetZoom() {
    this.zoomScale.set(1);
    this.zoomOriginX.set(50);
    this.zoomOriginY.set(50);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (!this.lightboxPlate()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.stepLightbox(event.key === 'ArrowLeft' ? -1 : 1);
    } else if (event.key === 'Tab') {
      const dialog = this.lightbox()?.nativeElement;
      if (!dialog) return;
      const focusable = [
        ...dialog.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])'),
      ];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }
}
