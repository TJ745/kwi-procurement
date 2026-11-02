import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import type { Metadata } from "next";

import { MaterialRequestForm } from "@/components/material-requests/material-request-form";
import { PageHeader } from "@/components/page-header";
import { createMaterialRequest } from "@/lib/actions/material-requests";
import { getMaterialRequestOptions } from "@/lib/data/material-requests";
import { previewDocumentNumber } from "@/lib/numbering";
import { requirePermission } from "@/lib/session";
import { EMPTY_LINE } from "@/lib/validation/material-request";

export const metadata: Metadata = { title: "New material request" };

export default async function Page() {
  const { settings } = await requirePermission("material_requests:create");
  const [options, nextNumber] = await Promise.all([
    getMaterialRequestOptions(),
    previewDocumentNumber("MATERIAL_REQUEST", settings.timeZone),
  ]);
  const today = format(new TZDate(new Date(), settings.timeZone), "yyyy-MM-dd");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New material request"
        description="The request number is assigned automatically when you save."
      />
      <MaterialRequestForm
        action={createMaterialRequest}
        options={options}
        nextNumberPreview={nextNumber ?? undefined}
        dateFormat={settings.dateFormat}
        cancelHref="/material-requests"
        defaultValues={{
          requestDate: today,
          projectId: "",
          departmentId: "",
          categoryId: "",
          supplierId: "",
          lines: [{ ...EMPTY_LINE }],
        }}
      />
    </div>
  );
}
