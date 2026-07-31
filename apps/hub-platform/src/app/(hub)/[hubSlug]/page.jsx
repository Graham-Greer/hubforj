import PublicLandingPage from "@/components/patterns/public-landing-page/PublicLandingPage";
import { getPublicLandingDeferredData, getPublicLandingShellData } from "@/lib/data/public-site";

export default async function HubLandingPage({ params }) {
  const { hubSlug } = await params;
  const data = await getPublicLandingShellData(hubSlug);
  const deferredDataPromise = getPublicLandingDeferredData(data.hub);

  return <PublicLandingPage {...data} deferredDataPromise={deferredDataPromise} />;
}
