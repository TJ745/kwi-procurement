import { FileQuestion } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <EmptyState
        icon={FileQuestion}
        title="Page not found"
        description="The page you are looking for does not exist or has been moved."
      >
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to dashboard
        </Link>
      </EmptyState>
    </main>
  );
}
