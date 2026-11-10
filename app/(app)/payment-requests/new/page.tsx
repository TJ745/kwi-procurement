import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { FileWarning } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PaymentRequestForm } from "@/components/payment-requests/payment-request-form";
import { buttonVariants } from "@/components/ui/button";
import { createPaymentRequest } from "@/lib/actions/payment-requests";
import { currencyOptions } from "@/lib/currencies";
import { getPaymentRequestOptions, getPurchaseOrderForPayment } from "@/lib/data/payment-requests";
import { formatMoney } from "@/lib/money";
import { previewDocumentNumber } from "@/lib/numbering";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "New payment request" };

export default async function Page({ searchParams }: PageProps<"/payment-requests/new">) {
  const { settings } = await requirePermission("payment_requests:create");
  const { po } = await searchParams;
  const poId = typeof po === "string" ? po : "";
  const [options, nextNumber, source] = await Promise.all([
    getPaymentRequestOptions(),
    previewDocumentNumber("PAYMENT_REQUEST", settings.timeZone),
    poId ? getPurchaseOrderForPayment(poId) : Promise.resolve(null),
  ]);

  if (poId && !source) {
    return (
      <EmptyState
        icon={FileWarning}
        title="This purchase order can't be paid against"
        description="Payment requests can only be raised against approved, issued or closed purchase orders."
      >
        <Link href={`/purchase-orders/${poId}`} className={buttonVariants({ variant: "outline" })}>
          Back to the purchase order
        </Link>
      </EmptyState>
    );
  }
  if (source && Number(source.balance.remaining) <= 0) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Nothing left to request"
        description={`Payment requests for ${source.balance.number} already cover its total of ${formatMoney(source.balance.total, source.currency)}.`}
      >
        <Link href={`/purchase-orders/${source.id}`} className={buttonVariants({ variant: "outline" })}>
          Back to the purchase order
        </Link>
      </EmptyState>
    );
  }

  const today = format(new TZDate(new Date(), settings.timeZone), "yyyy-MM-dd");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New payment request"
        description={
          source
            ? `Against purchase order ${source.balance.number}. The amount defaults to the remaining balance.`
            : "The PR number is assigned automatically when you save."
        }
      />
      <PaymentRequestForm
        // A different source PO must start a fresh form (the page instance
        // is reused between visits).
        key={source?.id ?? "standalone"}
        action={createPaymentRequest.bind(null, source?.id ?? "")}
        options={{ ...options, currencies: currencyOptions() }}
        nextNumberPreview={nextNumber ?? undefined}
        purchaseOrder={source?.balance}
        dateFormat={settings.dateFormat}
        cancelHref={source ? `/purchase-orders/${source.id}` : "/payment-requests"}
        defaultValues={{
          requestDate: today,
          projectId: source?.projectId ?? "",
          supplierId: source?.supplierId ?? "",
          inFavorOf: source?.supplierName ?? "",
          description: source ? `Payment against ${source.balance.number} – ${source.category.name}` : "",
          items: [],
          otherDetails: "",
          paymentType: "BANK_TRANSFER",
          priority: "NORMAL",
          currency: source?.currency ?? settings.currency,
          amount: source?.balance.remaining ?? "",
          invoiceNo: "",
          quotationNo: source?.quotationRef ?? "",
          note: "",
        }}
      />
    </div>
  );
}
