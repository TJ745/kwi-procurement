import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/module-placeholder";
import { requireSuperAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default async function Page() {
  await requireSuperAdmin();
  return <ModulePlaceholder href="/settings" />;
}
