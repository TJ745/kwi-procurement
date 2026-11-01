import type { Supplier } from "@/lib/generated/prisma/client";
import type { SupplierInput } from "@/lib/validation/master-data";

/** Converts a stored supplier (NULL for empty fields) into form values. */
export function toSupplierFormValues(supplier: Supplier): SupplierInput {
  return {
    name: supplier.name,
    vat: supplier.vat ?? "",
    cr: supplier.cr ?? "",
    iban: supplier.iban ?? "",
    address: supplier.address ?? "",
    contactName: supplier.contactName ?? "",
    contactEmail: supplier.contactEmail ?? "",
    contactNumber: supplier.contactNumber ?? "",
    email: supplier.email ?? "",
    telephone: supplier.telephone ?? "",
  };
}

/** Groups an IBAN into blocks of four characters for display. */
export function formatIban(iban: string) {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}
