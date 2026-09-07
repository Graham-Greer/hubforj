import assert from "node:assert/strict";

export function fixture({ ready = true, allowQuery = false } = {}) {
  const records = new Map();
  if (ready) records.set("platformMigrations/hubAddressClaimsV1", { version: 1, status: "ready" });
  let queue = Promise.resolve();
  let sequence = 0;
  const transactionReads = [];
  const snapshot = (path, value) => ({ id: path.split("/").at(-1), ref: reference(path), exists: value !== undefined, data: () => value });
  const read = async (ref) => {
    if (ref.path) return snapshot(ref.path, records.get(ref.path));
    let entries = [...records].filter(([path]) => path.startsWith(`${ref.name}/`) && path.split("/").length === ref.name.split("/").length + 1).sort(([a], [b]) => a.localeCompare(b));
    if (ref.filter) entries = entries.filter(([, value]) => {
      const actual = ref.filter.field.split(".").reduce((item, key) => item?.[key], value);
      return ref.filter.operator === "array-contains" ? actual?.includes(ref.filter.value) : actual === ref.filter.value;
    });
    if (ref.cursor) entries = entries.filter(([path]) => path > ref.cursor.ref.path);
    if (ref.size) entries = entries.slice(0, ref.size);
    const docs = entries.map(([path, value]) => snapshot(path, value));
    return { empty: docs.length === 0, docs };
  };
  function reference(path) { return { path, id: path.split("/").at(-1), get: () => read({ path }), collection: (name) => query(`${path}/${name}`) }; }
  const query = (name, size, cursor, filter) => ({ name, size, cursor, filter,
    doc: (id = `auto${sequence++}`) => reference(`${name}/${id}`),
    orderBy: () => query(name, size, cursor, filter),
    where: (field, operator, value) => query(name, size, cursor, { field, operator, value }),
    limit: (value) => query(name, value, cursor, filter),
    startAfter: (value) => query(name, size, value, filter),
    get() { return read(this); },
  });
  const db = {
    collection: (name) => query(name), failCommit: false, commitCount: 0, failCommitAt: 0, transactionReads,
    runTransaction: (callback) => {
      const result = queue.then(async () => {
        const pending = new Map();
        const result = await callback({
          get: (ref) => {
            assert.ok(ref.path || allowQuery, "Creation/backfill transactions must use direct document reads only");
            assert.equal(pending.size, 0, "All reads must precede writes");
            transactionReads.push(ref.path);
            return read(ref);
          },
          create: (ref, value) => {
            assert.equal(records.has(ref.path) || pending.has(ref.path), false);
            pending.set(ref.path, value);
          },
          set: (ref, value) => pending.set(ref.path, value),
          update: (ref, value) => {
            assert.ok(records.has(ref.path));
            pending.set(ref.path, { ...records.get(ref.path), ...value });
          },
        });
        db.commitCount += 1;
        if (db.failCommit || db.commitCount === db.failCommitAt) throw new Error("commit failed");
        for (const entry of pending) records.set(...entry);
        return result;
      });
      queue = result.catch(() => {});
      return result;
    },
  };
  return { db, records };
}
