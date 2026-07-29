"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { commercialAccountNavItems } from "@/lib/navigation/account-nav";

export default function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account navigation" className="subnav">
      {commercialAccountNavItems.map((item) => {
        const isActive = item.match.test(pathname);

        return (
          <Link key={item.href} href={item.href} className="subnav-link" data-active={isActive ? "true" : "false"}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
