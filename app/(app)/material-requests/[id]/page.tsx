import { ArrowLeft, Pencil, Printer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/master-data/delete-button";
import { StatusBadge } from "@/components/material-requests/status-badge";
import { StatusMenu } from "@/components/material-requests/status-menu";
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
  deleteMaterialRequestFromDetail,
  setMaterialRequestStatus,
} from "@/lib/actions/material-requests";
import { getMaterialRequest } from "@/lib/data/material-requests";
import { formatQuantity } from "@/lib/format";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Material request" };

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm wrap-break-word">
        {value || <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}

export default async function Page({ params }: PageProps<"/material-requests/[id]">) {
  const { can, formatDate } = await requirePermission("material_requests:view");
  const { id } = await params;
  const request = await getMaterialRequest(id);
  if (!request) notFound();
  const approved = request.status === "APPROVED";

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/material-requests"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 w-fit" })}
      >
        <ArrowLeft />
        Back to material requests
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-tight">{request.number}</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Created by {request.createdBy.name} on {formatDate.dateTime(request.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/material-requests/${request.id}/pdf`}
            target="_blank"
            rel="noopener"
            className={buttonVariants({ variant: "outline" })}
          >
            <Printer />
            Print PDF
          </a>
          {can("material_requests:status") && (
            <StatusMenu status={request.status} action={setMaterialRequestStatus.bind(null, request.id)} />
          )}
          {can("material_requests:edit") && (
            <Link href={`/material-requests/${request.id}/edit`} className={buttonVariants({ variant: "outline" })}>
              <Pencil />
              Edit
            </Link>
          )}
          {can("material_requests:delete") && !approved && (
            <DeleteButton
              variant="button"
              entityLabel="material request"
              itemLabel={request.number}
              action={deleteMaterialRequestFromDetail.bind(null, request.id)}
              redirectTo="/material-requests"
            />
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request details</CardTitle>
          {approved && <CardDescription>Approved requests cannot be deleted.</CardDescription>}
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Request date" value={formatDate.calendarDate(request.requestDate)} />
            <Detail label="Project" value={`${request.project.code} – ${request.project.name}`} />
            <Detail label="Requested by (Department)" value={request.department.name} />
            <Detail label="Category" value={request.category.name} />
            <Detail label="Supplier" value={request.supplier?.name} />
            <Detail label="Last updated" value={formatDate.dateTime(request.updatedAt)} />
          </dl>
        </CardContent>
      </Card>

      <Card className="gap-0 pb-0">
        <CardHeader className="border-b">
          <CardTitle>Items</CardTitle>
          <CardDescription>
            {request.lines.length} line{request.lines.length === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 pl-4">Sr No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-28">Unit</TableHead>
              <TableHead className="w-28 text-right">Quantity</TableHead>
              <TableHead className="hidden pr-4 md:table-cell">Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {request.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="pl-4 tabular-nums">{line.lineNo}</TableCell>
                <TableCell className="whitespace-normal">
                  {line.name}
                  {line.remarks && (
                    <span className="block text-xs text-muted-foreground md:hidden">{line.remarks}</span>
                  )}
                </TableCell>
                <TableCell>{line.unit}</TableCell>
                <TableCell className="text-right tabular-nums">{formatQuantity(line.quantity)}</TableCell>
                <TableCell className="hidden pr-4 whitespace-normal text-muted-foreground md:table-cell">
                  {line.remarks}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
