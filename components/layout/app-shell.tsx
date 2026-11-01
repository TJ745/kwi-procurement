import { cookies } from "next/headers";

import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NAV_GROUPS } from "@/lib/navigation";
import { NAV_PERMISSIONS } from "@/lib/permissions";
import { requireUser } from "@/lib/session";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const [{ user, isSuperAdmin, can, roleLabel }, cookieStore] = await Promise.all([
    requireUser(),
    cookies(),
  ]);
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const visibleHrefs = NAV_GROUPS.filter((group) => !group.superAdminOnly || isSuperAdmin)
    .flatMap((group) => group.items)
    .filter((item) => {
      const permission = NAV_PERMISSIONS[item.href];
      return !permission || can(permission);
    })
    .map((item) => item.href);

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar visibleHrefs={visibleHrefs} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4!" />
          <AppBreadcrumbs />
          <div className="ml-auto">
            <UserMenu
              name={user.name}
              email={user.email}
              roleLabel={roleLabel}
              canChangePassword={!isSuperAdmin}
            />
          </div>
        </header>
        <div className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
