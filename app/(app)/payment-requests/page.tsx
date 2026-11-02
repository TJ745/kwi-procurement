import { Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DeleteButton } from "@/components/master-data/delete-button";
import { MasterDataList } from "@/components/master-data/master-data-list";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status/status-badge";
import { StatusFilter } from "@/components/status/status-filter";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deletePaymentRequest } from "@/lib/actions/payment-requests";
import { parseListParams } from "@/lib/data/list-params";
import { listPaymentRequests, parsePaymentRequestStatus } from "@/lib/data/payment-requests";
import { formatMoney } from "@/lib/money";
import { getNavItem } from "@/lib/navigation";
import {
  LOCKED_PAYMENT_REQUEST_STATUSES,
  PAYMENT_REQUEST_STATUSES,
  PAYMENT_REQUEST_STATUS_LABELS,
  priorityLabel,
} from "@/lib/payment-request-options";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Payment Requests" };

const CREATE_LABEL = "New payment request";

export default async function Page({ searchParams }: PageProps<"/payment-requests">) {
  const { can, formatDate } = await requirePermission("payment_requests:view");
  const raw = await searchParams;
  const params = parseListParams(raw);
  const status = parsePaymentRequestStatus(raw.status);
  const result = await listPaymentRequests(params, status);
  const canCreate = can("payment_requests:create");
  const canEdit = can("payment_requests:edit");
  const canDelete = can("payment_requests:delete");
  const item = getNavItem("/payment-requests");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.title}
        description={item.description}
        actions={
          canCreate && (
            <Link href="/payment-requests/new" className={buttonVariants()}>
              <Plus />
              {CREATE_LABEL}
            </Link>
          )
        }
      />
      <MasterDataList
        item={item}
        noun="payment requests"
        params={params}
        result={result}
        canCreate={canCreate}
        createLabel={CREATE_LABEL}
        searchPlaceholder="Search PR no, in favor of, description, invoice, project or PO"
        toolbar={<StatusFilter statuses={PAYMENT_REQUEST_STATUSES} labels={PAYMENT_REQUEST_STATUS_LABELS} />}
        filters={status ? { status } : {}}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">PR No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="hidden md:table-cell">In favor of</TableHead>
              <TableHead className="hidden lg:table-cell">PO Ref</TableHead>
              <TableHead className="hidden xl:table-cell">Priority</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Amount</TableHead>
              <TableHead>Status</TableHead>
              {(canEdit || canDelete) && (
                <TableHead className="w-24 pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="pl-4">
                  <Link
                    href={`/payment-requests/${request.id}`}
                    className="font-mono font-medium underline-offset-4 hover:underline"
                  >
                    {request.number}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatDate.calendarDate(request.requestDate)}</TableCell>
                <TableCell className="hidden max-w-56 truncate md:table-cell">{request.inFavorOf}</TableCell>
                <TableCell className="hidden font-mono lg:table-cell">
                  {request.purchaseOrder?.number ?? <span className="font-sans text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <Badge variant={request.priority === "NORMAL" ? "outline" : "destructive"}>
                    {priorityLabel(request.priority)}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-right whitespace-nowrap tabular-nums sm:table-cell">
                  {formatMoney(request.amount, request.currency)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={request.status} label={PAYMENT_REQUEST_STATUS_LABELS[request.status]} />
                </TableCell>
                {(canEdit || canDelete) && (
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1">
                      {canEdit && (
                        <Link
                          href={`/payment-requests/${request.id}/edit`}
                          aria-label={`Edit payment request ${request.number}`}
                          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                        >
                          <Pencil />
                        </Link>
                      )}
                      {canDelete && !LOCKED_PAYMENT_REQUEST_STATUSES.includes(request.status) && (
                        <DeleteButton
                          entityLabel="payment request"
                          itemLabel={request.number}
                          action={deletePaymentRequest.bind(null, request.id)}
                        />
                      )}
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
