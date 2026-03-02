# Firestore Security Rules (Canonical Policy + Skeleton)

Goal:
- Enforce tenant isolation and role-based access for all Firestore data.
- Prevent Codex from shipping with permissive rules or missing gates.

Authority:
- `docs/product/roles-and-permissions.md`
- `docs/product/routes-and-gating.md`
- `docs/product/state-machines.md`
- `docs/product/media-library.md`
- `docs/firebase/firestore-schema.md`

Hard rules:
- Rules MUST enforce hub scoping by construction.
- Rules MUST NOT rely on client UI for security.
- If a new collection is introduced, rules MUST be updated in the same change.

---

## 1) Role helpers (policy)
Rules should define helper predicates equivalent to:

- isSignedIn()
- isSuperadmin()
- isHubAdmin(hubId)
- isMemberOfHub(hubId)
- userHubId() (from `/users/{uid}`)

MVP recommendation:
- Use Firestore get() to read `/users/{uid}` for hubId + role.
- Minimize cross-doc reads in hot paths, but correctness is priority for MVP.

---

## 2) Collection policies (MVP)

### 2.1 `/users/{uid}`
- Users MAY read their own user doc.
- Hub admins MAY read user docs for users within their hub (optional; or restrict to server-only).
- Superadmin MAY read all users.
- Users MAY update limited profile fields only (name, avatarMediaId).
- Role and hubId fields MUST be server-controlled (no client updates).

### 2.2 `/hubs/{hubId}`
- Public reads SHOULD be limited to public config fields (name, slug, templateKey) if needed client-side.
- Writes MUST be superadmin-only.

### 2.3 Invites
- Create/revoke invites: superadmin-only.
- Read invites: superadmin + hub admin for their hub.
- Accept invite: authenticated user matching invite email (server-mediated recommended).

### 2.4 Events + Registrations
- Public read of published events MAY be allowed.
- Draft events MUST be admin-only.
- Registrations:
  - member can create/cancel their own registration (within policy)
  - admin can manage all registrations for their hub
  - attendance marking admin-only
  - payment status marking admin-only

### 2.5 Membership plans + memberships
- MembershipPlans: readable by public site (for join flow); writable by admin.
- Memberships: readable by the member (self) and admin (hub); writable by admin (except member cancel).

### 2.6 Pages (CMS)
- Published pages MAY be public-read.
- Draft compositions MUST be superadmin-only (until cmsPages enabled for hub admins later).

### 2.7 Media metadata
Important: blobs are public-read by URL; metadata listing is admin-only.
- Media folder + media metadata read/list: admin + superadmin only.
- Media deletion:
  - if `usageCount > 0`, MUST deny delete.
  - else allow delete by admin/superadmin.

Avatar media subcollection:
- Member can read/write only their own avatar media.
- Admin read optional; member must not list hub media.

---

## 3) Rules skeleton (example)
This is a starting skeleton and MUST be adapted to the exact schema.

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }

    function userDoc() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function userRole() { return isSignedIn() ? userDoc().role : null; }
    function userHubId() { return isSignedIn() ? userDoc().hubId : null; }

    function isSuperadmin() { return isSignedIn() && userRole() == 'superadmin'; }
    function isHubAdmin(hubId) { return isSignedIn() && userRole() == 'admin' && userHubId() == hubId; }
    function isHubMember(hubId) { return isSignedIn() && userHubId() == hubId && (userRole() == 'member' || userRole() == 'admin'); }

    match /users/{uid} {
      allow read: if isSignedIn() && (uid == request.auth.uid || isSuperadmin());
      allow update: if isSignedIn() && uid == request.auth.uid
        && request.resource.data.diff(resource.data).changedKeys().hasOnly(['name','avatarMediaId','updatedAt']);
      allow create: if false; // server only
      allow delete: if false;
    }

    match /hubs/{hubId} {
      allow read: if true; // or restrict if desired
      allow write: if isSuperadmin();

      match /events/{eventId} {
        allow read: if resource.data.status == 'published' || isHubMember(hubId) || isSuperadmin();
        allow write: if isHubAdmin(hubId) || isSuperadmin();

        match /registrations/{registrationId} {
          allow read: if isHubAdmin(hubId) || isSuperadmin()
            || (isSignedIn() && resource.data.userId == request.auth.uid && isHubMember(hubId));
          allow create: if isSignedIn() && isHubMember(hubId)
            && request.resource.data.userId == request.auth.uid;
          allow update: if isHubAdmin(hubId) || isSuperadmin()
            || (isSignedIn() && resource.data.userId == request.auth.uid); // constrain fields in real rules
          allow delete: if false;
        }
      }

      match /membershipPlans/{planId} {
        allow read: if true;
        allow write: if isHubAdmin(hubId) || isSuperadmin();
      }

      match /memberships/{membershipId} {
        allow read: if isHubAdmin(hubId) || isSuperadmin()
          || (isSignedIn() && resource.data.userId == request.auth.uid && isHubMember(hubId));
        allow write: if isHubAdmin(hubId) || isSuperadmin(); // member cancel handled via server route or constrained update
      }

      match /pages/{pageId} {
        allow read: if resource.data.publishedComposition.size() > 0 || isHubAdmin(hubId) || isSuperadmin();
        allow write: if isSuperadmin(); // until cmsPages enabled for hub admins
      }

      match /mediaFolders/{folderId} {
        allow read, write: if isHubAdmin(hubId) || isSuperadmin();
      }

      match /media/{mediaId} {
        allow read: if isHubAdmin(hubId) || isSuperadmin();
        allow create, update: if isHubAdmin(hubId) || isSuperadmin();
        allow delete: if (isHubAdmin(hubId) || isSuperadmin()) && resource.data.usageCount == 0;
      }

      match /users/{uid}/avatarMedia/{mediaId} {
        allow read: if isSignedIn() && (uid == request.auth.uid || isHubAdmin(hubId) || isSuperadmin());
        allow write: if isSignedIn() && uid == request.auth.uid;
      }
    }
  }
}
```

Notes:
- This skeleton MUST be tightened to field-level updates (changedKeys) for critical collections.
- Membership cancellation and role changes SHOULD be mediated server-side.

---

## 4) Update cadence (HARD)
- End of M1: rules must cover hubs, users, invites, feature flags config.
- End of M2: rules must cover events, registrations, memberships, plans.
- End of M3: rules must cover pages + media library + usageCount delete gating.
- End of M4: rules must cover member portal reads/writes.
