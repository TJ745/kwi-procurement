/**
 * Exact money arithmetic on decimal strings, shared by the PO form (live
 * preview) and the server (stored amounts), so both always agree.
 * Values are scaled to integers (BigInt) and rounded half-up to the
 * currency's minor units (e.g. 2 for SAR, 3 for KWD).
 */

// BigInt constants (the tsconfig target predates BigInt literals).
const ZERO = BigInt(0);
const TWO = BigInt(2);
const TEN = BigInt(10);

/** Minor-unit digits for an ISO 4217 currency code. */
export function currencyDigits(currency: string) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/** "12.5" at scale 3 → 12500n. Input must be a plain non-negative decimal. */
function toUnits(value: string, scale: number): bigint {
  const [whole, fraction = ""] = value.trim().split(".");
  return BigInt((whole || "0") + fraction.padEnd(scale, "0").slice(0, scale));
}

/** 12500n at scale 3 → "12.500". */
function fromUnits(units: bigint, scale: number): string {
  const negative = units < ZERO;
  const digits = (negative ? -units : units).toString().padStart(scale + 1, "0");
  const whole = scale ? digits.slice(0, -scale) : digits;
  const fraction = scale ? `.${digits.slice(-scale)}` : "";
  return `${negative ? "-" : ""}${whole}${fraction}`;
}

/** Divides by 10^drop, rounding half away from zero. */
function roundDrop(units: bigint, drop: number): bigint {
  if (drop <= 0) return units * TEN ** BigInt(-drop);
  const factor = TEN ** BigInt(drop);
  const half = factor / TWO;
  return units >= ZERO ? (units + half) / factor : -((-units + half) / factor);
}

const QTY_SCALE = 2;
const PRICE_SCALE = 3;
const RATE_SCALE = 2;

export type TotalsInput = {
  lines: { quantity: string; unitPrice: string }[];
  discount: string;
  vatRate: string;
  currency: string;
};

export type Totals = {
  digits: number;
  lineTotals: string[];
  subtotal: string;
  discount: string;
  taxable: string;
  vatAmount: string;
  total: string;
};

const isNumber = (value: string) => /^\d+(\.\d+)?$/.test(value.trim());

/**
 * Line total = round(qty × unit price); subtotal = Σ line totals;
 * VAT = round((subtotal − discount) × rate%); total = subtotal − discount + VAT.
 * Unparseable values count as 0 (the form shows its own validation errors).
 */
export function computeTotals({ lines, discount, vatRate, currency }: TotalsInput): Totals {
  const digits = currencyDigits(currency);
  const lineUnits = lines.map(({ quantity, unitPrice }) =>
    isNumber(quantity) && isNumber(unitPrice)
      ? roundDrop(toUnits(quantity, QTY_SCALE) * toUnits(unitPrice, PRICE_SCALE), QTY_SCALE + PRICE_SCALE - digits)
      : ZERO,
  );
  const subtotal = lineUnits.reduce((sum, value) => sum + value, ZERO);
  const discountUnits = isNumber(discount) ? roundDrop(toUnits(discount, PRICE_SCALE), PRICE_SCALE - digits) : ZERO;
  const taxable = subtotal - discountUnits;
  const rate = isNumber(vatRate) ? toUnits(vatRate, RATE_SCALE) : ZERO;
  // taxable (digits) × rate (2 dp) / 100 → drop 2 + 2 places.
  const vat = roundDrop(taxable * rate, RATE_SCALE + 2);
  return {
    digits,
    lineTotals: lineUnits.map((value) => fromUnits(value, digits)),
    subtotal: fromUnits(subtotal, digits),
    discount: fromUnits(discountUnits, digits),
    taxable: fromUnits(taxable, digits),
    vatAmount: fromUnits(vat, digits),
    total: fromUnits(taxable + vat, digits),
  };
}

/**
 * Display an already-rounded amount with grouping, e.g. "12,345.500 KWD".
 * String-based, so large values never pass through floating point.
 */
export function formatMoney(value: { toString(): string }, currency: string, withCode = true) {
  const digits = currencyDigits(currency);
  const [whole, fraction = ""] = value.toString().split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const amount = `${grouped}${digits ? `.${fraction.padEnd(digits, "0").slice(0, digits)}` : ""}`;
  return withCode ? `${amount} ${currency}` : amount;
}
