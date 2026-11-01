import { format } from "date-fns";

export function formatDate(date: Date) {
  return format(date, "d MMM yyyy");
}

export function formatDateTime(date: Date) {
  return format(date, "d MMM yyyy, HH:mm");
}
