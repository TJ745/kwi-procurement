import { KeyRound } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { signOutAction } from "@/lib/actions/auth";
import { requireUserForPasswordChange } from "@/lib/session";

export const metadata: Metadata = { title: "Change password" };

async function ChangePassword() {
  const { user, isSuperAdmin, settings } = await requireUserForPasswordChange();
  const forced = user.mustChangePassword;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {forced ? "Choose a new password" : "Change password"}
        </CardTitle>
        <CardDescription>
          {forced
            ? "Your administrator set a temporary password. Choose your own to continue."
            : `Signed in as ${user.email}.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSuperAdmin ? (
          <p className="text-sm text-muted-foreground">
            The Super Admin password is managed in <code>.env</code>. Change{" "}
            <code>SUPER_ADMIN_PASSWORD</code> there and run{" "}
            <code>npm run sync-super-admin</code>.
          </p>
        ) : (
          <ChangePasswordForm minPasswordLength={settings.minPasswordLength} forced={forced} />
        )}
        {forced && (
          <form action={signOutAction} className="mt-4 text-center">
            <Button type="submit" variant="link" size="sm">
              Not you? Sign out
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ChangePasswordPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex items-center justify-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <KeyRound className="size-5" />
          </div>
          <span className="text-lg font-semibold">Procurement Management</span>
        </div>
        <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
          <ChangePassword />
        </Suspense>
      </div>
    </main>
  );
}
