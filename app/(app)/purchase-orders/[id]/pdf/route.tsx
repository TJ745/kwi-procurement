import { renderToBuffer } from "@react-pdf/renderer";

import {
  PurchaseOrderPdf,
  type PurchaseOrderPdfData,
} from "@/components/purchase-orders/purchase-order-pdf";
import { createDateFormatter, formatQuantity } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { loadPdfImages } from "@/lib/pdf-images";
import { prisma } from "@/lib/prisma";
import { fromSnapshot, PO_DOCUMENT_INCLUDE } from "@/lib/purchase-order-revisions";
import { getAuthContext } from "@/lib/session";
import { documentSignatories } from "@/lib/signatories";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/validation/purchase-order";
import { projectName } from "@/lib/projects";

/** Printable A4 PDF of a purchase order, for users who can view it. */
export async function GET(request: Request, { params }: RouteContext<"/purchase-orders/[id]/pdf">) {
  const context = await getAuthContext();
  if (!context) return new Response("Unauthorized", { status: 401 });
  if (context.user.mustChangePassword || !context.can("purchase_orders:view")) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await params;
  // ?revision=N prints a superseded version exactly as it was.
  const revisionParam = new URL(request.url).searchParams.get("revision");
  const revisionNo = revisionParam !== null && /^\d{1,4}$/.test(revisionParam) ? Number(revisionParam) : null;

  const [live, images] = await Promise.all([
    prisma.purchaseOrder.findUnique({ where: { id }, include: PO_DOCUMENT_INCLUDE }),
    loadPdfImages(),
  ]);
  if (!live) return new Response("Not found", { status: 404 });

  let order = live;
  let statusLabel = PURCHASE_ORDER_STATUS_LABELS[live.status];
  if (revisionNo !== null && revisionNo !== live.revision) {
    const saved = await prisma.purchaseOrderRevision.findUnique({
      where: { purchaseOrderId_revision: { purchaseOrderId: id, revision: revisionNo } },
      select: { snapshot: true },
    });
    if (!saved) return new Response("Not found", { status: 404 });
    order = fromSnapshot(saved.snapshot);
    statusLabel = `Superseded by ${live.number}`;
  }

  const { settings } = context;
  const formatDate = createDateFormatter(settings);
  const amount = (value: { toString(): string }) => formatMoney(value, order.currency, false);
  const orderDate = formatDate.calendarDate(order.orderDate);

  const data: PurchaseOrderPdfData = {
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
    number: order.number,
    date: orderDate,
    status: statusLabel,
    supplier: {
      name: order.supplierName,
      location: order.supplierAddress,
      contactName: order.supplierContactName,
      contactNumber: order.supplierContactNumber,
      email: order.supplierEmail,
      telephone: order.supplierTelephone,
      vat: order.supplierVat,
      quotationRef: order.quotationRef,
      invoiceNo: order.invoiceNo,
    },
    order: {
      orderDate,
      mrNumber: order.materialRequest?.number ?? null,
      orderedBy: order.department.name,
      projectName: projectName(order.project),
      projectCode: order.project.code,
      subject: order.category.name,
      deliverTo: order.deliverTo,
    },
    currency: order.currency,
    lines: order.lines.map((line) => ({
      lineNo: line.lineNo,
      name: line.name,
      unit: line.unit,
      quantity: formatQuantity(line.quantity),
      unitPrice: amount(line.unitPrice),
      total: amount(line.total),
    })),
    totals: {
      subtotal: amount(order.subtotal),
      discount: amount(order.discount),
      totalAfterDiscount: amount(order.subtotal.minus(order.discount)),
      vatRate: order.vatRate.toString(),
      vatAmount: amount(order.vatAmount),
      total: amount(order.total),
    },
    terms: order.terms,
    preparedBy: order.createdBy.name,
    generatedAt: formatDate.dateTime(new Date()),
    signatories: documentSignatories(settings.signatories, "purchaseOrder", order.createdBy.name),
  };

  const pdf = await renderToBuffer(<PurchaseOrderPdf data={data} />);
  const filename = order.number.replace(/[^A-Za-z0-9._-]/g, "_");

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
