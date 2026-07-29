import { notFound } from "next/navigation";
import { requireHubBySlug } from "@/lib/data/hubs";
import { hasHubCapability } from "@/lib/domain/package-guards";

export default async function CoursesLayout({ children, params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);

  if (!hasHubCapability(hub, "coursesEnabled")) {
    notFound();
  }

  return children;
}
