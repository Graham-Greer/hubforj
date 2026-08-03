import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";

export default async function MemberCoursesPage({ params }) {
  const { hubSlug } = await params;
  const requestHeaders = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(requestHeaders));

  redirect(buildHubRuntimeHref(hubSlug, "/account/bookings", routeMode));
}
