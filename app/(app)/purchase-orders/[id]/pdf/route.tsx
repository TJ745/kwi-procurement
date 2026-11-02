import { renderToBuffer } from "@react-pdf/renderer";

import {
  PurchaseOrderPdf,
  type PurchaseOrderPdfData,
} from "@/components/purchase-orders/purchase-order-pdf";
import { createDateFormatter, formatQuantity } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/session";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/validation/purchase-order";

/** Printable A4 PDF of a purchase order, for users who can view it. */
export async function GET(_request: Request, { params }: RouteContext<"/purchase-orders/[id]/pdf">) {
  const context = await getAuthContext();
  if (!context) return new Response("Unauthorized", { status: 401 });
  if (context.user.mustChangePassword || !context.can("purchase_orders:view")) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const [order, logo] = await Promise.all([
    prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        project: { select: { code: true, name: true } },
        department: { select: { name: true } },
        category: { select: { name: true } },
        materialRequest: { select: { number: true } },
        createdBy: { select: { name: true } },
        lines: { orderBy: { lineNo: "asc" } },
      },
    }),
    prisma.appSettings.findUnique({
      where: { id: 1 },
      select: { companyLogo: true, companyLogoType: true },
    }),
  ]);
  if (!order) return new Response("Not found", { status: 404 });

  const { settings } = context;
  const formatDate = createDateFormatter(settings);
  const amount = (value: { toString(): string }) => formatMoney(value, order.currency, false);
  const logoFormat =
    logo?.companyLogoType === "image/png" ? "png" : logo?.companyLogoType === "image/jpeg" ? "jpg" : null;
  const orderDate = formatDate.calendarDate(order.orderDate);

  const data: PurchaseOrderPdfData = {
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
    number: order.number,
    date: orderDate,
    status: PURCHASE_ORDER_STATUS_LABELS[order.status],
    supplier: {
      name: order.supplierName,
      location: order.supplierAddress,
      contactName: order.supplierContactName,
      contactNumber: order.supplierContactNumber,
      email: order.supplierEmail,
      telephone: order.supplierTelephone,
      vat: order.supplierVat,
      quotationRef: order.quotationRef,
    },
    order: {
      orderDate,
      mrNumber: order.materialRequest?.number ?? null,
      orderedBy: order.department.name,
      projectName: order.project.name,
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
      vatRate: order.vatRate.toString(),
      vatAmount: amount(order.vatAmount),
      total: amount(order.total),
    },
    terms: order.terms,
    preparedBy: order.createdBy.name,
    generatedAt: formatDate.dateTime(new Date()),
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
