import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readProductSiteSource(path) {
  return readFileSync(new URL(`../../../product-site/${path}`, import.meta.url), "utf8");
}

test("product-site signed-in visitors are redirected away from acquisition routes", () => {
  const homePageSource = readProductSiteSource("src/app/page.jsx");
  const signInPageSource = readProductSiteSource("src/app/(marketing)/sign-in/page.jsx");
  const signupPageSource = readProductSiteSource("src/app/(marketing)/signup/page.jsx");

  assert.match(homePageSource, /readCommercialAccountSession/);
  assert.match(homePageSource, /redirect\("\/account"\)/);
  assert.match(signInPageSource, /readCommercialAccountSession/);
  assert.match(signInPageSource, /redirect\("\/account"\)/);
  assert.match(signupPageSource, /readCommercialAccountSession/);
  assert.match(signupPageSource, /redirect\("\/account\/package"\)/);
});

test("product-site marketing chrome avoids mixed anonymous navigation for signed-in users", () => {
  const marketingNavSource = readProductSiteSource("src/components/patterns/marketing-nav/MarketingNav.jsx");
  const marketingShellSource = readProductSiteSource("src/components/patterns/marketing-shell/MarketingShell.jsx");

  assert.match(marketingNavSource, /hasAccountSession\s*\?\s*\[/);
  assert.match(marketingNavSource, /\{ href: "\/pricing", label: "Pricing" \}/);
  assert.match(marketingNavSource, /\{ href: "\/account", label: "Account" \}/);
  assert.match(marketingNavSource, /\{ href: "\/signup", label: "Signup" \}/);
  assert.match(marketingNavSource, /\{ href: "\/sign-in", label: "Sign in" \}/);
  assert.match(marketingShellSource, /hasAccountSession \? \(/);
  assert.match(marketingShellSource, /href="\/account\/package">Manage package/);
  assert.match(marketingShellSource, /href="\/signup">Start your community/);
});
