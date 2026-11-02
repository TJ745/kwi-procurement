import { renderToBuffer } from "@react-pdf/renderer";

import {
  MaterialRequestPdf,
  type MaterialRequestPdfData,
} from "@/components/material-requests/material-request-pdf";
import { createDateFormatter, formatQuantity } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/session";

/** Printable A4 PDF of a material request, for users who can view it. */
export async function GET(_request: Request, { params }: RouteContext<"/material-requests/[id]/pdf">) {
  const context = await getAuthContext();
  if (!context) return new Response("Unauthorized", { status: 401 });
  if (context.user.mustChangePassword || !context.can("material_requests:view")) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const [request, logo] = await Promise.all([
    prisma.materialRequest.findUnique({
      where: { id },
      include: {
        project: { select: { code: true, name: true } },
        department: { select: { name: true } },
        category: { select: { name: true } },
        supplier: { select: { name: true } },
        createdBy: { select: { name: true } },
        lines: { orderBy: { lineNo: "asc" } },
      },
    }),
    prisma.appSettings.findUnique({
      where: { id: 1 },
      select: { companyLogo: true, companyLogoType: true },
    }),
  ]);
  if (!request) return new Response("Not found", { status: 404 });

  const { settings } = context;
  const formatDate = createDateFormatter(settings);
  const logoFormat =
    logo?.companyLogoType === "image/png" ? "png" : logo?.companyLogoType === "image/jpeg" ? "jpg" : null;

  const data: MaterialRequestPdfData = {
    company: {
      name: settings.companyName,
      address: settings.companyAddress,
      vat: settings.companyVat,
      cr: settings.companyCr,
      phone: settings.companyPhone,
      email: settings.companyEmail,
      logo:
        logo?.companyLogo && logoFormat
          ? { data: Buffer.from(logo.companyLogo), format: logoFormat }
          : null,
    },
    number: request.number,
    requestDate: formatDate.calendarDate(request.requestDate),
    status: request.status,
    project: `${request.project.code} – ${request.project.name}`,
    department: request.department.name,
    category: request.category.name,
    supplier: request.supplier?.name ?? null,
    createdBy: request.createdBy.name,
    generatedAt: formatDate.dateTime(new Date()),
    lines: request.lines.map((line) => ({
      lineNo: line.lineNo,
      name: line.name,
      unit: line.unit,
      quantity: formatQuantity(line.quantity),
      remarks: line.remarks,
    })),
  };

  const pdf = await renderToBuffer(<MaterialRequestPdf data={data} />);
  const filename = request.number.replace(/[^A-Za-z0-9._-]/g, "_");

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
