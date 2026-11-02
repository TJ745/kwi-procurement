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
import { deleteGrn } from "@/lib/actions/grns";
import { listGrns, parseGrnStatus } from "@/lib/data/grns";
import { parseListParams } from "@/lib/data/list-params";
import { GRN_STATUSES, GRN_STATUS_LABELS, LOCKED_GRN_STATUSES, deliveryMethodLabel } from "@/lib/grn";
import { getNavItem } from "@/lib/navigation";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Goods Received Notes" };

const CREATE_LABEL = "New GRN";

export default async function Page({ searchParams }: PageProps<"/grn">) {
  const { can, formatDate } = await requirePermission("grns:view");
  const raw = await searchParams;
  const params = parseListParams(raw);
  const status = parseGrnStatus(raw.status);
  const result = await listGrns(params, status);
  const canCreate = can("grns:create");
  const canEdit = can("grns:edit");
  const canDelete = can("grns:delete");
  const item = getNavItem("/grn");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.title}
        description={item.description}
        actions={
          canCreate && (
            <Link href="/grn/new" className={buttonVariants()}>
              <Plus />
              {CREATE_LABEL}
            </Link>
          )
        }
      />
      <MasterDataList
        item={item}
        noun="goods received notes"
        params={params}
        result={result}
        canCreate={canCreate}
        createLabel={CREATE_LABEL}
        searchPlaceholder="Search GRN no, supplier, invoice, PO, MR or project"
        toolbar={<StatusFilter statuses={GRN_STATUSES} labels={GRN_STATUS_LABELS} />}
        filters={status ? { status } : {}}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">GRN No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="hidden md:table-cell">From</TableHead>
              <TableHead className="hidden lg:table-cell">PO Ref</TableHead>
              <TableHead className="hidden xl:table-cell">Delivered by</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Items</TableHead>
              <TableHead>Status</TableHead>
              {(canEdit || canDelete) && (
                <TableHead className="w-24 pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((grn) => (
              <TableRow key={grn.id}>
                <TableCell className="pl-4">
                  <Link href={`/grn/${grn.id}`} className="font-mono font-medium underline-offset-4 hover:underline">
                    {grn.number}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatDate.calendarDate(grn.receiptDate)}</TableCell>
                <TableCell className="hidden max-w-56 truncate md:table-cell">{grn.supplierName}</TableCell>
                <TableCell className="hidden font-mono lg:table-cell">{grn.purchaseOrder.number}</TableCell>
                <TableCell className="hidden xl:table-cell">{deliveryMethodLabel(grn.deliveredBy)}</TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">{grn._count.lines}</TableCell>
                <TableCell>
                  <StatusBadge status={grn.status} label={GRN_STATUS_LABELS[grn.status]} />
                </TableCell>
                {(canEdit || canDelete) && (
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1">
                      {canEdit && (
                        <Link
                          href={`/grn/${grn.id}/edit`}
                          aria-label={`Edit GRN ${grn.number}`}
                          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                        >
                          <Pencil />
                        </Link>
                      )}
                      {canDelete && !LOCKED_GRN_STATUSES.includes(grn.status) && (
                        <DeleteButton entityLabel="GRN" itemLabel={grn.number} action={deleteGrn.bind(null, grn.id)} />
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
