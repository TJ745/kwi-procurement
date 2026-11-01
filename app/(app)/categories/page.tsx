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
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Categories" };

const CREATE_LABEL = "New category";

export default async function Page({ searchParams }: PageProps<"/categories">) {
  const { can, formatDate } = await requirePermission("categories:view");
  const params = parseListParams(await searchParams);
  const result = await listCategories(params);
  const canCreate = can("categories:create");
  const canEdit = can("categories:edit");
  const canDelete = can("categories:delete");
  const item = getNavItem("/categories");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.title}
        description={item.description}
        actions={
          canCreate && (
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
        canCreate={canCreate}
        createLabel={CREATE_LABEL}
        searchPlaceholder="Search categories"
      >
        <NameEntityTable
          rows={result.items}
          entityLabel="category"
          canEdit={canEdit}
          canDelete={canDelete}
          formatDate={formatDate.date}
          update={updateCategory}
          remove={deleteCategory}
        />
      </MasterDataList>
    </div>
  );
}
