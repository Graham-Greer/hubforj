# Firebase Setup (One Project, Hub-Scoped Tenancy)

Goal:
- Provide a deterministic, production-grade Firebase setup.
- Prevent scattered Firebase imports, secrets leakage, or inconsistent environments.

Scope:
- One Firebase project for the platform (locked).
- Firestore for data, Storage for media blobs, Authentication for identity.
- Next.js App Router project under `src/` using `.jsx`.

---

## 1) Project-level decisions (LOCKED)
- MUST use **one Firebase project** for all hubs (tenants).
- MUST enforce tenant isolation by **hub scoping** in schema and rules.
- MUST keep Admin portals on platform domain only (domain policy is enforced at app layer; access enforced by auth rules).

---

## 2) Environment variables (HARD)

### 2.1 Client env (public)
Client components MAY use only `NEXT_PUBLIC_*` vars.

MUST define:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### 2.2 Server env (private)
Server modules MUST use non-public vars and MUST NOT expose them to client bundles.

MUST define (Admin SDK):
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY` (newline-safe; replace `\n` at runtime)

Forbidden:
- MUST NOT reference any non-public env vars in Client Components.
- MUST NOT check in service account JSON files.

---

## 3) Code boundaries (HARD)

### 3.1 Firebase client SDK
- MUST live in: `src/lib/firebase/client.js`
- MUST export initialized client app + Firestore + Storage + Auth (as needed).
- Client components MAY import from `src/lib/firebase/client.js` only.

### 3.2 Firebase Admin SDK (server-only)
- MUST live in: `src/lib/firebase/admin.js`
- MUST initialize Admin SDK once (singleton).
- MUST export Admin Firestore and Admin Auth helpers.
- Client components MUST NOT import from `src/lib/firebase/admin.js`.

### 3.3 Repositories/services
- Server data access MUST live in `src/lib/data/**`.
- Route handlers/server actions MUST delegate to repositories/services.

---

## 4) Development workflow (recommended)
- SHOULD use Firebase Emulator Suite locally for:
  - Firestore rules testing
  - Storage rules testing
  - Auth testing
- SHOULD add a small rules-test harness (see `docs/firebase/emulators-and-testing.md`).

---

## 5) Deployment workflow (HARD)
- MUST deploy Firestore rules and Storage rules as part of the release process.
- MUST deploy Firestore indexes for any new query surfaces.
- MUST NOT ship a milestone that introduces new collections/queries without updating rules/indexes.

See:
- `docs/firebase/deployment.md`
