import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { getNavItem } from "@/lib/navigation";

/** Placeholder for a module whose requirements will be specified later. */
export function ModulePlaceholder({ href }: { href: string }) {
  const item = getNavItem(href);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.title}
        description={item.description}
        actions={<Badge variant="secondary">Planned</Badge>}
      />
      <EmptyState
        icon={item.icon}
        title="Coming in a later phase"
        description={`The ${item.title} module has not been implemented yet. Its functionality will be added once its requirements are finalised.`}
      />
    </div>
  );
}
