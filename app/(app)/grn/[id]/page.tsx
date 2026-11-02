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
import { deleteGrnFromDetail, setGrnStatus } from "@/lib/actions/grns";
import { getGrn } from "@/lib/data/grns";
import { formatQuantity } from "@/lib/format";
import { GRN_STATUSES, GRN_STATUS_LABELS, LOCKED_GRN_STATUSES, deliveryMethodLabel } from "@/lib/grn";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "GRN" };

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

const qty = (value: { toString(): string }) => formatQuantity(value);

export default async function Page({ params }: PageProps<"/grn/[id]">) {
  const { can, formatDate } = await requirePermission("grns:view");
  const { id } = await params;
  const grn = await getGrn(id);
  if (!grn) notFound();
  const locked = LOCKED_GRN_STATUSES.includes(grn.status);
  const po = grn.purchaseOrder;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/grn" className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 w-fit" })}>
        <ArrowLeft />
        Back to goods received notes
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-tight">{grn.number}</h1>
            <StatusBadge status={grn.status} label={GRN_STATUS_LABELS[grn.status]} />
          </div>
          <p className="text-sm text-muted-foreground">
            Created by {grn.createdBy.name} on {formatDate.dateTime(grn.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/grn/${grn.id}/pdf`} target="_blank" rel="noopener" className={buttonVariants({ variant: "outline" })}>
            <Printer />
            Print PDF
          </a>
          {can("grns:status") && (
            <StatusMenu
              status={grn.status}
              statuses={GRN_STATUSES}
              labels={GRN_STATUS_LABELS}
              action={setGrnStatus.bind(null, grn.id)}
            />
          )}
          {can("grns:edit") && (
            <Link href={`/grn/${grn.id}/edit`} className={buttonVariants({ variant: "outline" })}>
              <Pencil />
              Edit
            </Link>
          )}
          {can("grns:delete") && !locked && (
            <DeleteButton
              variant="button"
              entityLabel="GRN"
              itemLabel={grn.number}
              action={deleteGrnFromDetail.bind(null, grn.id)}
              redirectTo="/grn"
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            {locked && <CardDescription>Approved GRNs cannot be deleted.</CardDescription>}
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Date" value={formatDate.calendarDate(grn.receiptDate)} />
              <Detail
                label="PO Ref"
                value={
                  can("purchase_orders:view") ? (
                    <Link href={`/purchase-orders/${po.id}`} className="font-mono font-medium underline-offset-4 hover:underline">
                      {po.number}
                    </Link>
                  ) : (
                    <span className="font-mono">{po.number}</span>
                  )
                }
              />
              <Detail
                label="MR Ref"
                value={
                  po.materialRequest &&
                  (can("material_requests:view") ? (
                    <Link
                      href={`/material-requests/${po.materialRequest.id}`}
                      className="font-mono font-medium underline-offset-4 hover:underline"
                    >
                      {po.materialRequest.number}
                    </Link>
                  ) : (
                    <span className="font-mono">{po.materialRequest.number}</span>
                  ))
                }
              />
              <Detail label="Ordered by" value={grn.department.name} />
              <Detail label="Project name" value={grn.project.name} />
              <Detail label="Project code" value={grn.project.code} />
              <Detail label="Invoice No" value={grn.invoiceNo} />
              <Detail label="Delivered by" value={deliveryMethodLabel(grn.deliveredBy)} />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>From</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4">
              <Detail label="Supplier name" value={grn.supplierName} />
              <Detail label="Address" value={grn.supplierAddress} />
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 pb-0">
        <CardHeader className="border-b">
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                {["Sr No", "PO No", "Item code", "Item description", "Dept", "Unit"].map((label, index) => (
                  <th key={label} className={`px-2 py-2 font-medium ${index === 0 ? "pl-4" : ""}`}>{label}</th>
                ))}
                {["Ordered", "Received", "Short", "Excess", "Rejected", "Accepted"].map((label, index, all) => (
                  <th key={label} className={`px-2 py-2 text-right font-medium ${index === all.length - 1 ? "pr-4" : ""}`}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grn.lines.map((line) => (
                <tr key={line.id} className="border-b last:border-0">
                  <td className="px-2 py-2 pl-4 tabular-nums">{line.lineNo}</td>
                  <td className="px-2 py-2 font-mono">{po.number}</td>
                  <td className="px-2 py-2">{line.itemCode ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-2 py-2">{line.description}</td>
                  <td className="px-2 py-2">{line.department.name}</td>
                  <td className="px-2 py-2">{line.unit}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{qty(line.orderedQty)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{qty(line.receivedQty)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{qty(line.shortQty)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{qty(line.excessQty)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{qty(line.rejectedQty)}</td>
                  <td className="px-2 py-2 pr-4 text-right font-medium tabular-nums">{qty(line.acceptedQty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Remarks</CardTitle>
        </CardHeader>
        <CardContent>
          {grn.remarks ? (
            <p className="text-sm whitespace-pre-line">{grn.remarks}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No remarks.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
