import type { Metadata } from "next";

import { FormDialog } from "@/components/master-data/form-dialog";
import { MasterDataList } from "@/components/master-data/master-data-list";
import { NameEntityTable } from "@/components/master-data/name-entity-table";
import { NameForm } from "@/components/master-data/name-form";
import { PageHeader } from "@/components/page-header";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/actions/categories";
import { parseListParams } from "@/lib/data/list-params";
import { listCategories } from "@/lib/data/master-data";
import { getNavItem } from "@/lib/navigation";
import { canManageMasterData } from "@/lib/permissions";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Categories" };

const CREATE_LABEL = "New category";

export default async function Page({ searchParams }: PageProps<"/categories">) {
  const { user } = await requireUser();
  const params = parseListParams(await searchParams);
  const result = await listCategories(params);
  const canManage = canManageMasterData(user.role);
  const item = getNavItem("/categories");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.title}
        description={item.description}
        actions={
          canManage && (
            <FormDialog mode="create" title={CREATE_LABEL} triggerLabel={CREATE_LABEL}>
              <NameForm action={createCategory} />
            </FormDialog>
          )
        }
      />
      <MasterDataList
        item={item}
        noun="categories"
        params={params}
        result={result}
        canManage={canManage}
        createLabel={CREATE_LABEL}
        searchPlaceholder="Search categories"
      >
        <NameEntityTable
          rows={result.items}
          entityLabel="category"
          canManage={canManage}
          update={updateCategory}
          remove={deleteCategory}
        />
      </MasterDataList>
    </div>
  );
}
