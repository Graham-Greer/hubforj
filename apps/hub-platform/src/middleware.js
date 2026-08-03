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

function getRouteFamily(pathname) {
  const segments = normalizePathname(pathname).split("/").filter(Boolean);
  return segments[1] === "admin" ? "admin" : "";
}

function buildRequestHeaders(request, pathname) {
  const requestHeaders = new Headers(request.headers);
  const routeFamily = getRouteFamily(pathname);

  requestHeaders.set("x-hubforj-pathname", normalizePathname(pathname));
  requestHeaders.set("x-hubforj-search", request.nextUrl.search || "");

  if (routeFamily) {
    requestHeaders.set("x-hubforj-route-family", routeFamily);
  } else {
    requestHeaders.delete("x-hubforj-route-family");
  }

  return requestHeaders;
}

function nextWithRouteHeaders(request, pathname) {
  return NextResponse.next({
    request: {
      headers: buildRequestHeaders(request, pathname),
    },
  });
}

function rewriteWithRouteHeaders(request, rewriteUrl) {
  return NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: buildRequestHeaders(request, rewriteUrl.pathname),
    },
  });
}

export async function middleware(request) {
  const pathname = normalizePathname(request.nextUrl.pathname);

  if (isStaticOrApiPath(pathname)) {
    return NextResponse.next();
  }

  const hostContext = resolveHubHostContext(getRequestHostFromHeaders(request.headers));

  if (hostContext.kind !== "platform_subdomain" && hostContext.kind !== "local_subdomain") {
    if (hostContext.kind !== "custom_domain_candidate") {
      return nextWithRouteHeaders(request, pathname);
    }

    const resolved = await resolveCustomDomainMapping(request, hostContext.host);

    if (!resolved?.hubSlug) {
      return nextWithRouteHeaders(request, pathname);
    }

    if (resolved.redirectTo && resolved.redirectTo !== hostContext.host) {
      return NextResponse.redirect(buildRedirectUrl(request, resolved.redirectTo, pathname));
    }

    if (pathname === `/${resolved.hubSlug}` || pathname.startsWith(`/${resolved.hubSlug}/`)) {
      return NextResponse.redirect(buildRedirectUrl(request, hostContext.host, stripHubSlugPrefix(pathname, resolved.hubSlug)));
    }

    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = pathname === "/" ? `/${resolved.hubSlug}` : `/${resolved.hubSlug}${pathname}`;
    return rewriteWithRouteHeaders(request, rewriteUrl);
  }

  const hubSlug = hostContext.subdomainLabel;

  if (!hubSlug) {
    return nextWithRouteHeaders(request, pathname);
  }

  if (pathname === `/${hubSlug}` || pathname.startsWith(`/${hubSlug}/`)) {
    return NextResponse.redirect(buildRedirectUrl(request, hostContext.host, stripHubSlugPrefix(pathname, hubSlug)));
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = pathname === "/" ? `/${hubSlug}` : `/${hubSlug}${pathname}`;
  return rewriteWithRouteHeaders(request, rewriteUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
