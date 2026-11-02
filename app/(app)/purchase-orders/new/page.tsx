import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { FileWarning } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PurchaseOrderForm } from "@/components/purchase-orders/purchase-order-form";
import { buttonVariants } from "@/components/ui/button";
import { createPurchaseOrder } from "@/lib/actions/purchase-orders";
import { currencyOptions } from "@/lib/currencies";
import {
  getMaterialRequestForPurchaseOrder,
  getPurchaseOrderOptions,
} from "@/lib/data/purchase-orders";
import { previewDocumentNumber } from "@/lib/numbering";
import { requirePermission } from "@/lib/session";
import { EMPTY_PO_LINE, type PurchaseOrderInput } from "@/lib/validation/purchase-order";

export const metadata: Metadata = { title: "New purchase order" };

export default async function Page({ searchParams }: PageProps<"/purchase-orders/new">) {
  const { settings } = await requirePermission("purchase_orders:create");
  const { mr } = await searchParams;
  const mrId = typeof mr === "string" ? mr : "";
  const [options, nextNumber, source] = await Promise.all([
    getPurchaseOrderOptions(),
    previewDocumentNumber("PURCHASE_ORDER", settings.timeZone),
    mrId ? getMaterialRequestForPurchaseOrder(mrId) : Promise.resolve(null),
  ]);

  if (mrId && !source) {
    return (
      <EmptyState
        icon={FileWarning}
        title="This material request can't be used"
        description="Only approved material requests without an existing purchase order can be turned into a PO."
      >
        <Link href={`/material-requests/${mrId}`} className={buttonVariants({ variant: "outline" })}>
          Back to the request
        </Link>
      </EmptyState>
    );
  }

  const today = format(new TZDate(new Date(), settings.timeZone), "yyyy-MM-dd");
  const supplier = source?.supplierId
    ? options.suppliers.find((option) => option.value === source.supplierId)
    : undefined;

  const defaultValues: PurchaseOrderInput = {
    orderDate: today,
    projectId: source?.projectId ?? "",
    departmentId: source?.departmentId ?? "",
    categoryId: source?.categoryId ?? "",
    deliverTo: source?.project.name ?? "",
    supplierId: supplier?.value ?? "",
    supplierName: supplier?.details.supplierName ?? "",
    supplierAddress: supplier?.details.supplierAddress ?? "",
    supplierContactName: supplier?.details.supplierContactName ?? "",
    supplierContactNumber: supplier?.details.supplierContactNumber ?? "",
    supplierEmail: supplier?.details.supplierEmail ?? "",
    supplierTelephone: supplier?.details.supplierTelephone ?? "",
    supplierVat: supplier?.details.supplierVat ?? "",
    quotationRef: "",
    currency: settings.currency,
    discount: "0",
    vatRate: settings.defaultVatRate.toString(),
    terms: settings.purchaseOrderTerms ?? "",
    lines: source
      ? source.lines.map((line) => ({
          name: line.name,
          unit: line.unit,
          quantity: line.quantity.toString(),
          unitPrice: "",
        }))
      : [{ ...EMPTY_PO_LINE }],
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New purchase order"
        description={
          source
            ? `Raised from material request ${source.number}. Review the lines and add unit prices.`
            : "The PO number is assigned automatically when you save."
        }
      />
      <PurchaseOrderForm
        // A different source MR must start a fresh form (the page instance
        // is reused between visits).
        key={source?.id ?? "standalone"}
        action={createPurchaseOrder.bind(null, source?.id ?? "")}
        options={{ ...options, currencies: currencyOptions() }}
        nextNumberPreview={nextNumber ?? undefined}
        materialRequestNumber={source?.number}
        dateFormat={settings.dateFormat}
        cancelHref={source ? `/material-requests/${source.id}` : "/purchase-orders"}
        defaultValues={defaultValues}
      />
    </div>
  );
}
