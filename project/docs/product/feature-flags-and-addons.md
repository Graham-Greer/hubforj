# Feature Flags and Add-ons (Hub-Scoped, Canonical)

## Locked rules (HARD)
- Feature flags are stored per hub.
- Hub admins can view feature list.
- Disabled feature routes MUST render FeatureLocked (not 404).
- Enforcement MUST be server-side; UI is informational.

## Model
Hub includes:
- `features: { [featureKey]: boolean }`

MVP keys:
- `cmsPages`
- `stripePayments`
- `emailNotifications` (future; not implemented)

## Behavior
- If enabled: feature UI renders.
- If disabled: route renders FeatureLocked with benefits + CTA.

## Add-on policy (direction)
- cmsPages for hub admins is an add-on; MVP is superadmin-only editing.
- Stripe is an add-on; MVP supports offline tracking.
