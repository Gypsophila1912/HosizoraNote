import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const messagesTable = sqliteTable("messages_table", {
  id: int().primaryKey({ autoIncrement: true }),
  content: text().notNull(),
  createdAt: int().notNull(),
});
