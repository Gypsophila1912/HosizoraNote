import { db } from "@/db/index";
import { thoughtsTable } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

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

/** 指定日（ローカル時刻）に作成されたthoughtsを返す */
export const getThoughtsByDate = async (date: Date): Promise<Thought[]> => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return await db
    .select()
    .from(thoughtsTable)
    .where(
      and(
        gte(thoughtsTable.createdAt, start.getTime()),
        lte(thoughtsTable.createdAt, end.getTime()),
      ),
    );
};

/** カレンダーへのマーク用に全thoughtのcreatedAt（ms）を返す */
export const getAllThoughtDates = async (): Promise<number[]> => {
  const rows = await db
    .select({ createdAt: thoughtsTable.createdAt })
    .from(thoughtsTable);
  return rows.map((r) => r.createdAt);
};
