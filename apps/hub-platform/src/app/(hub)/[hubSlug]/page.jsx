import PublicLandingPage from "@/components/patterns/public-landing-page/PublicLandingPage";
import { getPublicLandingData } from "@/lib/data/public-site";

export default async function HubLandingPage({ params }) {
  const { hubSlug } = await params;
  const data = await getPublicLandingData(hubSlug);

  return <PublicLandingPage {...data} />;
}
