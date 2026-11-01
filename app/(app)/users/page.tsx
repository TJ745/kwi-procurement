import type { Metadata } from "next";
import Link from "next/link";

import { CreateUserForm, EditUserForm, ResetPasswordForm } from "@/components/admin/user-forms";
import { UserStatusButton } from "@/components/admin/user-status-button";
import { FormDialog } from "@/components/master-data/form-dialog";
import { MasterDataList } from "@/components/master-data/master-data-list";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createUser, resetUserPassword, setUserActive, updateUser } from "@/lib/actions/users";
import { listRoleOptions, listUsers } from "@/lib/data/admin";
import { parseListParams } from "@/lib/data/list-params";
import { getNavItem } from "@/lib/navigation";
import { isSuperAdmin } from "@/lib/roles";
import { requireSuperAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Users" };

const CREATE_LABEL = "New user";

export default async function Page({ searchParams }: PageProps<"/users">) {
  const { formatDate, settings } = await requireSuperAdmin();
  const params = parseListParams(await searchParams);
  const [result, roles] = await Promise.all([listUsers(params), listRoleOptions()]);
  const item = getNavItem("/users");
  const { minPasswordLength } = settings;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.title}
        description={item.description}
        actions={
          roles.length > 0 ? (
            <FormDialog mode="create" title={CREATE_LABEL} triggerLabel={CREATE_LABEL}>
              <CreateUserForm action={createUser} roles={roles} minPasswordLength={minPasswordLength} />
            </FormDialog>
          ) : (
            <Link href="/roles" className={buttonVariants({ variant: "outline" })}>
              Create a role first
            </Link>
          )
        }
      />
      <MasterDataList
        item={item}
        noun="users"
        params={params}
        result={result}
        canCreate
        createLabel={CREATE_LABEL}
        searchPlaceholder="Search name, email or role"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead className="w-32 pr-4 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((user) => {
              const superAdmin = isSuperAdmin(user.role);
              return (
                <TableRow key={user.id} className={user.active ? undefined : "text-muted-foreground"}>
                  <TableCell className="max-w-72 pl-4">
                    <div className="flex flex-col">
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {superAdmin ? (
                      <Badge>Super Admin</Badge>
                    ) : (
                      <Badge variant="outline">{user.customRole?.name ?? "No role"}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={user.active ? "secondary" : "destructive"}>
                        {user.active ? "Active" : "Deactivated"}
                      </Badge>
                      {user.mustChangePassword && <Badge variant="outline">Temporary password</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate.date(user.createdAt)}</TableCell>
                  <TableCell className="pr-4">
                    {superAdmin ? (
                      <p className="text-right text-xs text-muted-foreground">Managed in .env</p>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <FormDialog mode="edit" title="Edit user" triggerLabel={`Edit user ${user.name}`}>
                          <EditUserForm
                            action={updateUser.bind(null, user.id)}
                            roles={roles}
                            defaultValues={{ name: user.name, email: user.email, roleId: user.roleId ?? "" }}
                          />
                        </FormDialog>
                        <FormDialog
                          mode="edit"
                          icon="password"
                          title="Reset password"
                          description={`Set a temporary password for ${user.name}.`}
                          triggerLabel={`Reset password for ${user.name}`}
                        >
                          <ResetPasswordForm
                            action={resetUserPassword.bind(null, user.id)}
                            minPasswordLength={minPasswordLength}
                          />
                        </FormDialog>
                        <UserStatusButton
                          userName={user.name}
                          active={user.active}
                          action={setUserActive.bind(null, user.id)}
                        />
                      </div>
                    )}
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
