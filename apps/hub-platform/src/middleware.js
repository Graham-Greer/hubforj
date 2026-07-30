import { NextResponse } from "next/server";
import { getRequestHostFromHeaders, isStaticOrApiPath, resolveHubHostContext } from "@/lib/domain/hub-hosts";
import { getInternalAutomationSecret, isCustomDomainRuntimeEnabled } from "@/lib/domain/custom-domain-runtime-config";

function normalizePathname(value) {
  return String(value || "").trim() || "/";
}

function stripHubSlugPrefix(pathname, hubSlug) {
  if (!hubSlug) {
    return normalizePathname(pathname);
  }

  if (pathname === `/${hubSlug}`) {
    return "/";
  }

  if (pathname.startsWith(`/${hubSlug}/`)) {
    return pathname.slice(hubSlug.length + 1) || "/";
  }

  return normalizePathname(pathname);
}

async function resolveCustomDomainMapping(request, host) {
  const token = getInternalAutomationSecret();

  if (!token || !host || !isCustomDomainRuntimeEnabled()) {
    return null;
  }

  const url = new URL("/api/internal/custom-domains/resolve", request.url);
  url.searchParams.set("host", host);

  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return payload?.found ? payload : null;
}

function buildRedirectUrl(request, targetHost, pathname) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.host = targetHost;
  redirectUrl.pathname = pathname;
  return redirectUrl;
}

export async function middleware(request) {
  const pathname = normalizePathname(request.nextUrl.pathname);

  if (isStaticOrApiPath(pathname)) {
    return NextResponse.next();
  }

  const hostContext = resolveHubHostContext(getRequestHostFromHeaders(request.headers));

  if (hostContext.kind !== "platform_subdomain" && hostContext.kind !== "local_subdomain") {
    if (hostContext.kind !== "custom_domain_candidate") {
      return NextResponse.next();
    }

    const resolved = await resolveCustomDomainMapping(request, hostContext.host);

    if (!resolved?.hubSlug) {
      return NextResponse.next();
    }

    if (resolved.redirectTo && resolved.redirectTo !== hostContext.host) {
      return NextResponse.redirect(buildRedirectUrl(request, resolved.redirectTo, pathname));
    }

    if (pathname === `/${resolved.hubSlug}` || pathname.startsWith(`/${resolved.hubSlug}/`)) {
      return NextResponse.redirect(buildRedirectUrl(request, hostContext.host, stripHubSlugPrefix(pathname, resolved.hubSlug)));
    }

    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = pathname === "/" ? `/${resolved.hubSlug}` : `/${resolved.hubSlug}${pathname}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  const hubSlug = hostContext.subdomainLabel;

  if (!hubSlug) {
    return NextResponse.next();
  }

  if (pathname === `/${hubSlug}` || pathname.startsWith(`/${hubSlug}/`)) {
    return NextResponse.redirect(buildRedirectUrl(request, hostContext.host, stripHubSlugPrefix(pathname, hubSlug)));
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = pathname === "/" ? `/${hubSlug}` : `/${hubSlug}${pathname}`;
  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
