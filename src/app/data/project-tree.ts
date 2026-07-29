import { GroupChild } from './content.types';

export interface ProjectTreeItem {
  node: GroupChild;
  depth: number;
  parentIds: string[];
  isLast: boolean;
}

export function flattenProjectTree(
  nodes: GroupChild[],
  depth = 0,
  parentIds: string[] = [],
): ProjectTreeItem[] {
  return nodes.flatMap((node, i) => [
    { node, depth, parentIds, isLast: i === nodes.length - 1 },
    ...(node._type === 'group'
      ? flattenProjectTree(node.children ?? [], depth + 1, [...parentIds, node._id])
      : []),
  ]);
}

export function seriesInProjectTree(nodes: GroupChild[]): GroupChild[] {
  return flattenProjectTree(nodes)
    .map((item) => item.node)
    .filter((node) => node._type === 'series');
}

export function parentGroupIdsForSeries(nodes: GroupChild[], seriesId: string): string[] {
  return flattenProjectTree(nodes).find((item) => item.node._id === seriesId)?.parentIds ?? [];
}
