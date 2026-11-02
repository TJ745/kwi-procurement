import { tz } from "@date-fns/tz";
import { format } from "date-fns";

export const DATE_FORMATS = [
  { value: "d MMM yyyy", label: "1 Nov 2026" },
  { value: "dd/MM/yyyy", label: "01/11/2026" },
  { value: "MM/dd/yyyy", label: "11/01/2026" },
  { value: "yyyy-MM-dd", label: "2026-11-01" },
  { value: "dd.MM.yyyy", label: "01.11.2026" },
] as const;

const quantityFormat = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });

/** Quantities are exact decimals (Prisma Decimal / string); shows e.g. "2.55" or "3". */
export function formatQuantity(value: { toString(): string }) {
  return quantityFormat.format(Number(value.toString()));
}

/** A calendar date stored without time zone (Postgres `date`), as yyyy-MM-dd. */
export function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export type DateFormatter = {
  date: (value: Date) => string;
  dateTime: (value: Date) => string;
  /** A calendar date stored without time (Postgres `date`); never shifted by time zone. */
  calendarDate: (value: Date) => string;
};

/** Formats dates in the configured time zone and date format. */
export function createDateFormatter(settings: {
  dateFormat: string;
  timeZone: string;
}): DateFormatter {
  const options = { in: tz(settings.timeZone) };
  return {
    date: (value) => format(value, settings.dateFormat, options),
    dateTime: (value) => format(value, `${settings.dateFormat}, HH:mm`, options),
    calendarDate: (value) => format(value, settings.dateFormat, { in: tz("UTC") }),
  };
}
