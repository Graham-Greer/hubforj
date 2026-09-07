// Uses Application Default Credentials or the Firestore emulator; never loads .env files.
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { auditHubAddressClaims, backfillHubAddressClaims } from "../src/lib/data/hub-address-backfill.js";

const args = process.argv.slice(2);
const projectIndex = args.indexOf("--project");
const projectId = projectIndex >= 0 ? args[projectIndex + 1] : "";
const allowed = new Set(["--project", "--apply", "--verify", "--writers-stopped", projectId]);
if (!projectId || projectId.startsWith("--") || args.some((arg) => !allowed.has(arg))) {
  throw new Error("Usage: --project <firebase-project-id> [--verify | --apply --writers-stopped]");
}
if (args.includes("--apply") && args.includes("--verify")) throw new Error("Choose apply or verify, not both.");
if (args.includes("--apply") && !args.includes("--writers-stopped")) {
  throw new Error("Apply requires --writers-stopped after pausing every hub address writer.");
}
const app = initializeApp({ projectId, ...(process.env.FIRESTORE_EMULATOR_HOST ? {} : { credential: applicationDefault() }) });
const db = getFirestore(app);
try {
  const result = args.includes("--apply")
    ? await backfillHubAddressClaims(db, { writersStopped: true })
    : await auditHubAddressClaims(db, { requireCoverage: args.includes("--verify") });
  process.stdout.write(`${JSON.stringify({ projectId, mode: args.includes("--apply") ? "apply" : args.includes("--verify") ? "verify" : "audit", ...result }, null, 2)}\n`);
  if (result.issues.length) process.exitCode = 1;
} catch (error) {
  console.error(JSON.stringify({ projectId, error: error.message, issues: error.issues || [] }, null, 2));
  process.exitCode = 1;
} finally {
  await db.terminate();
}
