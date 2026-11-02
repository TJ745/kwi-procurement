import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { PurchaseOrderForm } from "@/components/purchase-orders/purchase-order-form";
import { updatePurchaseOrder } from "@/lib/actions/purchase-orders";
import { currencyOptions } from "@/lib/currencies";
import { getPurchaseOrder, getPurchaseOrderOptions } from "@/lib/data/purchase-orders";
import { toIsoDate } from "@/lib/format";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Edit purchase order" };

export default async function Page({ params }: PageProps<"/purchase-orders/[id]/edit">) {
  const { settings } = await requirePermission("purchase_orders:edit");
  const { id } = await params;
  const [order, options] = await Promise.all([getPurchaseOrder(id), getPurchaseOrderOptions()]);
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Edit ${order.number}`} description="Update the order details, supplier, items and terms." />
      <PurchaseOrderForm
        // Remount when the order changed since this page was last shown.
        key={order.updatedAt.getTime()}
        action={updatePurchaseOrder.bind(null, order.id)}
        options={{ ...options, currencies: currencyOptions() }}
        number={order.number}
        materialRequestNumber={order.materialRequest?.number}
        dateFormat={settings.dateFormat}
        cancelHref={`/purchase-orders/${order.id}`}
        defaultValues={{
          orderDate: toIsoDate(order.orderDate),
          projectId: order.projectId,
          departmentId: order.departmentId,
          categoryId: order.categoryId,
          deliverTo: order.deliverTo,
          supplierId: order.supplierId,
          supplierName: order.supplierName,
          supplierAddress: order.supplierAddress ?? "",
          supplierContactName: order.supplierContactName ?? "",
          supplierContactNumber: order.supplierContactNumber ?? "",
          supplierEmail: order.supplierEmail ?? "",
          supplierTelephone: order.supplierTelephone ?? "",
          supplierVat: order.supplierVat ?? "",
          quotationRef: order.quotationRef ?? "",
          currency: order.currency,
          discount: order.discount.toString(),
          vatRate: order.vatRate.toString(),
          terms: order.terms ?? "",
          lines: order.lines.map((line) => ({
            name: line.name,
            unit: line.unit,
            quantity: line.quantity.toString(),
            unitPrice: line.unitPrice.toString(),
          })),
        }}
      />
    </div>
  );
}
