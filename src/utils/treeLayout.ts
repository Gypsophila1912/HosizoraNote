import { Node } from "@/db/repositories/nodeRepository";
import { LayoutNode } from "@/components/NodeCard";

export const NODE_W = 140;
export const NODE_H = 72;
export const H_GAP = 24;
export const V_GAP = 60;
export const PADDING = 48;

export type Edge = { px: number; py: number; cx: number; cy: number; isMain?: boolean };

export class OccupiedMap {
  private rows: Record<number, { min: number; max: number }[]> = {};

  add(y: number, x: number) {
    if (!this.rows[y]) this.rows[y] = [];
    this.rows[y].push({
      min: x - NODE_W / 2 - H_GAP / 2,
      max: x + NODE_W / 2 + H_GAP / 2,
    });
  }

  hasCollision(y: number, x: number, isRoot: boolean = false, reservedX?: number): boolean {
    if (!isRoot && reservedX !== undefined) {
      if (Math.abs(x - reservedX) < 1) {
        return true;
      }
    }

    const intervals = this.rows[y] || [];
    const min = x - NODE_W / 2 - H_GAP / 2;
    const max = x + NODE_W / 2 + H_GAP / 2;
    for (const inv of intervals) {
      if (Math.max(min, inv.min) + 0.1 < Math.min(max, inv.max)) {
        return true;
      }
    }
    return false;
  }
}

function getCandidates(px: number, i: number, step: number): number[] {
  if (i === 0) {
    const res = [px];
    for (let k = 1; k < 100; k++) {
      res.push(px + k * step);
      res.push(px - k * step);
    }
    return res;
  }
  const res = [];
  const k = Math.ceil(i / 2);
  const isRight = i % 2 === 1;
  for (let j = k; j < 100; j++) {
    res.push(px + (isRight ? j * step : -j * step));
    res.push(px + (isRight ? -j * step : j * step));
  }
  return res;
}

export function assignPositions(
  node: Node,
  centerX: number,
  topY: number,
  childMap: Record<number, Node[]>,
  occupiedMap: OccupiedMap = new OccupiedMap(),
  isRoot: boolean = false,
  reservedX?: number
): LayoutNode {
  const step = NODE_W + H_GAP;

  let rx = centerX;
  const rootCands = getCandidates(centerX, 0, step);
  for (const cx of rootCands) {
    if (!occupiedMap.hasCollision(topY, cx, isRoot, reservedX)) {
      rx = cx;
      break;
    }
  }
  occupiedMap.add(topY, rx);

  const rootLayout: LayoutNode = { node, x: rx, y: topY, children: [] };
  const queue = [rootLayout];

  while (queue.length > 0) {
    const currentLayout = queue.shift()!;
    const children = (childMap[currentLayout.node.id] ?? [])
      .slice()
      .sort((a, b) => a.createdAt - b.createdAt);

    const childY = currentLayout.y + NODE_H + V_GAP;

    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      const cands = getCandidates(currentLayout.x, i, step);
      let placedX = currentLayout.x;
      for (const cx of cands) {
        if (!occupiedMap.hasCollision(childY, cx, false, reservedX)) {
          placedX = cx;
          break;
        }
      }
      occupiedMap.add(childY, placedX);
      const childLayout: LayoutNode = { node: c, x: placedX, y: childY, children: [] };
      currentLayout.children.push(childLayout);
      queue.push(childLayout);
    }
  }

  return rootLayout;
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
