import { ArrowLeft, Pencil, Printer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/master-data/delete-button";
import { StatusBadge } from "@/components/status/status-badge";
import { StatusMenu } from "@/components/status/status-menu";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  deletePaymentRequestFromDetail,
  setPaymentRequestStatus,
} from "@/lib/actions/payment-requests";
import { amountInWords } from "@/lib/amount-in-words";
import { getPaymentRequest } from "@/lib/data/payment-requests";
import { formatMoney } from "@/lib/money";
import {
  LOCKED_PAYMENT_REQUEST_STATUSES,
  OTHERS_ITEM,
  PAYMENT_ITEM_GROUPS,
  PAYMENT_REQUEST_STATUSES,
  PAYMENT_REQUEST_STATUS_LABELS,
  paymentTypeLabel,
  priorityLabel,
} from "@/lib/payment-request-options";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Payment request" };

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

export default async function Page({ params }: PageProps<"/payment-requests/[id]">) {
  const { can, formatDate } = await requirePermission("payment_requests:view");
  const { id } = await params;
  const request = await getPaymentRequest(id);
  if (!request) notFound();
  const locked = LOCKED_PAYMENT_REQUEST_STATUSES.includes(request.status);
  const ticked = new Set(request.items);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/payment-requests"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 w-fit" })}
      >
        <ArrowLeft />
        Back to payment requests
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-tight">{request.number}</h1>
            <StatusBadge status={request.status} label={PAYMENT_REQUEST_STATUS_LABELS[request.status]} />
            <Badge variant={request.priority === "NORMAL" ? "outline" : "destructive"}>
              {priorityLabel(request.priority)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Created by {request.createdBy.name} on {formatDate.dateTime(request.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/payment-requests/${request.id}/pdf`}
            target="_blank"
            rel="noopener"
            className={buttonVariants({ variant: "outline" })}
          >
            <Printer />
            Print PDF
          </a>
          {can("payment_requests:status") && (
            <StatusMenu
              status={request.status}
              statuses={PAYMENT_REQUEST_STATUSES}
              labels={PAYMENT_REQUEST_STATUS_LABELS}
              action={setPaymentRequestStatus.bind(null, request.id)}
            />
          )}
          {can("payment_requests:edit") && (
            <Link href={`/payment-requests/${request.id}/edit`} className={buttonVariants({ variant: "outline" })}>
              <Pencil />
              Edit
            </Link>
          )}
          {can("payment_requests:delete") && !locked && (
            <DeleteButton
              variant="button"
              entityLabel="payment request"
              itemLabel={request.number}
              action={deletePaymentRequestFromDetail.bind(null, request.id)}
              redirectTo="/payment-requests"
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Request details</CardTitle>
            {locked && (
              <CardDescription>
                {PAYMENT_REQUEST_STATUS_LABELS[request.status]} payment requests cannot be deleted.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Date" value={formatDate.calendarDate(request.requestDate)} />
              <Detail
                label="PO Ref"
                value={
                  request.purchaseOrder &&
                  (can("purchase_orders:view") ? (
                    <Link
                      href={`/purchase-orders/${request.purchaseOrder.id}`}
                      className="font-mono font-medium underline-offset-4 hover:underline"
                    >
                      {request.purchaseOrder.number}
                    </Link>
                  ) : (
                    <span className="font-mono">{request.purchaseOrder.number}</span>
                  ))
                }
              />
              <Detail label="In favor of" value={request.inFavorOf} />
              <Detail label="Project" value={`${request.project.code} – ${request.project.name}`} />
              <Detail label="Type of payment" value={paymentTypeLabel(request.paymentType)} />
              <Detail label="Priority" value={priorityLabel(request.priority)} />
              <Detail label="Invoice No" value={request.invoiceNo} />
              <Detail label="Quotation No" value={request.quotationNo} />
              <Detail label="Description" value={request.description} className="sm:col-span-2" />
              <Detail label="Note" value={request.note} className="sm:col-span-2" />
            </dl>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Amount</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="text-2xl font-semibold tabular-nums">{formatMoney(request.amount, request.currency)}</p>
              <p className="text-sm text-muted-foreground">{amountInWords(request.amount, request.currency)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Payment for</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {PAYMENT_ITEM_GROUPS.filter((group) => group.items.some((item) => ticked.has(item.key))).map((group) => (
                <div key={group.key} className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-sm font-medium">{group.label}:</span>
                  {group.items
                    .filter((item) => ticked.has(item.key))
                    .map((item) => (
                      <Badge key={item.key} variant="secondary">
                        {item.key === OTHERS_ITEM && request.otherDetails ? `Others – ${request.otherDetails}` : item.label}
                      </Badge>
                    ))}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
