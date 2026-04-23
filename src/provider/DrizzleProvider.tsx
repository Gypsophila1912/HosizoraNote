import { drizzle } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { openDatabaseSync } from "expo-sqlite";
import type { ReactNode } from "react";
import migrations from "../../drizzle/migrations";

const expoDb = openDatabaseSync("db.db");
export const db = drizzle(expoDb);

interface Props {
  children: ReactNode;
}

export function DrizzleProvider({ children }: Props) {
  useDrizzleStudio(expoDb);

  const { success, error } = useMigrations(db, migrations);

  if (error) {
    console.error("Migration Error:", error);
    throw error;
  }

  if (!success) {
    return null;
  }

  return <>{children}</>;
}
