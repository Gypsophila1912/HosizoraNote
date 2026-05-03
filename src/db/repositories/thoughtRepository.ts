import { db } from "@/db/index";
import { thoughtsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export type Thought = typeof thoughtsTable.$inferSelect;

export const createThought = async (title: string): Promise<number> => {
  const now = Date.now();
  const result = await db
    .insert(thoughtsTable)
    .values({ title, createdAt: now, updatedAt: now })
    .returning({ id: thoughtsTable.id });
  return result[0].id;
};

export const updateThoughtTitle = async (
  id: number,
  title: string,
): Promise<void> => {
  await db
    .update(thoughtsTable)
    .set({ title, updatedAt: Date.now() })
    .where(eq(thoughtsTable.id, id));
};

export const deleteThought = async (id: number): Promise<void> => {
  await db.delete(thoughtsTable).where(eq(thoughtsTable.id, id));
};

export const getAllThoughts = async (): Promise<Thought[]> => {
  return await db.select().from(thoughtsTable);
};
