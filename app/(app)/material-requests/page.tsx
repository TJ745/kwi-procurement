import { Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DeleteButton } from "@/components/master-data/delete-button";
import { MasterDataList } from "@/components/master-data/master-data-list";
import { StatusBadge } from "@/components/status/status-badge";
import { StatusFilter } from "@/components/status/status-filter";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteMaterialRequest } from "@/lib/actions/material-requests";
import { parseListParams } from "@/lib/data/list-params";
import { listMaterialRequests, parseStatusFilter } from "@/lib/data/material-requests";
import { getNavItem } from "@/lib/navigation";
import { requirePermission } from "@/lib/session";
import {
  MATERIAL_REQUEST_STATUSES,
  MATERIAL_REQUEST_STATUS_LABELS,
} from "@/lib/validation/material-request";

export const metadata: Metadata = { title: "Material Requests" };

const CREATE_LABEL = "New request";

export default async function Page({ searchParams }: PageProps<"/material-requests">) {
  const { can, formatDate } = await requirePermission("material_requests:view");
  const raw = await searchParams;
  const params = parseListParams(raw);
  const status = parseStatusFilter(raw.status);
  const result = await listMaterialRequests(params, status);
  const canCreate = can("material_requests:create");
  const canEdit = can("material_requests:edit");
  const canDelete = can("material_requests:delete");
  const item = getNavItem("/material-requests");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.title}
        description={item.description}
        actions={
          canCreate && (
            <Link href="/material-requests/new" className={buttonVariants()}>
              <Plus />
              {CREATE_LABEL}
            </Link>
          )
        }
      />
      <MasterDataList
        item={item}
        noun="material requests"
        params={params}
        result={result}
        canCreate={canCreate}
        createLabel={CREATE_LABEL}
        searchPlaceholder="Search number, project, department, category or supplier"
        toolbar={<StatusFilter statuses={MATERIAL_REQUEST_STATUSES} labels={MATERIAL_REQUEST_STATUS_LABELS} />}
        filters={status ? { status } : {}}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Request No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="hidden md:table-cell">Project</TableHead>
              <TableHead className="hidden lg:table-cell">Requested by</TableHead>
              <TableHead className="hidden xl:table-cell">Category</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Lines</TableHead>
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
                    href={`/material-requests/${request.id}`}
                    className="font-mono font-medium underline-offset-4 hover:underline"
                  >
                    {request.number}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate.calendarDate(request.requestDate)}
                </TableCell>
                <TableCell className="hidden max-w-60 truncate md:table-cell">
                  {request.project.code} – {request.project.name}
                </TableCell>
                <TableCell className="hidden max-w-48 truncate lg:table-cell">
                  {request.department.name}
                </TableCell>
                <TableCell className="hidden max-w-48 truncate xl:table-cell">
                  {request.category.name}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">
                  {request._count.lines}
                </TableCell>
                <TableCell>
                  <StatusBadge status={request.status} label={MATERIAL_REQUEST_STATUS_LABELS[request.status]} />
                </TableCell>
                {(canEdit || canDelete) && (
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1">
                      {canEdit && (
                        <Link
                          href={`/material-requests/${request.id}/edit`}
                          aria-label={`Edit request ${request.number}`}
                          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                        >
                          <Pencil />
                        </Link>
                      )}
                      {canDelete && request.status !== "APPROVED" && (
                        <DeleteButton
                          entityLabel="material request"
                          itemLabel={request.number}
                          action={deleteMaterialRequest.bind(null, request.id)}
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
