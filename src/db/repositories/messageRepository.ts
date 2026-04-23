import { db } from "@/db/index";
import { messagesTable } from "@/db/schema";
import { desc } from "drizzle-orm";

export type Message = typeof messagesTable.$inferSelect; //作成したDBからSELECTしたときに使用する型を定義している。

// メッセージ全件取得（新しい順）
export const getMessages = async (): Promise<Message[]> => {
  return await db
    .select()
    .from(messagesTable)
    .orderBy(desc(messagesTable.createdAt));
};

// メッセージ追加
export const addMessage = async (content: string): Promise<void> => {
  await db.insert(messagesTable).values({
    content,
    createdAt: Date.now(),
  });
};
