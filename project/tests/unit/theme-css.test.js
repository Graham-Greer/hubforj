import test from "node:test";
import assert from "node:assert/strict";
import {
  buildThemeCssText,
  buildThemeScope,
  getThemeCssPath,
  getThemeStylesheetHref,
} from "../../src/lib/theming/hub-theme.js";
import {
  getNextThemeRevision,
  shouldRefreshThemeCss,
} from "../../src/lib/theming/theme-css-service.js";

test("buildThemeCssText generates deterministic scoped css", () => {
  const css = buildThemeCssText({
    id: "hub_123",
    templateKey: "templateA",
    tokenOverrides: {
      "--z-index-custom": "10",
      "--link": "#0ea5e9",
      templateA: {
        "--bg": "#ffffff",
      },
    },
  });

  assert.match(css, /:root\[data-template="templateA"\]/);
  assert.match(css, /--bg: #ffffff;/);
  assert.match(css, /--link: #0ea5e9;/);
  assert.match(css, /--z-index-custom: 10;/);
});

test("getThemeStylesheetHref includes revision cache buster", () => {
  const previous = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "community-app-c2f67.firebasestorage.app";

  const href = getThemeStylesheetHref({
    id: "hub_abc",
    themeRevision: 7,
    themeCssPath: getThemeCssPath("hub_abc"),
  });

  assert.equal(
    href,
    "https://storage.googleapis.com/community-app-c2f67.firebasestorage.app/hubs/hub_abc/theme/theme-overrides.css?v=7"
  );

  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = previous;
});

test("theme revision increments only when template or token overrides change", () => {
  assert.equal(shouldRefreshThemeCss({ name: "Renamed Hub" }), false);
  assert.equal(shouldRefreshThemeCss({ templateKey: "templateB" }), true);
  assert.equal(shouldRefreshThemeCss({ tokenOverrides: { "--bg": "#fff" } }), true);

  assert.equal(getNextThemeRevision(1, { name: "No theme change" }), 1);
  assert.equal(getNextThemeRevision(1, { templateKey: "templateB" }), 2);
  assert.equal(getNextThemeRevision(9, { tokenOverrides: {} }), 10);
});

test("buildThemeScope exposes stylesheet href with revision", () => {
  const previous = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "community-app-c2f67.firebasestorage.app";

  const scope = buildThemeScope({
    id: "hub_scope",
    templateKey: "templateA",
    themeRevision: 4,
    themeCssPath: getThemeCssPath("hub_scope"),
  });

  assert.equal(scope["data-template"], "templateA");
  assert.equal(scope["data-hub-theme"], "hub_scope");
  assert.match(scope.stylesheetHref, /\?v=4$/);

  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = previous;
});
