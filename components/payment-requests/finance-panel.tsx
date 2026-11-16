"use client";

import { Loader2 } from "lucide-react";

import { DateField } from "@/components/forms/date-field";
import { TextField } from "@/components/forms/text-field";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import type { ActionResult } from "@/lib/action-result";
import {
  type PaymentRequestFinanceInput,
  paymentRequestFinanceSchema,
} from "@/lib/validation/payment-request";

type FinancePanelProps = {
  action: (input: PaymentRequestFinanceInput) => Promise<ActionResult>;
  defaultValues: PaymentRequestFinanceInput;
  dateFormat: string;
};

/** Sets when the request and its invoice went to Finance, and the PO Tracker remarks. */
export function FinancePanel({ action, defaultValues, dateFormat }: FinancePanelProps) {
  const { form, onSubmit } = useActionForm({
    schema: paymentRequestFinanceSchema,
    defaultValues,
    action,
    resetOnSuccess: true,
  });
  const { isSubmitting, isDirty } = form.formState;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Finance</CardTitle>
        <CardDescription>
          When this request and its invoice were submitted to Finance, and remarks for the PO Tracker.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <DateField
              control={form.control}
              name="financeSubmittedOn"
              label="PR submitted to Finance"
              displayFormat={dateFormat}
              clearable
            />
            <DateField
              control={form.control}
              name="invoiceSubmittedOn"
              label="Invoice submitted to Finance"
              displayFormat={dateFormat}
              clearable
            />
            <div className="sm:col-span-2">
              <TextField
                control={form.control}
                name="trackerRemarks"
                label="Remarks (PO Tracker only)"
                multiline
              />
            </div>
          </FieldGroup>
          <Button type="submit" disabled={isSubmitting || !isDirty} className="w-fit">
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
