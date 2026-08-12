import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readHubPlatformSource(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("account settings custom-domain UI exposes evidence-backed status, DNS records, and selected tools", () => {
  const source = readHubPlatformSource("src/app/(admin)/[hubSlug]/admin/settings/account/page.jsx");
  const viewModelSource = readHubPlatformSource("src/app/(admin)/[hubSlug]/admin/settings/account/accountDomainViewModel.js");

  assert.match(source, /buildConnectionHealthSteps/);
  assert.match(source, /buildSetupGuideChecks/);
  assert.match(source, /AccountDomainConnectionHealth/);
  assert.match(viewModelSource, /Domain entered/);
  assert.match(viewModelSource, /Ownership verified/);
  assert.match(viewModelSource, /DNS routing/);
  assert.match(viewModelSource, /Secure connection/);
  assert.match(viewModelSource, /Connected/);
  assert.match(viewModelSource, /Add TXT record/);
  assert.match(viewModelSource, /Point traffic to HubForJ/);
  assert.match(viewModelSource, /Wait for verification/);
  assert.match(source, /buildDnsRecords/);
  assert.match(source, /AccountDomainTools/);
  assert.match(source, /domainStatusSummary/);
  assert.match(source, /Domain overview/);
  assert.match(source, /domainFactBody/);
  assert.match(source, /domainMetaStrip/);
  assert.match(source, /DomainMetaItem/);
  assert.doesNotMatch(viewModelSource, /Open DNS manager/);
  assert.doesNotMatch(source, /Hosting project/);
  assert.doesNotMatch(source, /vercelProjectId/);
  assert.doesNotMatch(source, /The branded address members can use/);
  assert.doesNotMatch(source, /Available for admin access and support/);
  assert.match(source, /No active-member package limit is enforced/);
  assert.match(source, /No published-upcoming-event package limit is enforced/);
  assert.doesNotMatch(source, /available on this package/);
});

test("custom-domain copy button uses browser clipboard without copying placeholders", () => {
  const source = readHubPlatformSource("src/app/(admin)/[hubSlug]/admin/settings/account/AccountDomainCopyButton.jsx");
  const viewModelSource = readHubPlatformSource("src/app/(admin)/[hubSlug]/admin/settings/account/accountDomainViewModel.js");

  assert.match(source, /navigator\.clipboard\.writeText\(value\)/);
  assert.match(source, /Copied/);
  assert.match(source, /content_copy/);
  assert.match(viewModelSource, /copyName: domainState\?\.verificationHost \|\| ""/);
  assert.match(viewModelSource, /copyName: domainState\?\.dnsRoutingRecordName \|\| ""/);
  assert.match(viewModelSource, /safeValues\.forEach/);
  assert.match(viewModelSource, /copyValue: routingValues\.length \|\| routingValue \? value : ""/);
});

test("custom-domain tools use a task segmented control instead of constant panels", () => {
  const source = readHubPlatformSource("src/app/(admin)/[hubSlug]/admin/settings/account/AccountDomainTools.jsx");
  const dnsTableSource = readHubPlatformSource("src/app/(admin)/[hubSlug]/admin/settings/account/AccountDomainDnsRecordsTable.jsx");
  const segmentedSource = readHubPlatformSource("src/components/ui/task-segmented-control/TaskSegmentedControl.jsx");

  assert.match(source, /TaskSegmentedControl/);
  assert.match(segmentedSource, /role="tablist"/);
  assert.match(segmentedSource, /aria-controls/);
  assert.match(segmentedSource, /ArrowLeft/);
  assert.match(source, /Domain tools/);
  assert.match(source, /Choose a task to manage your domain/);
  assert.match(source, /DNS configuration/);
  assert.match(source, /Setup guide/);
  assert.match(source, /Disconnect/);
  assert.match(source, /AccountDomainDnsRecordsTable/);
  assert.match(source, /Notice/);
  assert.match(dnsTableSource, /dnsRecordHeading/);
  assert.match(dnsTableSource, /Host/);
  assert.match(dnsTableSource, /Value/);
  assert.match(dnsTableSource, /TTL/);
  assert.match(dnsTableSource, /Badge/);
  assert.doesNotMatch(source, /AdminSelect/);
  assert.doesNotMatch(source, /verified_user/);
  assert.doesNotMatch(source, /Choose the domain task you want to review or complete/);
  assert.doesNotMatch(source, /Use this if you want the hub to stop using the current custom domain/);
});

test("custom-domain disconnect copy avoids provider implementation detail", () => {
  const source = readHubPlatformSource("src/app/(admin)/[hubSlug]/admin/settings/account/AccountDomainDisconnectForm.jsx");

  assert.match(source, /Disconnecting your custom domain will stop it from working with your hub/);
  assert.match(source, /Disconnecting will make your domain inactive/);
  assert.match(source, /Visitors will not be able to access your site using this domain/);
  assert.match(source, /This action cannot be undone/);
  assert.match(source, /disconnectConfirmationPanel/);
  assert.match(source, /disconnectDangerLine/);
  assert.match(source, /name="cancel"/);
  assert.match(source, /disconnectSubmit/);
  assert.match(source, /Confirm custom domain/);
  assert.doesNotMatch(source, /Confirm current custom domain/);
  assert.doesNotMatch(source, /remove the domain from hosting where possible/);
});

test("custom-domain setup guide uses provider instructions without unverifiable state claims", () => {
  const source = readHubPlatformSource("src/app/(admin)/[hubSlug]/admin/settings/account/AccountDomainSetupGuide.jsx");
  const providersSource = readHubPlatformSource("src/app/(admin)/[hubSlug]/admin/settings/account/accountDomainRegistrarProviders.js");

  assert.match(source, /AdminSelect/);
  assert.match(source, /Modal/);
  assert.match(source, /Domain registrar/);
  assert.match(source, /Common location/);
  assert.match(source, /setupChecklist/);
  assert.match(source, /Badge/);
  assert.doesNotMatch(source, /setupChecklistStatus/);
  assert.match(providersSource, /GoDaddy/);
  assert.match(providersSource, /Cloudflare/);
  assert.match(providersSource, /Namecheap/);
  assert.match(providersSource, /Squarespace/);
  assert.match(source, /Records to add or edit/);
  assert.match(providersSource, /If a record with the same type and name already exists, edit it instead/);
  assert.doesNotMatch(source, /opened DNS manager/);
});

test("custom-domain account styles keep admin typography and surface hierarchy tokenized", () => {
  const source = readHubPlatformSource("src/app/(admin)/[hubSlug]/admin/settings/account/page.module.css");
  const noticeSource = readHubPlatformSource("src/components/ui/notice/Notice.module.css");
  const segmentedSource = readHubPlatformSource("src/components/ui/task-segmented-control/TaskSegmentedControl.module.css");

  assert.match(source, /\.description \{\s*font: var\(--font-body-md\);/s);
  assert.match(source, /\.domainValue,[\s\S]*?font: var\(--font-body-md-strong\);/);
  assert.match(source, /\.noticeTitle,[\s\S]*?font: var\(--font-heading-xs\);/);
  assert.match(source, /\.domainStatusSummary/);
  assert.match(source, /\.domainMetaStrip/);
  assert.match(source, /\.domainMetaItem/);
  assert.match(source, /\.connectionHealth/);
  assert.match(source, /\.dnsRecordFields/);
  assert.match(source, /\.dnsRecordValue code/);
  assert.match(source, /\.disconnectSubmit/);
  assert.match(source, /\.disconnectWarningNotice/);
  assert.match(source, /background: var\(--accent-danger\)/);
  assert.match(source, /background: var\(--admin-surface-default-fill, var\(--surface-primary\)\);/);
  assert.match(source, /background: var\(--admin-surface-muted-fill, var\(--surface-secondary\)\);/);
  assert.match(noticeSource, /--badge-warning-bg/);
  assert.match(noticeSource, /--badge-danger-border/);
  assert.match(source, /font-feature-settings: "liga"/);
  assert.match(segmentedSource, /--admin-surface-muted-fill/);
  assert.match(segmentedSource, /--admin-surface-accent-fill/);
  assert.match(source, /\.hostStat strong \{\s*font: var\(--font-body-lg-strong\);/s);
  assert.doesNotMatch(source, /\.hostStat strong \{[\s\S]*?font-size: clamp/);
});

test("custom-domain routing instructions are stored after Vercel provisioning and readiness checks", () => {
  const vercelSource = readHubPlatformSource("src/lib/domain/custom-domain-vercel.js");
  const mutationsSource = readHubPlatformSource("src/lib/data/hub-mutations.js");
  const verificationSource = readHubPlatformSource("src/lib/data/custom-domain-verification.js");
  const domainSource = readHubPlatformSource("src/lib/domain/hub-domains.js");

  assert.match(vercelSource, /resolveRoutingInstruction/);
  assert.match(vercelSource, /dnsRoutingRecordType/);
  assert.match(vercelSource, /dnsRoutingRecordValues/);
  assert.match(mutationsSource, /dnsRoutingRecordType: normalizeString\(provisioning\.dnsRoutingRecordType\)/);
  assert.match(verificationSource, /dnsRoutingRecordType: normalizeString\(readiness\.dnsRoutingRecordType \|\| customDomain\.dnsRoutingRecordType\)/);
  assert.match(domainSource, /dnsRoutingRecordValue: normalizeString\(record\.dnsRoutingRecordValue\)/);
  assert.match(domainSource, /dnsRoutingRecordValues: Array\.isArray\(storedDomain\.dnsRoutingRecordValues\)/);
});
