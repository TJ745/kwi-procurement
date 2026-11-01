import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/module-placeholder";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Purchase Order" };

export default async function Page() {
  await requireUser();
  return <ModulePlaceholder href="/purchase-orders" />;
}
