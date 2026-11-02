import "server-only";

import { TZDate } from "@date-fns/tz";
import { addMonths, differenceInCalendarDays, format } from "date-fns";

import { Prisma } from "@/lib/generated/prisma/client";
import { GRN_STATUS_LABELS } from "@/lib/grn";
import { PAYMENT_REQUEST_STATUS_LABELS, PAYMENT_REQUEST_STATUSES } from "@/lib/payment-request-options";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { MATERIAL_REQUEST_STATUS_LABELS } from "@/lib/validation/material-request";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/validation/purchase-order";

const ZERO = new Prisma.Decimal(0);
const COMMITTED_PO = ["APPROVED", "ISSUED", "CLOSED"] as const;

/** Month keys ("yyyy-MM") for the last `count` months, oldest first, in the configured time zone. */
function recentMonths(timeZone: string, count: number) {
  const now = new TZDate(new Date(), timeZone);
  return Array.from({ length: count }, (_, i) => {
    const month = addMonths(now, i - count + 1);
    return { key: format(month, "yyyy-MM"), label: format(month, "MMM"), long: format(month, "MMMM yyyy") };
  });
}
/** First day of a "yyyy-MM" month, as a UTC calendar date (for `date` columns). */
const monthStart = (key: string) => new Date(`${key}-01T00:00:00.000Z`);
const monthOfDate = (date: Date) => date.toISOString().slice(0, 7); // calendar (date) columns
const monthOfTime = (date: Date, timeZone: string) => format(new TZDate(date, timeZone), "yyyy-MM");

function countByMonth(dates: Date[], months: { key: string }[], keyOf: (date: Date) => string) {
  const counts = new Map(months.map((m) => [m.key, 0]));
  for (const date of dates) {
    const key = keyOf(date);
    if (counts.has(key)) counts.set(key, counts.get(key)! + 1);
  }
  return months.map((m) => counts.get(m.key)!);
}

export type Tile = {
  key: string;
  label: string;
  value: string;
  hint: string;
  href: string;
  /** Last 6 months, oldest first; the final point is the current month. */
  trend?: { values: number[]; labels: string[] };
  /** Change this month vs last month, e.g. "+3 vs last month". */
  delta?: { text: string; direction: "up" | "down" | "flat" };
};

function countDelta(values: number[]): Tile["delta"] {
  const current = values.at(-1) ?? 0;
  const previous = values.at(-2) ?? 0;
  const diff = current - previous;
  return {
    text: `${diff > 0 ? "+" : ""}${diff} vs last month`,
    direction: diff > 0 ? "up" : diff < 0 ? "down" : "flat",
  };
}

/** KPI tiles for the modules the user can view. */
export async function getKpiTiles(): Promise<Tile[]> {
  const { can, settings } = await requireUser();
  const months = recentMonths(settings.timeZone, 6);
  const since = monthStart(months[0].key);
  const labels = months.map((m) => m.label);
  const currency = settings.currency;
  const tiles: Promise<Tile>[] = [];

  if (can("material_requests:view")) {
    tiles.push(
      Promise.all([
        prisma.materialRequest.count({ where: { status: { in: ["DRAFT", "SUBMITTED"] } } }),
        prisma.materialRequest.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      ]).then(([open, created]) => {
        const values = countByMonth(created.map((r) => r.createdAt), months, (d) => monthOfTime(d, settings.timeZone));
        return { key: "mr", label: "Open material requests", value: String(open), hint: "Draft or submitted", href: "/material-requests", trend: { values, labels }, delta: countDelta(values) };
      }),
    );
  }
  if (can("purchase_orders:view")) {
    tiles.push(
      Promise.all([
        prisma.purchaseOrder.count({ where: { status: "SUBMITTED" } }),
        prisma.purchaseOrder.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      ]).then(([awaiting, created]) => {
        const values = countByMonth(created.map((r) => r.createdAt), months, (d) => monthOfTime(d, settings.timeZone));
        return { key: "po", label: "POs awaiting approval", value: String(awaiting), hint: "Submitted", href: "/purchase-orders?status=SUBMITTED", trend: { values, labels }, delta: countDelta(values) };
      }),
    );
    tiles.push(
      prisma.purchaseOrder
        .findMany({
          where: { status: { in: [...COMMITTED_PO] }, orderDate: { gte: since } },
          select: { orderDate: true, total: true, currency: true },
        })
        .then((orders) => {
          const sums = new Map(months.map((m) => [m.key, ZERO]));
          let other = 0;
          for (const o of orders) {
            if (o.currency !== currency) { other++; continue; }
            const key = monthOfDate(o.orderDate);
            if (sums.has(key)) sums.set(key, sums.get(key)!.plus(o.total));
          }
          const values = months.map((m) => sums.get(m.key)!.toNumber());
          const current = sums.get(months.at(-1)!.key)!;
          const previous = sums.get(months.at(-2)!.key)!;
          const pct = previous.isZero() ? null : current.minus(previous).div(previous).mul(100).toDecimalPlaces(0).toNumber();
          return {
            key: "spend",
            label: "Spend this month",
            value: compactMoney(current, currency),
            hint: other ? `Approved POs · ${other} in other currencies excluded` : "Approved, issued & closed POs",
            href: "/reports/spend",
            trend: { values, labels },
            delta: pct === null
              ? { text: "No spend last month", direction: "flat" as const }
              : { text: `${pct > 0 ? "+" : ""}${pct}% vs last month`, direction: pct > 0 ? ("up" as const) : pct < 0 ? ("down" as const) : ("flat" as const) },
          };
        }),
    );
    tiles.push(
      pendingDeliveryLines().then(({ lines, orders }) => ({
        key: "deliveries",
        label: "Pending deliveries",
        value: String(lines),
        hint: `${orders} purchase order${orders === 1 ? "" : "s"} not fully received`,
        href: "/reports/pending-deliveries",
      })),
    );
  }
  if (can("payment_requests:view")) {
    tiles.push(
      prisma.paymentRequest
        .findMany({ where: { status: { in: ["SUBMITTED", "APPROVED"] } }, select: { amount: true, currency: true } })
        .then((requests) => {
          const mine = requests.filter((r) => r.currency === currency);
          const total = mine.reduce((sum, r) => sum.plus(r.amount), ZERO);
          const other = requests.length - mine.length;
          return {
            key: "payments",
            label: "Payments pending",
            value: compactMoney(total, currency),
            hint: `${requests.length} submitted or approved${other ? ` · ${other} in other currencies` : ""}`,
            href: "/payment-requests?status=APPROVED",
          };
        }),
    );
  }
  return Promise.all(tiles);
}

