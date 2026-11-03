import { renderToBuffer } from "@react-pdf/renderer";

import { GrnPdf, type GrnPdfData } from "@/components/grns/grn-pdf";
import { createDateFormatter, formatQuantity } from "@/lib/format";
import { GRN_STATUS_LABELS } from "@/lib/grn";
import { loadPdfImages } from "@/lib/pdf-images";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/session";

/** Printable A4 (landscape) PDF of a GRN, for users who can view it. */
export async function GET(_request: Request, { params }: RouteContext<"/grn/[id]/pdf">) {
  const context = await getAuthContext();
  if (!context) return new Response("Unauthorized", { status: 401 });
  if (context.user.mustChangePassword || !context.can("grns:view")) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const [grn, images] = await Promise.all([
    prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        project: { select: { code: true, name: true } },
        department: { select: { name: true } },
        purchaseOrder: { select: { number: true, materialRequest: { select: { number: true } } } },
        createdBy: { select: { name: true } },
        lines: { orderBy: { lineNo: "asc" }, include: { department: { select: { name: true } } } },
      },
    }),
    loadPdfImages(),
  ]);
  if (!grn) return new Response("Not found", { status: 404 });

  const { settings } = context;
  const formatDate = createDateFormatter(settings);
  const q = (value: { toString(): string }) => formatQuantity(value);

  const data: GrnPdfData = {
    company: {
      name: settings.companyName,
      address: settings.companyAddress,
      vat: settings.companyVat,
      cr: settings.companyCr,
      phone: settings.companyPhone,
      email: settings.companyEmail,
      logo: images.logo,
      footer: images.footer,
    },
    number: grn.number,
    date: formatDate.calendarDate(grn.receiptDate),
    status: GRN_STATUS_LABELS[grn.status],
    supplierName: grn.supplierName,
    supplierAddress: grn.supplierAddress,
    mrRef: grn.purchaseOrder.materialRequest?.number ?? null,
    poRef: grn.purchaseOrder.number,
    orderedBy: grn.department.name,
    projectName: grn.project.name,
    projectCode: grn.project.code,
    invoiceNo: grn.invoiceNo,
    deliveredBy: grn.deliveredBy,
    lines: grn.lines.map((line) => ({
      lineNo: line.lineNo,
      itemCode: line.itemCode,
      description: line.description,
      department: line.department.name,
      unit: line.unit,
      ordered: q(line.orderedQty),
      received: q(line.receivedQty),
      short: q(line.shortQty),
      excess: q(line.excessQty),
      rejected: q(line.rejectedQty),
      accepted: q(line.acceptedQty),
    })),
    remarks: grn.remarks,
    preparedBy: grn.createdBy.name,
    generatedAt: formatDate.dateTime(new Date()),
  };

  const pdf = await renderToBuffer(<GrnPdf data={data} />);
  const filename = grn.number.replace(/[^A-Za-z0-9._-]/g, "_");

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
