import { tz } from "@date-fns/tz";
import { format } from "date-fns";

export const DATE_FORMATS = [
  { value: "d MMM yyyy", label: "1 Nov 2026" },
  { value: "dd/MM/yyyy", label: "01/11/2026" },
  { value: "MM/dd/yyyy", label: "11/01/2026" },
  { value: "yyyy-MM-dd", label: "2026-11-01" },
  { value: "dd.MM.yyyy", label: "01.11.2026" },
] as const;

export type DateFormatter = {
  date: (value: Date) => string;
  dateTime: (value: Date) => string;
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
  };
}