/** e.g. "23.1K KWD" / "950.000 KWD" — compact for headline values. */
function compactMoney(value: Prisma.Decimal, currency: string) {
  const number = value.toNumber();
  if (Math.abs(number) < 10_000) {
    return `${new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(number)} ${currency}`;
  }
  return `${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(number)} ${currency}`;
}

/** Outstanding PO lines on approved/issued POs (any non-rejected GRN counts as received). */
async function pendingDeliveryLines() {
  const where = { status: { in: ["APPROVED", "ISSUED"] } } satisfies Prisma.PurchaseOrderWhereInput;
  const [lines, received] = await Promise.all([
    prisma.purchaseOrderLine.findMany({ where: { purchaseOrder: where }, select: { id: true, quantity: true, purchaseOrderId: true } }),
    prisma.goodsReceiptLine.groupBy({
      by: ["purchaseOrderLineId"],
      where: { goodsReceipt: { status: { not: "REJECTED" }, purchaseOrder: where } },
      _sum: { acceptedQty: true },
    }),
  ]);
  const got = new Map(received.map((r) => [r.purchaseOrderLineId, r._sum.acceptedQty ?? ZERO]));
  const open = lines.filter((line) => line.quantity.greaterThan(got.get(line.id) ?? ZERO));
  return { lines: open.length, orders: new Set(open.map((l) => l.purchaseOrderId)).size };
}

// --- Spend per month (12 months) -----------------------------------------------

export async function getSpendByMonth() {
  const { can, settings } = await requireUser();
  if (!can("purchase_orders:view")) return null;
  const months = recentMonths(settings.timeZone, 12);
  const orders = await prisma.purchaseOrder.findMany({
    where: { status: { in: [...COMMITTED_PO] }, orderDate: { gte: monthStart(months[0].key) } },
    select: { orderDate: true, total: true, currency: true },
  });
  const sums = new Map(months.map((m) => [m.key, ZERO]));
  let other = 0;
  for (const o of orders) {
    if (o.currency !== settings.currency) { other++; continue; }
    const key = monthOfDate(o.orderDate);
    if (sums.has(key)) sums.set(key, sums.get(key)!.plus(o.total));
  }
  return {
    currency: settings.currency,
    excluded: other,
    points: months.map((m) => ({ key: m.key, label: m.label, long: m.long, value: sums.get(m.key)!.toNumber(), display: sums.get(m.key)!.toString() })),
  };
}

// --- Top projects by spend (12 months) ------------------------------------------

