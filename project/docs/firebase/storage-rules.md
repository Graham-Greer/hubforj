# Storage Rules (Canonical Policy + Skeleton)

Goal:
- Restrict writes to Storage while allowing public-read blob access (MVP posture).
- Enforce hub scoping on writes and separate avatar uploads from hub assets.

Authority:
- `docs/product/media-library.md`
- `docs/firebase/firestore-schema.md`
- `docs/firebase/firestore-rules.md`
- `docs/standards/ops-quality-and-security.md`

---

## 1) Access model (LOCKED)
- Hub media blobs MUST be publicly readable by URL.
- Writes MUST be restricted:
  - hub assets: hub admin + superadmin only
  - avatars: member can write only their own avatar media

---

## 2) Paths (HARD)
Hub assets:
- `hubs/{hubId}/media/{mediaId}/{filename}`

Member avatars:
- `hubs/{hubId}/users/{userId}/avatar/{mediaId}/{filename}`

Generated theme CSS:
- `hubs/{hubId}/theme/theme-overrides.css`

---

## 3) Rules skeleton (example)
```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isSignedIn() { return request.auth != null; }

    // NOTE: Storage rules cannot read Firestore directly.
    // MVP approach: restrict writes by custom claims OR require uploads be done via server.
    // Production-safe recommendation: perform uploads via server route handler that returns signed upload URLs OR uses Admin SDK.
    // If direct client uploads are used, custom claims are required.

    match /hubs/{hubId}/media/{mediaId}/{fileName} {
      allow read: if true;
      allow write: if false; // prefer server-mediated upload in MVP for correctness
    }

    match /hubs/{hubId}/theme/{fileName} {
      allow read: if true;
      allow write: if false; // server-generated only
    }

    match /hubs/{hubId}/users/{userId}/avatar/{mediaId}/{fileName} {
      allow read: if true;
      allow write: if isSignedIn() && request.auth.uid == userId;
    }
  }
}
```

---

## 4) Upload strategy (HARD recommendation)
Because Storage rules cannot reliably enforce hub admin role without claims:
- MVP recommendation: hub asset uploads SHOULD be server-mediated:
  - client uploads to server endpoint, server writes to Storage with Admin privileges, then writes metadata to Firestore.
- Avatar uploads MAY be direct client uploads (user-scoped path), as rules can check uid.

If choosing direct hub asset uploads:
- MUST implement custom claims for role/hub binding.
- MUST document and test rules thoroughly.

---

## 5) Rate limiting (HARD)
Upload endpoints MUST be rate limited.
