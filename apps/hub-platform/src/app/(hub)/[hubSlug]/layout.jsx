import ThemeScope from "@/components/primitives/theme-scope/ThemeScope";
import PublicShell from "@/components/patterns/public-shell/PublicShell";
import { getPublicHeaderModel } from "@/lib/data/public-header";
import { requireHubCoreBySlug } from "@/lib/data/hubs";
import { getCachedSiteSettingsByHub } from "@/lib/data/site-settings";
import { resolvePublicBrandThemeTokens } from "@/lib/domain/public-brand-theme";
import { resolvePublicFooterModel } from "@/lib/domain/public-footer";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export default async function HubLayout({ children, params }) {
  const { hubSlug } = await params;
  const requestHeaders = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(requestHeaders));
  let hub;

  try {
    hub = await requireHubCoreBySlug(hubSlug);
  } catch {
    notFound();
  }

  const siteSettings = await getCachedSiteSettingsByHub(hub);
  const headerModel = await getPublicHeaderModel(hub, siteSettings, { routeMode });
  const footerModel = resolvePublicFooterModel({ hub });
  const theme = siteSettings.themeKey || hub.theme;
  const themeVariables = resolvePublicBrandThemeTokens({
    theme,
    branding: siteSettings.branding,
  });

  return (
    <ThemeScope theme={theme} template={hub.template} variables={themeVariables}>
      <PublicShell hubSlug={hub.slug} routeMode={routeMode} headerModel={headerModel} footerModel={footerModel} siteSettings={siteSettings}>
        {children}
      </PublicShell>
    </ThemeScope>
  );
}
