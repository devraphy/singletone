export interface SanityImageRef {
  _type: 'image';
  asset: { _ref: string; _type: 'reference' };
}

export interface Plate {
  _key: string;
  title: string;
  dimensions?: string;
  edition?: string;
  image: SanityImageRef;
  imageAspectRatio?: number;
}

export interface SeriesDoc {
  _id: string;
  title: string;
  slug: string;
  year: string;
  medium: string;
  note: string;
  layout?: 'default' | 'cinematic';
  plates: Plate[];
}

export interface GroupChild {
  _type: 'group' | 'series';
  _id: string;
  title: string;
  slug?: string;
  children?: GroupChild[];
}

export interface GroupDoc {
  _id: string;
  title: string;
  children: GroupChild[];
}

export interface ExhibitionEntry {
  year: string;
  title: string;
  venue: string;
}

export interface PageLink {
  label: string;
  value: string;
  url: string;
  note?: string;
}

export interface PageDoc {
  _id: string;
  menuLabel: string;
  slug: string;
  order: number;
  body?: unknown[];
  exhibitions?: ExhibitionEntry[];
  links?: PageLink[];
  location?: string;
}

export interface NoteDoc {
  _id: string;
  title: string;
  slug: string;
  date: string;
  excerpt?: string;
  body: unknown[];
}

export interface NoteGroupChild {
  _type: 'noteGroup' | 'note';
  _id: string;
  title: string;
  slug?: string;
  children?: NoteGroupChild[];
}

export interface NoteGroupDoc {
  _id: string;
  title: string;
  children: NoteGroupChild[];
}
