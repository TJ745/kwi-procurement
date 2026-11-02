import { renderToBuffer } from "@react-pdf/renderer";

import {
  PaymentRequestPdf,
  type PaymentRequestPdfData,
} from "@/components/payment-requests/payment-request-pdf";
import { amountInWords } from "@/lib/amount-in-words";
import { createDateFormatter } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { PAYMENT_REQUEST_STATUS_LABELS } from "@/lib/payment-request-options";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/session";

/** Printable A4 PDF of a payment request, for users who can view it. */
export async function GET(_request: Request, { params }: RouteContext<"/payment-requests/[id]/pdf">) {
  const context = await getAuthContext();
  if (!context) return new Response("Unauthorized", { status: 401 });
  if (context.user.mustChangePassword || !context.can("payment_requests:view")) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const [request, logo] = await Promise.all([
    prisma.paymentRequest.findUnique({
      where: { id },
      include: {
        project: { select: { code: true, name: true } },
        purchaseOrder: { select: { number: true } },
        createdBy: { select: { name: true } },
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

  const data: PaymentRequestPdfData = {
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
    date: formatDate.calendarDate(request.requestDate),
    status: PAYMENT_REQUEST_STATUS_LABELS[request.status],
    items: request.items,
    otherDetails: request.otherDetails,
    paymentType: request.paymentType,
    priority: request.priority,
    description: request.description,
    inFavorOf: request.inFavorOf,
    project: `${request.project.name} (${request.project.code})`,
    amount: formatMoney(request.amount, request.currency),
    amountInWords: amountInWords(request.amount, request.currency),
    invoiceNo: request.invoiceNo,
    quotationNo: request.quotationNo,
    poRef: request.purchaseOrder?.number ?? null,
    preparedBy: request.createdBy.name,
    generatedAt: formatDate.dateTime(new Date()),
  };

  const pdf = await renderToBuffer(<PaymentRequestPdf data={data} />);
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
