import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/master-data/delete-button";
import { FormDialog } from "@/components/master-data/form-dialog";
import { SupplierForm } from "@/components/master-data/supplier-form";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { deleteSupplierFromDetail, updateSupplier } from "@/lib/actions/suppliers";
import { getSupplier } from "@/lib/data/master-data";
import { requirePermission } from "@/lib/session";
import { formatIban, toSupplierFormValues } from "@/lib/supplier-format";
import { paymentTermLabel } from "@/lib/validation/master-data";

export const metadata: Metadata = { title: "Supplier" };

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm wrap-break-word whitespace-pre-line">
        {value || <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}

export default async function Page({ params }: PageProps<"/suppliers/[id]">) {
  const { can, formatDate } = await requirePermission("suppliers:view");
  const { id } = await params;
  const supplier = await getSupplier(id);
  if (!supplier) notFound();
  const canEdit = can("suppliers:edit");
  const canDelete = can("suppliers:delete");

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/suppliers"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 w-fit" })}
      >
        <ArrowLeft />
        Back to suppliers
      </Link>
      <PageHeader
        title={supplier.name}
        description={`Last updated ${formatDate.dateTime(supplier.updatedAt)}`}
        actions={
          <>
            {canEdit && (
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
            )}
            {canDelete && (
              <DeleteButton
                variant="button"
                entityLabel="supplier"
                itemLabel={supplier.name}
                action={deleteSupplierFromDetail.bind(null, supplier.id)}
                redirectTo="/suppliers"
              />
            )}
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Company</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="VAT" value={supplier.vat} />
              <Detail label="CR" value={supplier.cr} />
              <div className="sm:col-span-2">
                <Detail label="IBAN" value={supplier.iban && formatIban(supplier.iban)} />
              </div>
              <div className="sm:col-span-2">
                <Detail label="Address" value={supplier.address} />
              </div>
              <Detail label="Email" value={supplier.email} />
              <Detail label="Telephone" value={supplier.telephone} />
              <Detail label="Payment terms" value={paymentTermLabel(supplier.paymentTerm, supplier.creditDays)} />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contact person</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Detail label="Contact name" value={supplier.contactName} />
              </div>
              <Detail label="Contact email" value={supplier.contactEmail} />
              <Detail label="Contact number" value={supplier.contactNumber} />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
