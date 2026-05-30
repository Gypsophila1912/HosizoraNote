import { db } from "@/db/index";
import { nodesTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export type Node = typeof nodesTable.$inferSelect;

export const addNode = async (
  thoughtId: number,
  text: string,
  parentId?: number,
  tagId?: number | null,
): Promise<Node> => {
  const result = await db
    .insert(nodesTable)
    .values({
      thoughtId,
      text,
      parentId: parentId ?? null,
      tagId: tagId ?? null,
      createdAt: Date.now(),
    })
    .returning();
  return result[0];
};

/** thought全体のノードを取得（HomeScreen用） */
export const getNodesByThoughtId = async (
  thoughtId: number,
): Promise<Node[]> => {
  return await db
    .select()
    .from(nodesTable)
    .where(eq(nodesTable.thoughtId, thoughtId));
};

/** 指定ノードから始まる直列の返信チェーン（常に最初の子を辿る）を取得（DetailScreen用） */
export const getThreadChain = async (startNodeId: number, includeStartNode = false): Promise<Node[]> => {
  const chain: Node[] = [];
  
  if (includeStartNode) {
    const startNode = await getNodeById(startNodeId);
    if (startNode) chain.push(startNode);
  }

  let currentParentId = startNodeId;
  while (true) {
    const children = await db
      .select()
      .from(nodesTable)
      .where(eq(nodesTable.parentId, currentParentId));
    
    if (children.length === 0) break;
    // createdAt昇順でソートして最初の子を採用
    children.sort((a, b) => a.createdAt - b.createdAt);
    const firstChild = children[0];
    chain.push(firstChild);
    currentParentId = firstChild.id;
  }
  return chain;
};

/** 指定ノード自体を取得（親ノード表示用） */
export const getNodeById = async (id: number): Promise<Node | null> => {
  const result = await db
    .select()
    .from(nodesTable)
    .where(eq(nodesTable.id, id));
  return result[0] ?? null;
};

export const deleteNodesByThoughtId = async (
  thoughtId: number,
): Promise<void> => {
  await db.delete(nodesTable).where(eq(nodesTable.thoughtId, thoughtId));
};

/** ノードのテキストを更新 */
export const updateNodeText = async (
  id: number,
  text: string,
): Promise<void> => {
  await db.update(nodesTable).set({ text }).where(eq(nodesTable.id, id));
};

/** ノードを削除 */
export const deleteNode = async (id: number): Promise<void> => {
  await db.delete(nodesTable).where(eq(nodesTable.id, id));
};

/** 並び替え後のノードリストに対し、createdAt を連番に更新して並び順を永続化する */
export const updateNodeOrders = async (
  nodes: { id: number; createdAt: number }[],
): Promise<void> => {
  await Promise.all(
    nodes.map(({ id, createdAt }) =>
      db.update(nodesTable).set({ createdAt }).where(eq(nodesTable.id, id)),
    ),
  );
};

/** 特定の親を持つ子ノードたちの親IDを新しい親IDに一括更新する */
export const reparentNodeChildren = async (
  oldParentId: number,
  newParentId: number | null,
): Promise<void> => {
  await db
    .update(nodesTable)
    .set({ parentId: newParentId })
    .where(eq(nodesTable.parentId, oldParentId));
};
