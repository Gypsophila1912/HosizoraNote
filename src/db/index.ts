import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import { Platform } from "react-native";

let expoDb: any;
let db: any;

if (Platform.OS === "web") {
  expoDb = {};
  
  const mockHandler: ProxyHandler<any> = {
    get(target, prop) {
      if (prop === "then") {
        return (resolve: any) => resolve([
          {
            id: 1,
            title: "Web Preview Thought",
            text: "This is a mock node for Web Preview",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            thoughtId: 1,
            parentId: null
          },
          {
            id: 2,
            title: "Mock Child",
            text: "Child node",
            createdAt: Date.now() + 1000,
            updatedAt: Date.now() + 1000,
            thoughtId: 1,
            parentId: 1
          }
        ]);
      }
      return new Proxy(() => {}, mockHandler);
    },
    apply(target, thisArg, argumentsList) {
      return new Proxy(() => {}, mockHandler);
    }
  };
  
  db = new Proxy({}, mockHandler);
} else {
  expoDb = openDatabaseSync("db.db");
  db = drizzle(expoDb);
}

export { expoDb, db };
