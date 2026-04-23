import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// tagsテーブル
export const tagsTable = sqliteTable("tags", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  color: text().notNull(),
});

// thoughtsテーブル
export const thoughtsTable = sqliteTable("thoughts", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text(),
  createdAt: int().notNull(),
  updatedAt: int().notNull(),
});

// nodesテーブル（自己参照は references() を使わず int() だけにする）
export const nodesTable = sqliteTable("nodes", {
  id: int().primaryKey({ autoIncrement: true }),
  thoughtId: int()
    .notNull()
    .references(() => thoughtsTable.id),
  parentId: int(), // 自己参照は references() を外す
  text: text().notNull(),
  tagId: int().references(() => tagsTable.id),
  createdAt: int().notNull(),
});

// relationsで関係を定義
export const nodesRelations = relations(nodesTable, ({ one, many }) => ({
  thought: one(thoughtsTable, {
    fields: [nodesTable.thoughtId],
    references: [thoughtsTable.id],
  }),
  tag: one(tagsTable, {
    fields: [nodesTable.tagId],
    references: [tagsTable.id],
  }),
  parent: one(nodesTable, {
    fields: [nodesTable.parentId],
    references: [nodesTable.id],
    relationName: "parentChild",
  }),
  children: many(nodesTable, {
    relationName: "parentChild",
  }),
}));
