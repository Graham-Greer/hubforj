import ThemeScope from "@/components/primitives/theme-scope/ThemeScope";
import PublicShell from "@/components/patterns/public-shell/PublicShell";
import { getPublicHeaderModel } from "@/lib/data/public-header";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getSiteSettingsByHub } from "@/lib/data/site-settings";
import { resolvePublicBrandThemeTokens } from "@/lib/domain/public-brand-theme";
import { resolvePublicFooterModel } from "@/lib/domain/public-footer";
import { notFound } from "next/navigation";

export default async function HubLayout({ children, params }) {
  const { hubSlug } = await params;
  let hub;

  try {
    hub = await requireHubBySlug(hubSlug);
  } catch {
    notFound();
  }

  const siteSettings = await getSiteSettingsByHub(hub);
  const headerModel = await getPublicHeaderModel(hub, siteSettings);
  const footerModel = resolvePublicFooterModel({ hub });
  const theme = siteSettings.themeKey || hub.theme;
  const themeVariables = resolvePublicBrandThemeTokens({
    theme,
    branding: siteSettings.branding,
  });

  return (
    <ThemeScope theme={theme} template={hub.template} variables={themeVariables}>
      <PublicShell hubSlug={hub.slug} headerModel={headerModel} footerModel={footerModel} siteSettings={siteSettings}>
        {children}
      </PublicShell>
    </ThemeScope>
  );
}
