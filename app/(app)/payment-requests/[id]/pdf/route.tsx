import { renderToBuffer } from "@react-pdf/renderer";

import {
  PaymentRequestPdf,
  type PaymentRequestPdfData,
} from "@/components/payment-requests/payment-request-pdf";
import { amountInWords } from "@/lib/amount-in-words";
import { createDateFormatter } from "@/lib/format";
import { type PaymentRequestStatus, Prisma } from "@/lib/generated/prisma/client";
import { formatMoney } from "@/lib/money";
import { PAYMENT_REQUEST_STATUS_LABELS } from "@/lib/payment-request-options";
import { loadPdfImages } from "@/lib/pdf-images";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/session";

function ordinal(n: number) {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${suffix}`;
}

type PoWithPayments = {
  number: string;
  total: Prisma.Decimal;
  currency: string;
  paymentRequests: { id: string; number: string; requestDate: Date; status: PaymentRequestStatus; amount: Prisma.Decimal }[];
};

/**
 * Instalments against the PO up to and including this request, with the
 * running balance. Null when there is no PO or this is one full payment.
 */
function paymentHistory(
  requestId: string,
  po: PoWithPayments | null,
  formatDate: ReturnType<typeof createDateFormatter>,
): PaymentRequestPdfData["history"] {
  if (!po) return null;
  const index = po.paymentRequests.findIndex((payment) => payment.id === requestId);
  const payments = po.paymentRequests.slice(0, index + 1);
  if (payments.length === 1 && payments[0].amount.gte(po.total)) return null;

  const money = (value: Prisma.Decimal) => formatMoney(value, po.currency, false);
  let requested = new Prisma.Decimal(0);
  const rows = payments.map((payment, i) => {
    // A rejected request (only ever this one) does not reduce the balance.
    if (payment.status !== "REJECTED") requested = requested.plus(payment.amount);
    return {
      label: `${ordinal(i + 1)} Payment`,
      number: payment.number,
      date: formatDate.calendarDate(payment.requestDate),
      status: PAYMENT_REQUEST_STATUS_LABELS[payment.status],
      amount: money(payment.amount),
      balance: money(po.total.minus(requested)),
      current: payment.id === requestId,
    };
  });
  return {
    poNumber: po.number,
    poTotal: formatMoney(po.total, po.currency),
    rows,
    totalRequested: money(requested),
    remaining: money(po.total.minus(requested)),
  };
}

/** Printable A4 PDF of a payment request, for users who can view it. */
export async function GET(_request: Request, { params }: RouteContext<"/payment-requests/[id]/pdf">) {
  const context = await getAuthContext();
  if (!context) return new Response("Unauthorized", { status: 401 });
  if (context.user.mustChangePassword || !context.can("payment_requests:view")) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const [request, images] = await Promise.all([
    prisma.paymentRequest.findUnique({
      where: { id },
      include: {
        project: { select: { code: true, name: true } },
        purchaseOrder: {
          select: {
            number: true,
            total: true,
            currency: true,
            // Every instalment that counts against the PO, plus this request even if rejected.
            paymentRequests: {
              where: { OR: [{ status: { not: "REJECTED" } }, { id }] },
              orderBy: [{ requestDate: "asc" }, { number: "asc" }],
              select: { id: true, number: true, requestDate: true, status: true, amount: true },
            },
          },
        },
        createdBy: { select: { name: true } },
      },
    }),
    loadPdfImages(),
  ]);
  if (!request) return new Response("Not found", { status: 404 });

  const { settings } = context;
  const formatDate = createDateFormatter(settings);

  const data: PaymentRequestPdfData = {
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
    note: request.note,
    history: paymentHistory(request.id, request.purchaseOrder, formatDate),
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
