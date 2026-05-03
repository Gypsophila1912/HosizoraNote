import { db } from "@/db/index";
import { nodesTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export type Node = typeof nodesTable.$inferSelect;

export const addNode = async (
  thoughtId: number,
  text: string,
  parentId?: number,
): Promise<Node> => {
  const result = await db
    .insert(nodesTable)
    .values({
      thoughtId,
      text,
      parentId: parentId ?? null,
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

/** 指定ノードの直接の子ノードを取得（DetailScreen用） */
export const getChildNodes = async (parentId: number): Promise<Node[]> => {
  return await db
    .select()
    .from(nodesTable)
    .where(eq(nodesTable.parentId, parentId));
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
