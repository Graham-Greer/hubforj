import PackageCatalog from "./PackageCatalog";
import { getPackageCatalog } from "@/lib/domain/package-catalog";

export default function PricingPackageExplorer({ hasAccountSession = false }) {
  const packages = getPackageCatalog();

  return <PackageCatalog items={packages} mode={hasAccountSession ? "signed-in-marketing" : "marketing"} />;
}
