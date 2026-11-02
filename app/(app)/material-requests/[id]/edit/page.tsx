import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MaterialRequestForm } from "@/components/material-requests/material-request-form";
import { PageHeader } from "@/components/page-header";
import { updateMaterialRequest } from "@/lib/actions/material-requests";
import { getMaterialRequest, getMaterialRequestOptions } from "@/lib/data/material-requests";
import { toIsoDate } from "@/lib/format";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Edit material request" };

export default async function Page({ params }: PageProps<"/material-requests/[id]/edit">) {
  const { settings } = await requirePermission("material_requests:edit");
  const { id } = await params;
  const [request, options] = await Promise.all([getMaterialRequest(id), getMaterialRequestOptions()]);
  if (!request) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Edit ${request.number}`} description="Update the request details and item lines." />
      <MaterialRequestForm
        // Remount when the request changed since this page was last shown.
        key={request.updatedAt.getTime()}
        action={updateMaterialRequest.bind(null, request.id)}
        options={options}
        number={request.number}
        dateFormat={settings.dateFormat}
        cancelHref={`/material-requests/${request.id}`}
        defaultValues={{
          requestDate: toIsoDate(request.requestDate),
          projectId: request.projectId,
          departmentId: request.departmentId,
          categoryId: request.categoryId,
          supplierId: request.supplierId ?? "",
          lines: request.lines.map((line) => ({
            name: line.name,
            unit: line.unit,
            quantity: line.quantity.toString(),
            remarks: line.remarks ?? "",
          })),
        }}
      />
    </div>
  );
}
