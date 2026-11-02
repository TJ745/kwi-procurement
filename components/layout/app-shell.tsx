import { cookies } from "next/headers";

import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getNotificationFeed } from "@/lib/data/notifications";
import { NAV_GROUPS } from "@/lib/navigation";
import { NAV_PERMISSIONS } from "@/lib/permissions";
import { requireUser } from "@/lib/session";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const [{ user, isSuperAdmin, can, roleLabel }, cookieStore] = await Promise.all([
    requireUser(),
    cookies(),
  ]);
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const notifications = await getNotificationFeed(user.id);
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
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur-sm md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,28rem)_minmax(0,1fr)] md:gap-4 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-4!" />
            <AppBreadcrumbs />
          </div>
          <div className="flex justify-center">
            <GlobalSearch />
          </div>
          <div className="flex items-center justify-end gap-0.5">
            <ThemeToggle />
            <NotificationBell initialFeed={notifications} />
            <UserMenu name={user.name} email={user.email} roleLabel={roleLabel} />
          </div>
        </header>
        <div className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
