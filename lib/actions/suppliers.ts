"use server";

import { z } from "zod";

import { runMutation } from "@/lib/actions/run-mutation";
import { prisma } from "@/lib/prisma";
import { normalizeIban } from "@/lib/validation/iban";
import {
  type SupplierInput,
  recordIdSchema,
  supplierSchema,
} from "@/lib/validation/master-data";

const unique = { field: "vat", message: "A supplier with this VAT number already exists." };

const orNull = (value: string) => (value === "" ? null : value);

/** Stores empty optional fields as NULL and normalises identifiers. */
function toSupplierData(input: SupplierInput) {
  return {
    name: input.name,
    vat: orNull(input.vat.replace(/\s+/g, "").toUpperCase()),
    cr: orNull(input.cr),
    iban: orNull(normalizeIban(input.iban)),
    address: orNull(input.address),
    contactName: orNull(input.contactName),
    contactEmail: orNull(input.contactEmail.toLowerCase()),
    contactNumber: orNull(input.contactNumber),
    email: orNull(input.email.toLowerCase()),
    telephone: orNull(input.telephone),
  };
}

export async function createSupplier(input: unknown) {
  return runMutation({
    requirement: "suppliers:create",
    schema: supplierSchema,
    input,
    unique,
    success: "Supplier created.",
    run: (data) => prisma.supplier.create({ data: toSupplierData(data) }),
  });
}

export async function updateSupplier(id: string, input: unknown) {
  return runMutation({
    requirement: "suppliers:edit",
    schema: supplierSchema.extend({ id: recordIdSchema }),
    input: { ...(input as object), id },
    unique,
    success: "Supplier updated.",
    run: ({ id, ...data }) =>
      prisma.supplier.update({ where: { id }, data: toSupplierData(data) }),
  });
}

export async function deleteSupplier(id: string) {
  return runMutation({
    requirement: "suppliers:delete",
    schema: z.object({ id: recordIdSchema }),
    input: { id },
    success: "Supplier deleted.",
    run: ({ id }) => prisma.supplier.delete({ where: { id } }),
  });
}

/** Used on the detail page, which navigates back to the list itself. */
export async function deleteSupplierFromDetail(id: string) {
  return runMutation({
    requirement: "suppliers:delete",
    schema: z.object({ id: recordIdSchema }),
    input: { id },
    success: "Supplier deleted.",
    refreshPage: false,
    run: ({ id }) => prisma.supplier.delete({ where: { id } }),
  });
}
