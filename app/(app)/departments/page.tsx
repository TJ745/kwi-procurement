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
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Departments" };

const CREATE_LABEL = "New department";

export default async function Page({ searchParams }: PageProps<"/departments">) {
  const { can, formatDate } = await requirePermission("departments:view");
  const params = parseListParams(await searchParams);
  const result = await listDepartments(params);
  const canCreate = can("departments:create");
  const canEdit = can("departments:edit");
  const canDelete = can("departments:delete");
  const item = getNavItem("/departments");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.title}
        description={item.description}
        actions={
          canCreate && (
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
        canCreate={canCreate}
        createLabel={CREATE_LABEL}
        searchPlaceholder="Search departments"
      >
        <NameEntityTable
          rows={result.items}
          entityLabel="department"
          canEdit={canEdit}
          canDelete={canDelete}
          formatDate={formatDate.date}
          update={updateDepartment}
          remove={deleteDepartment}
        />
      </MasterDataList>
    </div>
  );
}
