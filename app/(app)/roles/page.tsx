import type { Metadata } from "next";

import { RoleForm } from "@/components/admin/role-form";
import { DeleteButton } from "@/components/master-data/delete-button";
import { FormDialog } from "@/components/master-data/form-dialog";
import { MasterDataList } from "@/components/master-data/master-data-list";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createRole, deleteRole, updateRole } from "@/lib/actions/roles";
import { listRoles } from "@/lib/data/admin";
import { parseListParams } from "@/lib/data/list-params";
import { getNavItem } from "@/lib/navigation";
import {
  PERMISSION_ACTIONS,
  PERMISSION_ACTION_LABELS,
  PERMISSION_MODULES,
  normalizePermissions,
} from "@/lib/permissions";
import { requireSuperAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Roles" };

const CREATE_LABEL = "New role";

/** e.g. ["Projects: View, Create", "Suppliers: View"]. */
function summarize(permissions: string[]) {
  const granted = new Set(normalizePermissions(permissions));
  return PERMISSION_MODULES.flatMap((module) => {
    const actions = PERMISSION_ACTIONS.filter((action) => granted.has(`${module.key}:${action}`));
    return actions.length
      ? [`${module.label}: ${actions.map((action) => PERMISSION_ACTION_LABELS[action]).join(", ")}`]
      : [];
  });
}

export default async function Page({ searchParams }: PageProps<"/roles">) {
  await requireSuperAdmin();
  const params = parseListParams(await searchParams);
  const result = await listRoles(params);
  const item = getNavItem("/roles");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.title}
        description="Define roles and what each can do. The Super Admin always has full access."
        actions={
          <FormDialog mode="create" title={CREATE_LABEL} triggerLabel={CREATE_LABEL} size="lg">
            <RoleForm action={createRole} />
          </FormDialog>
        }
      />
      <MasterDataList
        item={item}
        noun="roles"
        params={params}
        result={result}
        canCreate
        createLabel={CREATE_LABEL}
        searchPlaceholder="Search roles"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Role</TableHead>
              <TableHead className="hidden md:table-cell">Permissions</TableHead>
              <TableHead className="w-20 text-right">Users</TableHead>
              <TableHead className="w-24 pr-4 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((role) => {
              const summary = summarize(role.permissions);
              return (
                <TableRow key={role.id}>
                  <TableCell className="max-w-64 pl-4 align-top whitespace-normal">
                    <div className="flex flex-col">
                      <span className="font-medium">{role.name}</span>
                      {role.description && (
                        <span className="text-xs text-muted-foreground">{role.description}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden align-top whitespace-normal md:table-cell">
                    {summary.length ? (
                      <div className="flex flex-wrap gap-1">
                        {summary.map((line) => (
                          <Badge key={line} variant="outline">
                            {line}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No permissions</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right align-top tabular-nums">{role._count.users}</TableCell>
                  <TableCell className="pr-4 align-top">
                    <div className="flex justify-end gap-1">
                      <FormDialog mode="edit" title="Edit role" triggerLabel={`Edit role ${role.name}`} size="lg">
                        <RoleForm
                          action={updateRole.bind(null, role.id)}
                          defaultValues={{
                            name: role.name,
                            description: role.description ?? "",
                            permissions: normalizePermissions(role.permissions),
                          }}
                        />
                      </FormDialog>
                      <DeleteButton
                        entityLabel="role"
                        itemLabel={role.name}
                        action={deleteRole.bind(null, role.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </MasterDataList>
    </div>
  );
}
