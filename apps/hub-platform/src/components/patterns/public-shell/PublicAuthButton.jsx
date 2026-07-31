"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { buildHubAuthHref } from "@/lib/auth/hub-auth-redirects";

export default function PublicAuthButton({
  hubSlug,
  route,
  routeMode = "path",
  variant = "ghost",
  size = "md",
  children,
  className = "",
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams?.toString();
  const nextPath = query ? `${pathname}?${query}` : pathname;
  const href = buildHubAuthHref(hubSlug, route, nextPath, routeMode);

  return (
    <Button href={href} prefetch={false} variant={variant} size={size} className={className}>
      {children}
    </Button>
  );
}