export async function getTopProjects() {
  const { can, settings } = await requireUser();
  if (!can("purchase_orders:view")) return null;
  const months = recentMonths(settings.timeZone, 12);
  const orders = await prisma.purchaseOrder.findMany({
    where: { status: { in: [...COMMITTED_PO] }, orderDate: { gte: monthStart(months[0].key) }, currency: settings.currency },
    select: { total: true, project: { select: { id: true, code: true, name: true } } },
  });
  const sums = new Map<string, { label: string; total: Prisma.Decimal }>();
  for (const o of orders) {
    const entry = sums.get(o.project.id) ?? { label: `${o.project.code} – ${o.project.name}`, total: ZERO };
    entry.total = entry.total.plus(o.total);
    sums.set(o.project.id, entry);
  }
  return {
    currency: settings.currency,
    rows: [...sums.values()]
      .sort((a, b) => b.total.comparedTo(a.total))
      .slice(0, 5)
      .map((row) => ({ label: row.label, value: row.total.toNumber(), display: row.total.toString() })),
  };
}

// --- Payment requests by status ---------------------------------------------------

export async function getPaymentStatus() {
  const { can } = await requireUser();
  if (!can("payment_requests:view")) return null;
  const groups = await prisma.paymentRequest.groupBy({ by: ["status"], _count: { _all: true } });
  const counts = new Map(groups.map((g) => [g.status, g._count._all]));
  return PAYMENT_REQUEST_STATUSES.map((status) => ({
    key: status,
    label: PAYMENT_REQUEST_STATUS_LABELS[status],
    value: counts.get(status) ?? 0,
    href: `/payment-requests?status=${status}`,
  })).sort((a, b) => b.value - a.value);
}

// --- Pipeline (12 months) ---------------------------------------------------------

export async function getPipeline() {
  const { can, settings } = await requireUser();
  const months = recentMonths(settings.timeZone, 12);
  const [year, month] = months[0].key.split("-").map(Number);
  // Midnight on the 1st of the first month, in the configured time zone.
  const since = new TZDate(year, month - 1, 1, settings.timeZone);
  const steps: Promise<{ key: string; label: string; value: number; href: string }>[] = [];
  if (can("material_requests:view")) {
    steps.push(prisma.materialRequest.count({ where: { createdAt: { gte: since }, status: { not: "REJECTED" } } }).then((value) => ({ key: "mr", label: "Material requests", value, href: "/material-requests" })));
  }
  if (can("purchase_orders:view")) {
    steps.push(prisma.purchaseOrder.count({ where: { createdAt: { gte: since }, status: { not: "REJECTED" } } }).then((value) => ({ key: "po", label: "Purchase orders", value, href: "/purchase-orders" })));
  }
  if (can("grns:view")) {
    steps.push(prisma.goodsReceipt.count({ where: { createdAt: { gte: since }, status: "APPROVED" } }).then((value) => ({ key: "grn", label: "Goods received (approved)", value, href: "/grn?status=APPROVED" })));
  }
  if (can("payment_requests:view")) {
    steps.push(prisma.paymentRequest.count({ where: { createdAt: { gte: since }, status: "PAID" } }).then((value) => ({ key: "paid", label: "Payments made", value, href: "/payment-requests?status=PAID" })));
  }
  return Promise.all(steps);
}

// --- Needs attention ----------------------------------------------------------------

export type AttentionItem = {
  key: string;
  kind: "approval" | "urgent" | "stale";
  title: string;
  detail: string;
  href: string;
};

