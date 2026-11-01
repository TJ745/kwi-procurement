import type { Metadata } from "next";
import Link from "next/link";

import { DeleteButton } from "@/components/master-data/delete-button";
import { FormDialog } from "@/components/master-data/form-dialog";
import { MasterDataList } from "@/components/master-data/master-data-list";
import { SupplierForm } from "@/components/master-data/supplier-form";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createSupplier, deleteSupplier, updateSupplier } from "@/lib/actions/suppliers";
import { parseListParams } from "@/lib/data/list-params";
import { listSuppliers } from "@/lib/data/master-data";
import { getNavItem } from "@/lib/navigation";
import { canManageMasterData } from "@/lib/permissions";
import { requireUser } from "@/lib/session";
import { toSupplierFormValues } from "@/lib/supplier-format";

export const metadata: Metadata = { title: "Suppliers" };

const CREATE_LABEL = "New supplier";

function Muted({ value }: { value: string | null }) {
  return value ? <>{value}</> : <span className="text-muted-foreground">—</span>;
}

export default async function Page({ searchParams }: PageProps<"/suppliers">) {
  const { user } = await requireUser();
  const params = parseListParams(await searchParams);
  const result = await listSuppliers(params);
  const canManage = canManageMasterData(user.role);
  const item = getNavItem("/suppliers");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.title}
        description={item.description}
        actions={
          canManage && (
            <FormDialog mode="create" title={CREATE_LABEL} triggerLabel={CREATE_LABEL} size="lg">
              <SupplierForm action={createSupplier} />
            </FormDialog>
          )
        }
      />
      <MasterDataList
        item={item}
        noun="suppliers"
        params={params}
        result={result}
        canManage={canManage}
        createLabel={CREATE_LABEL}
        searchPlaceholder="Search name, VAT, CR, contact or email"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Name</TableHead>
              <TableHead className="hidden md:table-cell">VAT</TableHead>
              <TableHead className="hidden lg:table-cell">CR</TableHead>
              <TableHead className="hidden md:table-cell">Contact</TableHead>
              <TableHead className="hidden xl:table-cell">Email</TableHead>
              {canManage && (
                <TableHead className="w-24 pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="max-w-72 truncate pl-4">
                  <Link
                    href={`/suppliers/${supplier.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {supplier.name}
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Muted value={supplier.vat} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Muted value={supplier.cr} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {supplier.contactName || supplier.contactNumber ? (
                    <div className="flex flex-col">
                      <span>{supplier.contactName}</span>
                      <span className="text-xs text-muted-foreground">
                        {supplier.contactNumber}
                      </span>
                    </div>
                  ) : (
                    <Muted value={null} />
                  )}
                </TableCell>
                <TableCell className="hidden max-w-60 truncate xl:table-cell">
                  <Muted value={supplier.email} />
                </TableCell>
                {canManage && (
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1">
                      <FormDialog
                        mode="edit"
                        title="Edit supplier"
                        triggerLabel={`Edit supplier ${supplier.name}`}
                        size="lg"
                      >
                        <SupplierForm
                          action={updateSupplier.bind(null, supplier.id)}
                          defaultValues={toSupplierFormValues(supplier)}
                        />
                      </FormDialog>
                      <DeleteButton
                        entityLabel="supplier"
                        itemLabel={supplier.name}
                        action={deleteSupplier.bind(null, supplier.id)}
                      />
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </MasterDataList>
    </div>
  );
}
