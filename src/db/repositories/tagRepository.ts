import { db } from "@/db/index";
import { tagsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export type Tag = typeof tagsTable.$inferSelect;

/** 全タグを取得 */
export const getAllTags = async (): Promise<Tag[]> => {
  return await db.select().from(tagsTable);
};

/** タグをIDで取得 */
export const getTagById = async (id: number): Promise<Tag | null> => {
  const result = await db
    .select()
    .from(tagsTable)
    .where(eq(tagsTable.id, id));
  return result[0] ?? null;
};

/** タグを作成 */
export const createTag = async (
  name: string,
  color: string,
): Promise<Tag> => {
  const result = await db
    .insert(tagsTable)
    .values({ name, color })
    .returning();
  return result[0];
};

/** タグ名を更新 */
export const updateTagName = async (
  id: number,
  name: string,
): Promise<void> => {
  await db.update(tagsTable).set({ name }).where(eq(tagsTable.id, id));
};

/** タグの色を更新 */
export const updateTagColor = async (
  id: number,
  color: string,
): Promise<void> => {
  await db.update(tagsTable).set({ color }).where(eq(tagsTable.id, id));
};

/** タグを更新（名前と色の両方） */
export const updateTag = async (
  id: number,
  name: string,
  color: string,
): Promise<void> => {
  await db.update(tagsTable).set({ name, color }).where(eq(tagsTable.id, id));
};

/** タグを削除 */
export const deleteTag = async (id: number): Promise<void> => {
  await db.delete(tagsTable).where(eq(tagsTable.id, id));
};
