import { Component, computed, effect, inject, resource, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { map } from 'rxjs';
import { toHTML, uriLooksSafe } from '@portabletext/to-html';
import { ContentService } from '../../data/content.service';
import { LanguageService } from '../../i18n/language.service';
import { SeoService } from '../../seo/seo.service';
import {
  flattenNoteTree,
  notesInTree,
  parentGroupIdsForNote,
} from '../../data/note-tree';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './notes.html',
  styleUrl: './notes.scss',
})
export class NotesComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private content = inject(ContentService);
  private seo = inject(SeoService);
  language = inject(LanguageService);

  private slug = toSignal(this.route.paramMap.pipe(map((p) => p.get('slug') ?? '')), {
    initialValue: '',
  });

  noteTree = computed(() => this.content.rootNoteGroup.value()?.children ?? []);
  allNotes = computed(() => notesInTree(this.noteTree()));
  expandedGroups = signal<ReadonlySet<string>>(new Set());
  visibleNoteItems = computed(() =>
    flattenNoteTree(this.noteTree()).filter((item) =>
      item.parentIds.every((parentId) => this.expandedGroups().has(parentId)),
    ),
  );

  constructor() {
    effect(() => {
      const detailFailed = this.noteResource.status() === 'error';
      const treeFailed = !this.slug() && this.content.rootNoteGroup.status() === 'error';
      if (detailFailed || treeFailed) {
        this.router.navigate(this.language.path('error'), { replaceUrl: true });
      }
    });

    // "/notes" with no slug lands on the first note once the tree has loaded.
    effect(() => {
      const first = this.allNotes()[0];
      if (!this.slug() && first) {
        this.router.navigate(this.language.path('notes', first.slug), { replaceUrl: true });
      }
    });

    effect(() => {
      const note = this.active();
      if (!note) return;
      this.seo.update({ title: note.title, description: note.excerpt });
    });

    effect(() => {
      const activeId = this.active()?._id;
      if (!activeId) return;
      const parentIds = parentGroupIdsForNote(this.noteTree(), activeId);
      if (parentIds.every((id) => untracked(this.expandedGroups).has(id))) return;
      this.expandedGroups.update((current) => new Set([...current, ...parentIds]));
    });
  }

  private noteResource = resource({
    params: () => ({ slug: this.slug(), lang: this.language.language() }),
    loader: ({ params }) => this.content.fetchNote(params.slug, params.lang),
  });

  active = computed(() =>
    this.noteResource.hasValue() ? (this.noteResource.value() ?? undefined) : undefined,
  );

  toggleGroup(groupId: string) {
    const opening = !this.expandedGroups().has(groupId);
    this.expandedGroups.update((current) => {
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

  bodyHtml = computed(() => {
    const body = this.active()?.body;
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
}
