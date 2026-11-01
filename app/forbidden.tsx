import { ShieldAlert } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";

export default function Forbidden() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <EmptyState
        icon={ShieldAlert}
        title="Access denied"
        description="You do not have permission to view this page. Contact a Super Admin if you believe this is a mistake."
      >
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to dashboard
        </Link>
      </EmptyState>
    </main>
  );
}
