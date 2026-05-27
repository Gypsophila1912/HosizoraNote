import { Node } from "@/db/repositories/nodeRepository";
import { LayoutNode } from "@/components/NodeCard";

export const NODE_W = 140;
export const NODE_H = 72;
export const H_GAP = 24;
export const V_GAP = 60;
export const PADDING = 48;

export type Edge = { px: number; py: number; cx: number; cy: number };

function branchSubtreeWidth(
  nodeId: number,
  childMap: Record<number, Node[]>,
): number {
  const branches = getBranchChildren(nodeId, childMap);
  if (branches.length === 0) return NODE_W;
  return Math.max(
    NODE_W,
    branches.reduce(
      (sum, c) => sum + branchSubtreeWidth(c.id, childMap) + H_GAP,
      -H_GAP,
    ),
  );
}

function getBranchChildren(
  nodeId: number,
  childMap: Record<number, Node[]>,
): Node[] {
  return (childMap[nodeId] ?? [])
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(1);
}

export function assignPositions(
  node: Node,
  centerX: number,
  topY: number,
  childMap: Record<number, Node[]>,
): LayoutNode {
  const children = (childMap[node.id] ?? [])
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt);

  const layoutChildren: LayoutNode[] = [];
  const childY = topY + NODE_H + V_GAP;

  if (children.length > 0) {
    let curX = centerX + NODE_W / 2 + H_GAP * 2;
    for (const c of children) {
      const bw = branchSubtreeWidth(c.id, childMap);
      layoutChildren.push(assignPositions(c, curX + bw / 2, childY, childMap));
      curX += bw + H_GAP;
    }
  }

  return { node, x: centerX, y: topY, children: layoutChildren };
}

export function flattenTree(root: LayoutNode): LayoutNode[] {
  return [root, ...root.children.flatMap(flattenTree)];
}

export function flattenEdges(root: LayoutNode): Edge[] {
  return root.children.flatMap((child) => [
    { px: root.x, py: root.y + NODE_H, cx: child.x, cy: child.y },
    ...flattenEdges(child),
  ]);
}
