import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/module-placeholder";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Payment Request" };

export default async function Page() {
  await requireUser();
  return <ModulePlaceholder href="/payment-requests" />;
}
