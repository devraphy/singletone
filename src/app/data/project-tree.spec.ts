import { describe, expect, it } from 'vitest';
import { GroupChild } from './content.types';
import {
  flattenProjectTree,
  parentGroupIdsForSeries,
  seriesInProjectTree,
} from './project-tree';

const tree: GroupChild[] = [
  {
    _type: 'group',
    _id: 'dream',
    title: 'Taemong',
    children: [
      { _type: 'series', _id: 'hallabong', title: 'Hanrabong', slug: 'hanrabong' },
      {
        _type: 'group',
        _id: 'zodiac',
        title: 'Zodiac',
        children: [{ _type: 'series', _id: 'horse', title: 'Horse', slug: 'horse' }],
      },
    ],
  },
  { _type: 'series', _id: 'weather', title: 'Interior Weather', slug: 'weather' },
];

describe('project tree helpers', () => {
  it('flattens nested groups in display order with correct depth and branch endings', () => {
    const items = flattenProjectTree(tree);

    expect(items.map(({ node, depth, isLast }) => [node._id, depth, isLast])).toEqual([
      ['dream', 0, false],
      ['hallabong', 1, false],
      ['zodiac', 1, true],
      ['horse', 2, true],
      ['weather', 0, true],
    ]);
  });

  it('returns series only, preserving their visual order', () => {
    expect(seriesInProjectTree(tree).map((node) => node._id)).toEqual([
      'hallabong',
      'horse',
      'weather',
    ]);
  });

  it('returns every parent required to reveal a nested series', () => {
    expect(parentGroupIdsForSeries(tree, 'horse')).toEqual(['dream', 'zodiac']);
    expect(parentGroupIdsForSeries(tree, 'missing')).toEqual([]);
  });
});
