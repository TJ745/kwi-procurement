import { Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DeleteButton } from "@/components/master-data/delete-button";
import { MasterDataList } from "@/components/master-data/master-data-list";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status/status-badge";
import { StatusFilter } from "@/components/status/status-filter";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deletePurchaseOrder } from "@/lib/actions/purchase-orders";
import { parseListParams } from "@/lib/data/list-params";
import { listPurchaseOrders, parsePurchaseOrderStatus } from "@/lib/data/purchase-orders";
import { formatMoney } from "@/lib/money";
import { getNavItem } from "@/lib/navigation";
import { requirePermission } from "@/lib/session";
import {
  LOCKED_PURCHASE_ORDER_STATUSES,
  PURCHASE_ORDER_STATUSES,
  PURCHASE_ORDER_STATUS_LABELS,
} from "@/lib/validation/purchase-order";

export const metadata: Metadata = { title: "Purchase Orders" };

const CREATE_LABEL = "New purchase order";

export default async function Page({ searchParams }: PageProps<"/purchase-orders">) {
  const { can, formatDate } = await requirePermission("purchase_orders:view");
  const raw = await searchParams;
  const params = parseListParams(raw);
  const status = parsePurchaseOrderStatus(raw.status);
  const result = await listPurchaseOrders(params, status);
  const canCreate = can("purchase_orders:create");
  const canEdit = can("purchase_orders:edit");
  const canDelete = can("purchase_orders:delete");
  const item = getNavItem("/purchase-orders");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.title}
        description={item.description}
        actions={
          canCreate && (
            <Link href="/purchase-orders/new" className={buttonVariants()}>
              <Plus />
              {CREATE_LABEL}
            </Link>
          )
        }
      />
      <MasterDataList
        item={item}
        noun="purchase orders"
        params={params}
        result={result}
        canCreate={canCreate}
        createLabel={CREATE_LABEL}
        searchPlaceholder="Search PO no, subject, supplier, project or MR no"
        toolbar={<StatusFilter statuses={PURCHASE_ORDER_STATUSES} labels={PURCHASE_ORDER_STATUS_LABELS} />}
        filters={status ? { status } : {}}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">PO No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="hidden md:table-cell">Supplier</TableHead>
              <TableHead className="hidden xl:table-cell">Subject</TableHead>
              <TableHead className="hidden lg:table-cell">MR No</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Total</TableHead>
              <TableHead>Status</TableHead>
              {(canEdit || canDelete) && (
                <TableHead className="w-24 pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="pl-4">
                  <Link
                    href={`/purchase-orders/${order.id}`}
                    className="font-mono font-medium underline-offset-4 hover:underline"
                  >
                    {order.number}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatDate.calendarDate(order.orderDate)}</TableCell>
                <TableCell className="hidden max-w-56 truncate md:table-cell">{order.supplierName}</TableCell>
                <TableCell className="hidden max-w-64 truncate xl:table-cell">{order.category.name}</TableCell>
                <TableCell className="hidden font-mono lg:table-cell">
                  {order.materialRequest?.number ?? <span className="font-sans text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="hidden text-right whitespace-nowrap tabular-nums sm:table-cell">
                  {formatMoney(order.total, order.currency)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={order.status} label={PURCHASE_ORDER_STATUS_LABELS[order.status]} />
                </TableCell>
                {(canEdit || canDelete) && (
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1">
                      {canEdit && (
                        <Link
                          href={`/purchase-orders/${order.id}/edit`}
                          aria-label={`Edit purchase order ${order.number}`}
                          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                        >
                          <Pencil />
                        </Link>
                      )}
                      {canDelete && !LOCKED_PURCHASE_ORDER_STATUSES.includes(order.status) && (
                        <DeleteButton
                          entityLabel="purchase order"
                          itemLabel={order.number}
                          action={deletePurchaseOrder.bind(null, order.id)}
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
