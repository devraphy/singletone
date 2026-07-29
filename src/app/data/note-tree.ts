import { NoteGroupChild } from './content.types';

export interface NoteTreeItem {
  node: NoteGroupChild;
  depth: number;
  parentIds: string[];
  isLast: boolean;
}

export function flattenNoteTree(
  nodes: NoteGroupChild[],
  depth = 0,
  parentIds: string[] = [],
): NoteTreeItem[] {
  return nodes.flatMap((node, index) => [
    { node, depth, parentIds, isLast: index === nodes.length - 1 },
    ...(node._type === 'noteGroup'
      ? flattenNoteTree(node.children ?? [], depth + 1, [...parentIds, node._id])
      : []),
  ]);
}

export function notesInTree(nodes: NoteGroupChild[]): NoteGroupChild[] {
  return flattenNoteTree(nodes)
    .map((item) => item.node)
    .filter((node) => node._type === 'note');
}

export function parentGroupIdsForNote(
  nodes: NoteGroupChild[],
  noteId: string,
): string[] {
  return flattenNoteTree(nodes).find((item) => item.node._id === noteId)?.parentIds ?? [];
}
