import {
  Component,
  DestroyRef,
  HostListener,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ContentService } from '../../data/content.service';
import { flattenProjectTree, seriesInProjectTree } from '../../data/project-tree';
import { flattenNoteTree, notesInTree } from '../../data/note-tree';
import { Language, LanguageService, textLanguage } from '../../i18n/language.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class NavComponent {
  private content = inject(ContentService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  language = inject(LanguageService);
  textLanguage = textLanguage;

  private projectTree = computed(() => this.content.rootGroup.value()?.children ?? []);
  expandedProjectGroups = signal<ReadonlySet<string>>(new Set());
  visibleProjectItems = computed(() =>
    flattenProjectTree(this.projectTree()).filter((item) =>
      item.parentIds.every((parentId) => this.expandedProjectGroups().has(parentId)),
    ),
  );

  private noteTree = computed(() => this.content.rootNoteGroup.value()?.children ?? []);
  expandedNoteGroups = signal<ReadonlySet<string>>(new Set());
  visibleNoteItems = computed(() =>
    flattenNoteTree(this.noteTree()).filter((item) =>
      item.parentIds.every((parentId) => this.expandedNoteGroups().has(parentId)),
    ),
  );

  pageLinks = computed(() => this.content.pages.value() ?? []);
  navigationTreesLoading = this.content.navigationTreesLoading;

  menuOpen = signal(false);

  constructor() {
    // Fetch immediately after the first render. It cannot delay the initial
    // paint, but it is ready sooner for the user's first navigation.
    afterNextRender(() => {
      const timerId = window.setTimeout(() => this.content.loadNavigationTrees());
      this.destroyRef.onDestroy(() => window.clearTimeout(timerId));
    });
  }

  prepareMenu() {
    this.content.loadNavigationTrees();
  }

  prepareProject(slug?: string) {
    this.prepareMenu();
    this.content.prefetchSeries(slug);
  }

  prepareNote(slug?: string) {
    this.prepareMenu();
    this.content.prefetchNote(slug);
  }

  preparePage(slug?: string) {
    this.content.prefetchPage(slug);
  }

  sectionLink(section: 'projects' | 'notes'): string | string[] {
    const currentPath = this.router.url.split(/[?#]/, 1)[0];
    const segments = currentPath.split('/').filter(Boolean);
    return segments[1] === section ? currentPath : this.language.path(section);
  }

  toggle() {
    this.prepareMenu();
    const next = !this.menuOpen();
    this.menuOpen.set(next);
    document.body.style.overflow = next ? 'hidden' : '';
  }

  close() {
    this.menuOpen.set(false);
    document.body.style.overflow = '';
  }

  toggleProjectGroup(groupId: string) {
    const opening = !this.expandedProjectGroups().has(groupId);
    this.expandedProjectGroups.update((current) => {
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

  toggleNoteGroup(groupId: string) {
    const opening = !this.expandedNoteGroups().has(groupId);
    this.expandedNoteGroups.update((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });

    if (opening) {
      const group = flattenNoteTree(this.noteTree()).find(
        (item) => item.node._id === groupId,
      )?.node;
      const firstNote = notesInTree(group?.children ?? [])[0];
      if (firstNote?.slug) {
        this.router.navigate(this.language.path('notes', firstNote.slug));
      }
    }
  }

  selectLanguage(language: Language) {
    this.language.switchLanguage(language);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.close();
  }
}
