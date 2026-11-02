import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { PaymentRequestForm } from "@/components/payment-requests/payment-request-form";
import { updatePaymentRequest } from "@/lib/actions/payment-requests";
import { currencyOptions } from "@/lib/currencies";
import {
  getPaymentRequest,
  getPaymentRequestOptions,
  getPurchaseOrderBalance,
} from "@/lib/data/payment-requests";
import { toIsoDate } from "@/lib/format";
import type { PaymentItemKey, PaymentPriorityValue, PaymentTypeValue } from "@/lib/payment-request-options";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Edit payment request" };

export default async function Page({ params }: PageProps<"/payment-requests/[id]/edit">) {
  const { settings } = await requirePermission("payment_requests:edit");
  const { id } = await params;
  const [request, options] = await Promise.all([getPaymentRequest(id), getPaymentRequestOptions()]);
  if (!request) notFound();
  // Balance shown excludes this request, so its own amount can be re-entered.
  const balance = request.purchaseOrderId
    ? await getPurchaseOrderBalance(request.purchaseOrderId, request.id)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Edit ${request.number}`} description="Update the payment details." />
      <PaymentRequestForm
        // Remount when the request changed since this page was last shown.
        key={request.updatedAt.getTime()}
        action={updatePaymentRequest.bind(null, request.id)}
        options={{ ...options, currencies: currencyOptions() }}
        number={request.number}
        purchaseOrder={balance ?? undefined}
        dateFormat={settings.dateFormat}
        cancelHref={`/payment-requests/${request.id}`}
        defaultValues={{
          requestDate: toIsoDate(request.requestDate),
          projectId: request.projectId,
          supplierId: request.supplierId ?? "",
          inFavorOf: request.inFavorOf,
          description: request.description,
          items: request.items as PaymentItemKey[],
          otherDetails: request.otherDetails ?? "",
          paymentType: request.paymentType as PaymentTypeValue,
          priority: request.priority as PaymentPriorityValue,
          currency: request.currency,
          amount: request.amount.toString(),
          invoiceNo: request.invoiceNo ?? "",
          quotationNo: request.quotationNo ?? "",
        }}
      />
    </div>
  );
}
