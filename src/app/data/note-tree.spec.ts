import { describe, expect, it } from 'vitest';
import { NoteGroupChild } from './content.types';
import { flattenNoteTree, notesInTree, parentGroupIdsForNote } from './note-tree';

const tree: NoteGroupChild[] = [
  {
    _type: 'noteGroup',
    _id: 'process',
    title: 'Process',
    children: [
      { _type: 'note', _id: 'sittings', title: 'Sittings', slug: 'sittings' },
      {
        _type: 'noteGroup',
        _id: 'printing',
        title: 'Printing',
        children: [
          { _type: 'note', _id: 'tests', title: 'Print tests', slug: 'tests' },
        ],
      },
    ],
  },
  { _type: 'note', _id: 'names', title: 'Names', slug: 'names' },
];

describe('note tree helpers', () => {
  it('flattens nested note groups in display order', () => {
    expect(
      flattenNoteTree(tree).map(({ node, depth, isLast }) => [
        node._id,
        depth,
        isLast,
      ]),
    ).toEqual([
      ['process', 0, false],
      ['sittings', 1, false],
      ['printing', 1, true],
      ['tests', 2, true],
      ['names', 0, true],
    ]);
  });

  it('returns notes only and finds all parents of a nested note', () => {
    expect(notesInTree(tree).map((note) => note._id)).toEqual([
      'sittings',
      'tests',
      'names',
    ]);
    expect(parentGroupIdsForNote(tree, 'tests')).toEqual(['process', 'printing']);
  });
});
