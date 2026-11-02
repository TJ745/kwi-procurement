import type { Metadata } from "next";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { PageHeader } from "@/components/page-header";
import { ThemeSelector } from "@/components/theme/theme-selector";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PERMISSION_ACTION_LABELS,
  PERMISSION_MODULES,
  type Permission,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Profile" };

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm wrap-break-word">{value}</dd>
    </div>
  );
}

export default async function Page() {
  const { user, isSuperAdmin, roleLabel, can, settings, formatDate } = await requireUser();
  const { createdAt } = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { createdAt: true },
  });

  const access = PERMISSION_MODULES.flatMap((module) => {
    const actions = (module.actions as readonly (keyof typeof PERMISSION_ACTION_LABELS)[]).filter((action) =>
      can(`${module.key}:${action}` as Permission),
    );
    return actions.length
      ? [{ module: module.label, actions: actions.map((action) => PERMISSION_ACTION_LABELS[action]) }]
      : [];
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Profile" description="Your account details, access and preferences." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Name and email are managed by the Super Admin.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Name" value={user.name} />
              <Detail label="Email" value={user.email} />
              <Detail label="Role" value={<Badge variant={isSuperAdmin ? "default" : "outline"}>{roleLabel}</Badge>} />
              <Detail label="Member since" value={formatDate.date(createdAt)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access</CardTitle>
            <CardDescription>What your role allows you to do.</CardDescription>
          </CardHeader>
          <CardContent>
            {isSuperAdmin ? (
              <p className="text-sm">Full access to every module, including Users, Roles and Settings.</p>
            ) : access.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Your role does not include any modules yet. Contact your administrator.
              </p>
            ) : (
              <ul className="flex flex-col divide-y">
                {access.map((entry) => (
                  <li key={entry.module} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                    <span className="text-sm font-medium">{entry.module}</span>
                    <span className="flex flex-wrap gap-1">
                      {entry.actions.map((action) => (
                        <Badge key={action} variant="secondary">
                          {action}
                        </Badge>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              {isSuperAdmin
                ? "The Super Admin password is managed in .env."
                : "Changing your password signs you out on other devices."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuperAdmin ? (
              <p className="text-sm text-muted-foreground">
                Update <code>SUPER_ADMIN_PASSWORD</code> in <code>.env</code> and run{" "}
                <code>npm run sync-super-admin</code>.
              </p>
            ) : (
              <ChangePasswordForm minPasswordLength={settings.minPasswordLength} forced={false} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Saved in this browser.</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSelector />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
