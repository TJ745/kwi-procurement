import { ArrowLeft, Pencil, Printer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/master-data/delete-button";
import { StatusBadge } from "@/components/status/status-badge";
import { StatusMenu } from "@/components/status/status-menu";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deletePurchaseOrderFromDetail,
  setPurchaseOrderStatus,
} from "@/lib/actions/purchase-orders";
import { getPurchaseOrder } from "@/lib/data/purchase-orders";
import { formatQuantity } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/lib/session";
import {
  LOCKED_PURCHASE_ORDER_STATUSES,
  PURCHASE_ORDER_STATUSES,
  PURCHASE_ORDER_STATUS_LABELS,
} from "@/lib/validation/purchase-order";

export const metadata: Metadata = { title: "Purchase order" };

function Detail({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm wrap-break-word whitespace-pre-line">
        {value || <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}

export default async function Page({ params }: PageProps<"/purchase-orders/[id]">) {
  const { can, formatDate } = await requirePermission("purchase_orders:view");
  const { id } = await params;
  const order = await getPurchaseOrder(id);
  if (!order) notFound();
  const locked = LOCKED_PURCHASE_ORDER_STATUSES.includes(order.status);
  const money = (value: { toString(): string }) => formatMoney(value, order.currency);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/purchase-orders"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 w-fit" })}
      >
        <ArrowLeft />
        Back to purchase orders
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-tight">{order.number}</h1>
            <StatusBadge status={order.status} label={PURCHASE_ORDER_STATUS_LABELS[order.status]} />
          </div>
          <p className="text-sm text-muted-foreground">
            {order.category.name} · Created by {order.createdBy.name} on {formatDate.dateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/purchase-orders/${order.id}/pdf`}
            target="_blank"
            rel="noopener"
            className={buttonVariants({ variant: "outline" })}
          >
            <Printer />
            Print PDF
          </a>
          {can("purchase_orders:status") && (
            <StatusMenu
              status={order.status}
              statuses={PURCHASE_ORDER_STATUSES}
              labels={PURCHASE_ORDER_STATUS_LABELS}
              action={setPurchaseOrderStatus.bind(null, order.id)}
            />
          )}
          {can("purchase_orders:edit") && (
            <Link href={`/purchase-orders/${order.id}/edit`} className={buttonVariants({ variant: "outline" })}>
              <Pencil />
              Edit
            </Link>
          )}
          {can("purchase_orders:delete") && !locked && (
            <DeleteButton
              variant="button"
              entityLabel="purchase order"
              itemLabel={order.number}
              action={deletePurchaseOrderFromDetail.bind(null, order.id)}
              redirectTo="/purchase-orders"
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Purchase order data</CardTitle>
            {locked && (
              <CardDescription>
                {PURCHASE_ORDER_STATUS_LABELS[order.status]} purchase orders cannot be deleted.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Order date" value={formatDate.calendarDate(order.orderDate)} />
              <Detail
                label="MR Number"
                value={
                  order.materialRequest &&
                  (can("material_requests:view") ? (
                    <Link
                      href={`/material-requests/${order.materialRequest.id}`}
                      className="font-mono font-medium underline-offset-4 hover:underline"
                    >
                      {order.materialRequest.number}
                    </Link>
                  ) : (
                    <span className="font-mono">{order.materialRequest.number}</span>
                  ))
                }
              />
              <Detail label="Ordered by (Department)" value={order.department.name} />
              <Detail label="Project name" value={order.project.name} />
              <Detail label="Project code" value={order.project.code} />
              <Detail label="Subject" value={order.category.name} className="sm:col-span-2" />
              <Detail label="Deliver to" value={order.deliverTo} className="sm:col-span-2" />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>To (supplier)</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Company name" value={order.supplierName} />
              <Detail label="VAT number" value={order.supplierVat} />
              <Detail label="Location" value={order.supplierAddress} className="sm:col-span-2" />
              <Detail label="Contact person" value={order.supplierContactName} />
              <Detail label="Contact number" value={order.supplierContactNumber} />
              <Detail label="Email" value={order.supplierEmail} />
              <Detail label="Tel" value={order.supplierTelephone} />
              <Detail label="Quotation reference" value={order.quotationRef} />
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 pb-0">
        <CardHeader className="border-b">
          <CardTitle>Items</CardTitle>
          <CardDescription>
            {order.lines.length} line{order.lines.length === 1 ? "" : "s"} · amounts in {order.currency}
          </CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 pl-4">Sr No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-24">Unit</TableHead>
              <TableHead className="w-24 text-right">Quantity</TableHead>
              <TableHead className="w-32 text-right">Unit price</TableHead>
              <TableHead className="w-36 pr-4 text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="pl-4 tabular-nums">{line.lineNo}</TableCell>
                <TableCell className="whitespace-normal">{line.name}</TableCell>
                <TableCell>{line.unit}</TableCell>
                <TableCell className="text-right tabular-nums">{formatQuantity(line.quantity)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(line.unitPrice, order.currency, false)}</TableCell>
                <TableCell className="pr-4 text-right tabular-nums">{formatMoney(line.total, order.currency, false)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <dl className="ml-auto flex w-full max-w-sm flex-col gap-1.5 border-t p-4 text-sm tabular-nums">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd>− {money(order.discount)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">VAT ({order.vatRate.toString()}%)</dt><dd>{money(order.vatAmount)}</dd></div>
          <div className="mt-1 flex justify-between border-t pt-2 text-base font-semibold"><dt>Grand total</dt><dd>{money(order.total)}</dd></div>
        </dl>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          {order.terms ? (
            <p className="text-sm whitespace-pre-line">{order.terms}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No terms on this order.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
