import { db } from "@/db/index";
import { nodesTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export type Node = typeof nodesTable.$inferSelect;

export const addNode = async (
  thoughtId: number,
  text: string,
  parentId?: number,
): Promise<void> => {
  await db.insert(nodesTable).values({
    thoughtId,
    text,
    parentId: parentId ?? null,
    createdAt: Date.now(),
  });
};

export const getNodesByThoughtId = async (
  thoughtId: number,
): Promise<Node[]> => {
  return await db
    .select()
    .from(nodesTable)
    .where(eq(nodesTable.thoughtId, thoughtId));
};

export const deleteNodesByThoughtId = async (
  thoughtId: number,
): Promise<void> => {
  await db.delete(nodesTable).where(eq(nodesTable.thoughtId, thoughtId));
};
