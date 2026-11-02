import { Suspense } from "react";

/** Print views: no app shell; content depends on the session, so it streams in. */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Preparing print view…</p>}>
      {children}
    </Suspense>
  );
}
