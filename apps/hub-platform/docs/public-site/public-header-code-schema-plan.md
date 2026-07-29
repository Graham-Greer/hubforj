# Public Header Code And Schema Plan

Status:
- Proposed
- Detailed implementation-planning document

Purpose:
- Translate the public header/navigation architecture into implementation-ready domain and adapter layers
- Define the normalized model that public layout code should consume
- Keep navigation, utility behavior, viewer state, and mobile behavior out of route-by-route custom logic

Related:
- [Public Header And Navigation Plan](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/public-header-and-navigation-plan.md)
- [Site Settings Ownership Cleanup Plan](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/site-settings-ownership-cleanup-plan.md)

---

## 1) Implementation goal

Before building the new public header components, the codebase needs one normalized header model that public routes can trust.

That layer must:
- centralize public viewer-state resolution
- centralize primary-nav resolution
- centralize role-aware utility resolution
- centralize mobile-header behavior decisions
- keep site-settings usage limited to brand inputs

Routes should consume a ready-to-render model, not assemble the header piecemeal.

---

## 2) Required code layers

### 2.1 Viewer-state resolver

Purpose:
- determine whether the current public-route viewer is:
  - anonymous
  - member
  - admin

This resolver should be based on:
- hub context
- current session
- role validity for that hub

It should not:
- guess from route prefixes alone
- live inside UI components

### 2.2 Primary-nav resolver

Purpose:
- build the canonical public primary navigation item list

This resolver should derive from:
- route authority
- capability/package rules
- page enablement rules

It must remain system-driven.

It must not read:
- tenant-authored link arrays
- arbitrary site-settings navigation groups

### 2.3 Utility-model resolver

Purpose:
- build the auth-aware utility model for the current viewer state

This resolver should determine:
- avatar presence
- sign-in/join visibility
- account/admin utility items
- sign-out behavior

This logic must stay system-driven.

### 2.4 Header-model resolver

Purpose:
- compose brand, nav, utility, and mobile behavior into one normalized public-header model

This is the object public layout should pass to the header components.

---

## 3) Suggested module boundaries

Likely files:
- `src/lib/domain/public-header.js`
- `src/lib/domain/public-viewer-state.js`
- `src/lib/domain/public-utility-menu.js`
- `src/lib/data/public-header.js`

Potential exports:
- `resolvePublicViewerState(...)`
- `resolvePublicPrimaryNav(...)`
- `resolvePublicUtilityMenu(...)`
- `resolvePublicHeaderModel(...)`

The exact file names can evolve, but responsibilities should stay distinct.

---

## 4) Normalized header model

The public header should consume a stable normalized object such as:

```js
{
  brand: {
    siteName: "",
    logoAsset: null,
    logoAlt: "",
    homeHref: "",
  },
  navigation: {
    items: [
      {
        key: "events",
        label: "Events",
        href: "/{hubSlug}/events",
        active: false,
      },
    ],
  },
  utility: {
    viewerState: "anonymous",
    avatar: null,
    quickAction: null,
    menuItems: [],
  },
  mobile: {
    panelPlacement: "below-header-right",
    keepHeaderVisible: true,
    burgerMorphsToClose: true,
  },
  template: {
    key: "",
  },
}
```

---

## 5) Brand model rules

Brand data may come from:
- canonical site settings

Brand data should include:
- `siteName`
- `logoAsset`
- `logoAlt`

The brand model should not depend on:
- page settings
- branding form duplication

This is why the settings ownership cleanup must happen first or at least be locked first.

---

## 6) Viewer-state model

### 6.1 Supported values

Viewer state should be one of:
- `anonymous`
- `member`
- `admin`

### 6.2 State resolution rules

- no valid session => `anonymous`
- valid member session for hub => `member`
- valid admin session for hub => `admin`

If multi-role support expands later, the resolver may become richer internally, but the public header still needs one clear active viewer state at render time.

### 6.3 Why this matters

This keeps:
- avatar logic
- utility menus
- sign-in/join/account/admin visibility

all driven from one canonical decision.

---

## 7) Primary-nav model

### 7.1 Inputs

Primary nav should be derived from:
- hub
- route authority
- capability flags
- approved page enablement

### 7.2 Outputs

Each item should contain:
- stable key
- label
- href
- active state

### 7.3 Non-goals

This model should not:
- read arbitrary admin-managed link arrays
- infer nav from whatever pages happen to exist in storage
- mix utility/account actions into primary nav

---

## 8) Utility model

### 8.1 Anonymous

Utility output should include:
- quick action: `Sign in`
- join entry where relevant
- no avatar

### 8.2 Member

Utility output should include:
- avatar model
- account-oriented menu items:
  - `Account`
  - `Membership`
  - `Registrations`
  - `Sign out`

Important:
- `Registrations` is the consolidated participation entry
- it should represent both event and course participation
- the utility model should not add a separate top-level `Courses` shortcut

### 8.3 Admin

Utility output should include:
- avatar model
- admin-oriented menu items:
  - `Admin`
  - `Sign out`

Optional member-account visibility for admins should remain a separate deliberate decision, not a default assumption.

### 8.4 Utility primitive reuse

The implementation should reuse the existing [CompactMenu.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/ui/compact-menu/CompactMenu.jsx) primitive for menu behavior where feasible.

That gives us:
- consistency
- an existing menu interaction base
- less duplicated interaction logic

If `CompactMenu` needs extension for header-grade behavior, extend it deliberately rather than inventing a second unrelated utility-menu primitive.

---

## 9) Mobile-header model

The normalized model should explicitly support the agreed behavior:
- logo left
- avatar trigger or sign-in link on the right
- burger trigger to the right of that
- right-side panel opens beneath the header
- header remains visible
- burger morphs into a close affordance

This should not be left as implicit CSS-only behavior.

The header model should therefore include stable mobile-behavior assumptions such as:
- panel placement
- persistent header behavior
- trigger ordering

---

## 10) Layout integration

The public hub layout should ideally do something closer to:

```js
const headerModel = await getPublicHeaderModel(hub, siteSettings, session, pathname);
```

and then pass that model into:
- `PublicHeader`

instead of assembling:
- nav items
- utility state
- logo behavior

directly in the layout file.

---

## 11) Site-settings implications

This header code/schema plan depends on the settings ownership cleanup.

Because:
- brand inputs should come from canonical site settings
- not from overlapping branding/site ownership

However:
- navigation and utility logic remain system-driven
- there should be no regression into site-settings-owned nav behavior

---

## 12) Acceptance criteria

This code/schema layer should be considered ready when:
- public layout can request one normalized header model
- viewer state resolves centrally
- primary nav resolves centrally
- utility menu contents resolve centrally
- mobile header behavior is explicit in the model
- site settings only supply brand inputs, not nav/utility authority

