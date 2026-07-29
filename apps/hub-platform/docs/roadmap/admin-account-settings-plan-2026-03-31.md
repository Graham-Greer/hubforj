# Admin Account Settings Plan

Status:
- Proposed
- Product and engineering planning document

Date:
- 2026-03-31

Purpose:
- Define the long-term role of `Account settings` inside hub admin
- Prevent package, domain, and account-management concerns from scattering across unrelated admin areas
- Establish a clean V1 scope before further implementation

Related:
- [Custom Domain Management Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/custom-domain-management-plan-2026-03-31.md)
- [Monetisation Tier And External Payments Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/monetisation-tier-and-external-payments-model-2026-04-08.md)
- [Product-Site Package Authority Contract](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-package-authority-contract-2026-03-31.md)
- [SaaS Package Tier And Entitlement Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-tier-and-entitlement-model-2026-03-29.md)

## 1) Executive Summary

`Account settings` is the correct admin home for:

- package visibility
- package usage and limits
- package-management handoff
- custom-domain operational management

It is not the home for:

- general site content settings
- page composition
- operational community workflows like members, events, or courses

This page should become the account-level operational and commercial boundary inside hub admin.

## 2) Why This Page Exists

Admins need one place to understand:

- what package they are on
- what they are allowed to use
- what they are close to exhausting
- how custom-domain state works
- where to initiate upgrade or downgrade actions

Without this, package awareness becomes fragmented and domain management feels bolted on.

## 3) Page Scope

`Account settings` should own four primary sections.

### 3.1 Package

Show:

- current package tier
- package status
- high-level package summary
- package-aware usage against limits
- upgrade pressure when relevant

### 3.2 Package management

Show:

- `Manage package`
- `Upgrade to Growth`
- explanatory copy that package authority lives in the product-site billing system

These actions should eventually hand off to the product site.

### 3.3 Custom domain

Show:

- current platform subdomain
- custom-domain entitlement state
- current custom-domain lifecycle state
- setup/verification controls for Growth hubs
- locked upgrade panel for Free and Starter

### 3.4 Consequences and status

Show:

- downgrade consequences where relevant
- domain disconnect scheduling if present
- helpful status/audit information for supportability

## 4) What Should Not Live Here

Do not expand this page into:

- payment operations
- event/course monetisation setup
- general site settings
- broad billing history
- hub member/account profile settings

Those belong elsewhere.

Clarification:

- package visibility should explain whether a hub is on:
  - no paid offerings
  - external payments
  - built-in payments
- but the actual configuration of memberships, events, and courses still belongs inside their operational areas rather than `Account settings`

## 5) Recommended Information Architecture

Inside admin navigation:

- `Settings`
  - `Site settings`
  - `Page settings`
  - `Account settings`

Inside `Account settings`, the page should read in this order:

1. package summary
2. usage and limits
3. package-management actions
4. custom-domain section
5. downgrade / lifecycle consequences where relevant

This keeps the page focused and legible.

## 6) V1 Boundary

V1 should support:

- package visibility
- package usage visibility
- package-management handoff placeholders or live links
- custom-domain locked state for non-Growth
- custom-domain setup and verification for Growth once implemented

V1 should not try to become a full billing portal.

## 7) Final Decisions Locked By This Document

Locked:

- `Account settings` is the home for account-level package and domain management inside hub admin
- package authority still belongs to the product site
- custom-domain operations belong in `Account settings`, not on the product site
- package-management actions may hand off to the product site without moving domain operations there
