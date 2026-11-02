import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { FileWarning, PackageCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { GrnForm } from "@/components/grns/grn-form";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { createGrn } from "@/lib/actions/grns";
import { getGrnOptions, getPurchaseOrderForGrn } from "@/lib/data/grns";
import { previewDocumentNumber } from "@/lib/numbering";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "New GRN" };

export default async function Page({ searchParams }: PageProps<"/grn/new">) {
  const { settings, can } = await requirePermission("grns:create");
  const { po } = await searchParams;
  const poId = typeof po === "string" ? po : "";

  if (!poId) {
    return (
      <EmptyState
        icon={PackageCheck}
        title="Start from a purchase order"
        description="A GRN is raised from an approved or issued purchase order. Open the purchase order and choose “Create GRN”."
      >
        {can("purchase_orders:view") && (
          <Link href="/purchase-orders?status=APPROVED" className={buttonVariants({ variant: "outline" })}>
            View approved purchase orders
          </Link>
        )}
      </EmptyState>
    );
  }

  const [options, nextNumber, source] = await Promise.all([
    getGrnOptions(),
    previewDocumentNumber("GRN", settings.timeZone),
    getPurchaseOrderForGrn(poId),
  ]);
  if (!source) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Goods can't be received against this purchase order"
        description="GRNs can only be raised from approved or issued purchase orders."
      >
        <Link href={`/purchase-orders/${poId}`} className={buttonVariants({ variant: "outline" })}>
          Back to the purchase order
        </Link>
      </EmptyState>
    );
  }

  const today = format(new TZDate(new Date(), settings.timeZone), "yyyy-MM-dd");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New goods received note"
        description={`Receiving against ${source.number}. Enter the received quantities for the items that arrived.`}
      />
      <GrnForm
        // A different source PO must start a fresh form (the page instance is
        // reused between visits).
        key={source.id}
        action={createGrn.bind(null, source.id)}
        departments={options.departments}
        sourceLines={source.lines}
        dateFormat={settings.dateFormat}
        cancelHref={`/purchase-orders/${source.id}`}
        header={{
          nextNumberPreview: nextNumber ?? undefined,
          poNumber: source.number,
          mrNumber: source.materialRequest?.number ?? null,
          projectName: source.project.name,
          projectCode: source.project.code,
        }}
        defaultValues={{
          receiptDate: today,
          departmentId: source.departmentId,
          supplierName: source.supplierName,
          supplierAddress: source.supplierAddress ?? "",
          invoiceNo: "",
          deliveredBy: "LOCAL_DELIVERY",
          remarks: "",
          lines: source.lines.map((line) => ({
            purchaseOrderLineId: line.purchaseOrderLineId,
            itemCode: "",
            departmentId: source.departmentId,
            receivedQty: "0",
            rejectedQty: "0",
          })),
        }}
      />
    </div>
  );
}
