import { Node } from "@/db/repositories/nodeRepository";

/** ノードをツリー形式のテキストに変換してGeminiに渡す */
export function formatNodesToText(nodes: Node[]): string {
  if (nodes.length === 0) return "";

  // childMapを構築
  const childMap: Record<number, Node[]> = {};
  for (const n of nodes) {
    if (n.parentId != null) {
      (childMap[n.parentId] ??= []).push(n);
    }
  }

  // 子を createdAt 順にソート
  for (const key of Object.keys(childMap)) {
    childMap[Number(key)].sort((a, b) => a.createdAt - b.createdAt);
  }

  const rootNodes = nodes
    .filter((n) => n.parentId == null)
    .sort((a, b) => a.createdAt - b.createdAt);

  const lines: string[] = [];

  function walk(node: Node, depth: number) {
    const indent = "  ".repeat(depth);
    const prefix = depth === 0 ? "・" : "- ";
    lines.push(`${indent}${prefix}${node.text}`);
    for (const child of childMap[node.id] ?? []) {
      walk(child, depth + 1);
    }
  }

  for (const root of rootNodes) {
    walk(root, 0);
  }

  return lines.join("\n");
}
