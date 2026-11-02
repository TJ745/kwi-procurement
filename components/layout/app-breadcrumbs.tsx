"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DASHBOARD, findNavEntry } from "@/lib/navigation";

type Crumb = { label: string; href?: string };

function buildCrumbs(pathname: string): Crumb[] {
  if (pathname === "/profile") {
    return [{ label: DASHBOARD.title, href: DASHBOARD.href }, { label: "Profile" }];
  }
  const entry = findNavEntry(pathname);
  if (!entry || entry.item.href === DASHBOARD.href) {
    return [{ label: DASHBOARD.title }];
  }
  const crumbs: Crumb[] = [
    { label: DASHBOARD.title, href: DASHBOARD.href },
    { label: entry.group.label },
  ];
  // Nested pages (e.g. /suppliers/[id]) link back to their module.
  if (pathname === entry.item.href) {
    crumbs.push({ label: entry.item.title });
  } else {
    const label = pathname.endsWith("/new")
      ? "New"
      : pathname.endsWith("/edit")
        ? "Edit"
        : "Details";
    crumbs.push({ label: entry.item.title, href: entry.item.href }, { label });
  }
  return crumbs;
}

export function AppBreadcrumbs() {
  const crumbs = buildCrumbs(usePathname());

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <Fragment key={crumb.label}>
              {/* Intermediate crumbs are hidden on small screens. */}
              <BreadcrumbItem
                className={isLast ? "min-w-0" : "hidden md:inline-flex"}
              >
                {isLast ? (
                  <BreadcrumbPage className="truncate font-medium">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : crumb.href ? (
                  <BreadcrumbLink render={<Link href={crumb.href} />}>
                    {crumb.label}
                  </BreadcrumbLink>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
