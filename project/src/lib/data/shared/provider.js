try {
  await import("server-only");
} catch {
  // Unit tests run in plain Node where this package may not be installed.
}
import { getFirebaseAdminDb } from "../../firebase/admin.js";
import { getMemoryDb } from "./memory-db.js";

export function getDataProvider() {
  try {
    const db = getFirebaseAdminDb();
    return { type: "firestore", db };
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    return { type: "memory", db: getMemoryDb() };
  }
}
