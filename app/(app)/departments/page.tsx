import type { Metadata } from "next";

import { FormDialog } from "@/components/master-data/form-dialog";
import { MasterDataList } from "@/components/master-data/master-data-list";
import { NameEntityTable } from "@/components/master-data/name-entity-table";
import { NameForm } from "@/components/master-data/name-form";
import { PageHeader } from "@/components/page-header";
import {
  createDepartment,
  deleteDepartment,
  updateDepartment,
} from "@/lib/actions/departments";
import { parseListParams } from "@/lib/data/list-params";
import { listDepartments } from "@/lib/data/master-data";
import { getNavItem } from "@/lib/navigation";
import { canManageMasterData } from "@/lib/permissions";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Departments" };

const CREATE_LABEL = "New department";

export default async function Page({ searchParams }: PageProps<"/departments">) {
  const { user } = await requireUser();
  const params = parseListParams(await searchParams);
  const result = await listDepartments(params);
  const canManage = canManageMasterData(user.role);
  const item = getNavItem("/departments");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.title}
        description={item.description}
        actions={
          canManage && (
            <FormDialog mode="create" title={CREATE_LABEL} triggerLabel={CREATE_LABEL}>
              <NameForm action={createDepartment} />
            </FormDialog>
          )
        }
      />
      <MasterDataList
        item={item}
        noun="departments"
        params={params}
        result={result}
        canManage={canManage}
        createLabel={CREATE_LABEL}
        searchPlaceholder="Search departments"
      >
        <NameEntityTable
          rows={result.items}
          entityLabel="department"
          canManage={canManage}
          update={updateDepartment}
          remove={deleteDepartment}
        />
      </MasterDataList>
    </div>
  );
}
