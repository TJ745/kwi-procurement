import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GrnForm } from "@/components/grns/grn-form";
import { PageHeader } from "@/components/page-header";
import { updateGrn } from "@/lib/actions/grns";
import { getGrn, getGrnOptions, getPurchaseOrderForGrn } from "@/lib/data/grns";
import { toIsoDate } from "@/lib/format";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Edit GRN" };

export default async function Page({ params }: PageProps<"/grn/[id]/edit">) {
  const { settings } = await requirePermission("grns:edit");
  const { id } = await params;
  const [grn, options] = await Promise.all([getGrn(id), getGrnOptions()]);
  if (!grn) notFound();
  // Outstanding quantities exclude this GRN, so its own receipts can be re-entered.
  const source = await getPurchaseOrderForGrn(grn.purchaseOrderId, grn.id);
  if (!source) notFound();
  const saved = new Map(grn.lines.map((line) => [line.purchaseOrderLineId, line]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Edit ${grn.number}`} description="Update the delivery details and received quantities." />
      <GrnForm
        // Remount when the GRN changed since this page was last shown.
        key={grn.updatedAt.getTime()}
        action={updateGrn.bind(null, grn.id)}
        departments={options.departments}
        sourceLines={source.lines}
        dateFormat={settings.dateFormat}
        cancelHref={`/grn/${grn.id}`}
        header={{
          number: grn.number,
          poNumber: grn.purchaseOrder.number,
          mrNumber: grn.purchaseOrder.materialRequest?.number ?? null,
          projectName: grn.project.name,
          projectCode: grn.project.code,
        }}
        defaultValues={{
          receiptDate: toIsoDate(grn.receiptDate),
          departmentId: grn.departmentId,
          supplierName: grn.supplierName,
          supplierAddress: grn.supplierAddress ?? "",
          invoiceNo: grn.invoiceNo ?? "",
          deliveredBy: grn.deliveredBy,
          remarks: grn.remarks ?? "",
          lines: source.lines.map((line) => {
            const existing = saved.get(line.purchaseOrderLineId);
            return {
              purchaseOrderLineId: line.purchaseOrderLineId,
              itemCode: existing?.itemCode ?? "",
              departmentId: existing?.departmentId ?? grn.departmentId,
              receivedQty: existing?.receivedQty.toString() ?? "0",
              rejectedQty: existing?.rejectedQty.toString() ?? "0",
            };
          }),
        }}
      />
    </div>
  );
}