/** Real documents that need someone to act, limited to what the user can act on or see. */
export async function getAttention() {
  const { can, settings } = await requireUser();
  const today = new Date(`${format(new TZDate(new Date(), settings.timeZone), "yyyy-MM-dd")}T00:00:00.000Z`);
  const weekAgo = new Date(today.getTime() - 7 * 86_400_000);
  const groups: Promise<AttentionItem[]>[] = [];

  if (can("material_requests:status")) {
    groups.push(
      prisma.materialRequest
        .findMany({ where: { status: "SUBMITTED" }, orderBy: { requestDate: "asc" }, take: 5, select: { id: true, number: true, department: { select: { name: true } } } })
        .then((rows) => rows.map((r) => ({ key: `mr-${r.id}`, kind: "approval" as const, title: `${r.number} awaits approval`, detail: `Material request · ${r.department.name}`, href: `/material-requests/${r.id}` }))),
    );
  }
  if (can("payment_requests:view")) {
    groups.push(
      prisma.paymentRequest
        .findMany({
          where: { priority: { in: ["URGENT", "TOP_URGENT"] }, status: { notIn: ["PAID", "REJECTED"] } },
          orderBy: [{ priority: "desc" }, { requestDate: "asc" }],
          take: 5,
          select: { id: true, number: true, priority: true, inFavorOf: true, amount: true, currency: true },
        })
        .then((rows) => rows.map((r) => ({ key: `pr-${r.id}`, kind: "urgent" as const, title: `${r.number} · ${r.priority === "TOP_URGENT" ? "Top urgent" : "Urgent"}`, detail: `Unpaid · ${r.inFavorOf} · ${r.amount.toString()} ${r.currency}`, href: `/payment-requests/${r.id}` }))),
    );
  }
  if (can("payment_requests:status")) {
    groups.push(
      prisma.paymentRequest
        .findMany({ where: { status: "SUBMITTED", priority: "NORMAL" }, orderBy: { requestDate: "asc" }, take: 5, select: { id: true, number: true, inFavorOf: true } })
        .then((rows) => rows.map((r) => ({ key: `prs-${r.id}`, kind: "approval" as const, title: `${r.number} awaits approval`, detail: `Payment request · ${r.inFavorOf}`, href: `/payment-requests/${r.id}` }))),
    );
  }
  if (can("material_requests:view") && can("purchase_orders:create")) {
    groups.push(
      prisma.materialRequest
        .findMany({ where: { status: "APPROVED", purchaseOrder: null, requestDate: { lte: weekAgo } }, orderBy: { requestDate: "asc" }, take: 5, select: { id: true, number: true, requestDate: true } })
        .then((rows) => rows.map((r) => ({ key: `mrs-${r.id}`, kind: "stale" as const, title: `${r.number} has no PO`, detail: `Approved ${differenceInCalendarDays(today, r.requestDate)} days ago`, href: `/material-requests/${r.id}` }))),
    );
  }
  if (can("purchase_orders:view")) {
    groups.push(
      prisma.purchaseOrder
        .findMany({ where: { status: { in: ["APPROVED", "ISSUED"] }, goodsReceipts: { none: {} }, orderDate: { lte: weekAgo } }, orderBy: { orderDate: "asc" }, take: 5, select: { id: true, number: true, supplierName: true, orderDate: true } })
        .then((rows) => rows.map((r) => ({ key: `po-${r.id}`, kind: "stale" as const, title: `${r.number} · nothing received`, detail: `${r.supplierName} · ordered ${differenceInCalendarDays(today, r.orderDate)} days ago`, href: `/purchase-orders/${r.id}` }))),
    );
  }
  const items = (await Promise.all(groups)).flat();
  const order = { urgent: 0, approval: 1, stale: 2 };
  return items.sort((a, b) => order[a.kind] - order[b.kind]);
}

// --- Recent activity ------------------------------------------------------------------

export type ActivityItem = { key: string; type: string; number: string; status: string; statusKey: string; at: Date; created: boolean; href: string };

/** Latest created/updated documents across the modules the user can view. */
export async function getRecentActivity(limit = 8): Promise<ActivityItem[]> {
  const { can } = await requireUser();
  const select = { id: true, number: true, status: true, createdAt: true, updatedAt: true } as const;
  const sources: Promise<ActivityItem[]>[] = [];
  const map = (type: string, base: string, labels: Record<string, string>) =>
    (rows: { id: string; number: string; status: string; createdAt: Date; updatedAt: Date }[]) =>
      rows.map((r) => ({
        key: `${base}-${r.id}`,
        type,
        number: r.number,
        status: labels[r.status] ?? r.status,
        statusKey: r.status,
        at: r.updatedAt,
        created: r.updatedAt.getTime() - r.createdAt.getTime() < 2000,
        href: `/${base}/${r.id}`,
      }));
  const args = { orderBy: { updatedAt: "desc" as const }, take: limit, select };
  if (can("material_requests:view")) sources.push(prisma.materialRequest.findMany(args).then(map("Material request", "material-requests", MATERIAL_REQUEST_STATUS_LABELS)));
  if (can("purchase_orders:view")) sources.push(prisma.purchaseOrder.findMany(args).then(map("Purchase order", "purchase-orders", PURCHASE_ORDER_STATUS_LABELS)));
  if (can("payment_requests:view")) sources.push(prisma.paymentRequest.findMany(args).then(map("Payment request", "payment-requests", PAYMENT_REQUEST_STATUS_LABELS)));
  if (can("grns:view")) sources.push(prisma.goodsReceipt.findMany(args).then(map("GRN", "grn", GRN_STATUS_LABELS)));
  return (await Promise.all(sources)).flat().sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

// --- Master data counts ------------------------------------------------------------------

const COUNTERS = {
  "/projects": { permission: "projects:view", count: () => prisma.project.count() },
  "/suppliers": { permission: "suppliers:view", count: () => prisma.supplier.count() },
  "/departments": { permission: "departments:view", count: () => prisma.department.count() },
  "/categories": { permission: "categories:view", count: () => prisma.category.count() },
} as const;

/** Record counts for the master-data modules the current user may view. */
export async function getMasterDataCounts() {
  const { can } = await requireUser();
  const entries = await Promise.all(
    Object.entries(COUNTERS)
      .filter(([, counter]) => can(counter.permission))
      .map(async ([href, counter]) => [href, await counter.count()] as const),
  );
  return new Map<string, number>(entries);
}
