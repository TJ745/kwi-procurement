import Link from "next/link";

import type { DateFormatter } from "@/lib/format";
import { formatQuantity } from "@/lib/format";
import type { Prisma } from "@/lib/generated/prisma/client";
import { formatMoney } from "@/lib/money";
import { PAYMENT_REQUEST_STATUS_LABELS, priorityLabel } from "@/lib/payment-request-options";
import type {
  mrsAwaitingPo,
  paymentsSummary,
  pendingDeliveries,
  projectMaterials,
  spendSummary,
  supplierStatement,
} from "@/lib/reports";
import { paymentTermLabel } from "@/lib/validation/master-data";

type Common = { formatDate: DateFormatter; print?: boolean };

function Ref({ href, children, print }: { href: string; children: React.ReactNode; print?: boolean }) {
  if (print) return <span className="font-mono">{children}</span>;
  return (
    <Link href={href} className="font-mono font-medium underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 break-inside-avoid">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground print:text-neutral-600">{subtitle}</p>}
      </div>
      <div className="overflow-x-auto print:overflow-visible">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{children}</p>;
}

const money = (value: Prisma.Decimal | string, currency: string) => formatMoney(value.toString(), currency, false);

// --- Supplier statement --------------------------------------------------------

export function SupplierStatementView({
  data,
  formatDate,
  print,
}: Common & { data: NonNullable<Awaited<ReturnType<typeof supplierStatement>>> }) {
  const { supplier, sections } = data;
  return (
    <div className="flex flex-col gap-6">
      <div className="text-sm">
        <p className="text-base font-semibold">{supplier.name}</p>
        {supplier.address && <p className="whitespace-pre-line text-muted-foreground print:text-neutral-600">{supplier.address}</p>}
        <p className="text-muted-foreground print:text-neutral-600">
          {[supplier.vat && `VAT ${supplier.vat}`, paymentTermLabel(supplier.paymentTerm, supplier.creditDays)].filter(Boolean).join(" · ")}
        </p>
      </div>
      {sections.length === 0 && <Empty>No approved purchase orders or paid payment requests for this supplier.</Empty>}
      {sections.map((section) => (
        <Section key={section.currency} title={`Statement in ${section.currency}`} subtitle="Credit = purchase orders owed · Debit = payments made · Balance = amount owed">
          <table className="report-table min-w-[44rem]">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Reference</th>
                <th>Description</th>
                <th className="num">Debit</th>
                <th className="num">Credit</th>
                <th className="num">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="text-muted-foreground print:text-neutral-600">Opening balance</td>
                <td className="num">{money(section.opening, section.currency)}</td>
              </tr>
              {section.rows.map((row) => (
                <tr key={row.key}>
                  <td className="whitespace-nowrap">{formatDate.calendarDate(row.date)}</td>
                  <td>{row.type}</td>
                  <td>
                    <Ref href={row.href} print={print}>{row.reference}</Ref>
                  </td>
                  <td>{row.description}</td>
                  <td className="num">{row.debit.isZero() ? "" : money(row.debit, section.currency)}</td>
                  <td className="num">{row.credit.isZero() ? "" : money(row.credit, section.currency)}</td>
                  <td className="num">{money(row.balance, section.currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>Totals for the period · closing balance</td>
                <td className="num">{money(section.totalDebit, section.currency)}</td>
                <td className="num">{money(section.totalCredit, section.currency)}</td>
                <td className="num">{formatMoney(section.closing.toString(), section.currency)}</td>
              </tr>
            </tfoot>
          </table>
        </Section>
      ))}
    </div>
  );
}

// --- Materials used in projects ---------------------------------------------------

export function ProjectMaterialsView({
  data,
  formatDate,
}: Common & { data: Awaited<ReturnType<typeof projectMaterials>> }) {
  if (data.length === 0) return <Empty>No materials were accepted on approved GRNs in this period.</Empty>;
  return (
    <div className="flex flex-col gap-6">
      {data.map((project) => (
        <Section key={project.id} title={`${project.code} – ${project.name}`} subtitle={`${project.items.length} item${project.items.length === 1 ? "" : "s"}`}>
          <table className="report-table min-w-[40rem]">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Item</th>
                <th>Item code</th>
                <th>Unit</th>
                <th className="num">Accepted qty</th>
                <th className="num">GRNs</th>
                <th>Last received</th>
              </tr>
            </thead>
            <tbody>
              {project.items.map((item, index) => (
                <tr key={`${item.description}|${item.unit}`}>
                  <td>{index + 1}</td>
                  <td>{item.description}</td>
                  <td>{item.itemCodes}</td>
                  <td>{item.unit}</td>
                  <td className="num">{formatQuantity(item.accepted)}</td>
                  <td className="num">{item.grnCount}</td>
                  <td className="whitespace-nowrap">{formatDate.calendarDate(item.last)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      ))}
    </div>
  );
}

// --- Pending deliveries ---------------------------------------------------------

export function PendingDeliveriesView({
  data,
  formatDate,
  print,
}: Common & { data: Awaited<ReturnType<typeof pendingDeliveries>> }) {
  if (data.length === 0) return <Empty>Nothing is outstanding on approved or issued purchase orders.</Empty>;
  return (
    <table className="report-table min-w-[52rem]">
      <thead>
        <tr>
          <th>PO No</th>
          <th>Order date</th>
          <th>Supplier</th>
          <th>Project</th>
          <th>Item</th>
          <th>Unit</th>
          <th className="num">Ordered</th>
          <th className="num">Received</th>
          <th className="num">Outstanding</th>
        </tr>
      </thead>
      <tbody>
        {data.map((line) => (
          <tr key={line.id}>
            <td>
              <Ref href={`/purchase-orders/${line.purchaseOrder.id}`} print={print}>{line.purchaseOrder.number}</Ref>
            </td>
            <td className="whitespace-nowrap">{formatDate.calendarDate(line.purchaseOrder.orderDate)}</td>
            <td>{line.purchaseOrder.supplierName}</td>
            <td>{line.purchaseOrder.project.code}</td>
            <td>{line.name}</td>
            <td>{line.unit}</td>
            <td className="num">{formatQuantity(line.quantity)}</td>
            <td className="num">{formatQuantity(line.received)}</td>
            <td className="num font-medium">{formatQuantity(line.outstanding)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// --- Totals tables (payments, spend) ----------------------------------------------

type TotalsRow = { key: string; count: number; amounts: [string, Prisma.Decimal][] };

function TotalsTable({ label, rows, keyLabel }: { label: string; rows: TotalsRow[]; keyLabel?: (key: string) => string }) {
  return (
    <Section title={label}>
      {rows.length === 0 ? (
        <Empty>Nothing in this period.</Empty>
      ) : (
        <table className="report-table min-w-[28rem]">
          <thead>
            <tr>
              <th>{label.replace(/^By /, "")}</th>
              <th className="num">Count</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td>{keyLabel ? keyLabel(row.key) : row.key}</td>
                <td className="num">{row.count}</td>
                <td className="num">
                  {row.amounts.map(([currency, amount]) => (
                    <div key={currency}>{formatMoney(amount.toString(), currency)}</div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

export function PaymentsSummaryView({ data }: Common & { data: Awaited<ReturnType<typeof paymentsSummary>> }) {
  if (data.count === 0) return <Empty>No payment requests in this period.</Empty>;
  return (
    <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-2">
      <TotalsTable label="By status" rows={data.byStatus} keyLabel={(key) => PAYMENT_REQUEST_STATUS_LABELS[key as keyof typeof PAYMENT_REQUEST_STATUS_LABELS] ?? key} />
      <TotalsTable label="By priority" rows={data.byPriority} keyLabel={priorityLabel} />
      <TotalsTable label="By project" rows={data.byProject} />
      <TotalsTable label="By payee (in favor of)" rows={data.byPayee} />
    </div>
  );
}

export function SpendView({ data }: Common & { data: Awaited<ReturnType<typeof spendSummary>> }) {
  if (data.count === 0) return <Empty>No approved, issued or closed purchase orders in this period.</Empty>;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="text-muted-foreground print:text-neutral-600">{data.count} purchase orders · total</span>
        {data.overall.map(([currency, amount]) => (
          <span key={currency} className="font-semibold tabular-nums">{formatMoney(amount.toString(), currency)}</span>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-2">
        <TotalsTable label="By project" rows={data.byProject} />
        <TotalsTable label="By category" rows={data.byCategory} />
      </div>
    </div>
  );
}

// --- MRs awaiting a PO ---------------------------------------------------------------

export function MrsAwaitingPoView({
  data,
  formatDate,
  print,
}: Common & { data: Awaited<ReturnType<typeof mrsAwaitingPo>> }) {
  if (data.length === 0) return <Empty>Every approved material request has a purchase order.</Empty>;
  return (
    <table className="report-table min-w-[44rem]">
      <thead>
        <tr>
          <th>Request No</th>
          <th>Date</th>
          <th className="num">Age (days)</th>
          <th>Project</th>
          <th>Requested by</th>
          <th>Category</th>
          <th className="num">Lines</th>
        </tr>
      </thead>
      <tbody>
        {data.map((request) => (
          <tr key={request.id}>
            <td>
              <Ref href={`/material-requests/${request.id}`} print={print}>{request.number}</Ref>
            </td>
            <td className="whitespace-nowrap">{formatDate.calendarDate(request.requestDate)}</td>
            <td className="num font-medium">{request.ageDays}</td>
            <td>{`${request.project.code} – ${request.project.name}`}</td>
            <td>{request.department.name}</td>
            <td>{request.category.name}</td>
            <td className="num">{request._count.lines}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
