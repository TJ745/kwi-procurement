import "server-only";

import type { Snapshot } from "@/lib/audit";
import { DOCUMENT_TYPES } from "@/lib/document-numbering";
import { formatQuantity, toIsoDate } from "@/lib/format";
import { GRN_STATUS_LABELS, deliveryMethodLabel } from "@/lib/grn";
import { formatMoney } from "@/lib/money";
import {
  PAYMENT_ITEM_GROUPS,
  PAYMENT_REQUEST_STATUS_LABELS,
  paymentTypeLabel,
  priorityLabel,
} from "@/lib/payment-request-options";
import { PERMISSION_ACTION_LABELS, PERMISSION_MODULES, type Permission, normalizePermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/roles";
import { paymentTermLabel } from "@/lib/validation/master-data";
import { MATERIAL_REQUEST_STATUS_LABELS } from "@/lib/validation/material-request";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/validation/purchase-order";

/** Audited record types and how they are named in the log. */
export const AUDIT_ENTITIES = {
  project: "Project",
  supplier: "Supplier",
  department: "Department",
  category: "Category",
  material_request: "Material request",
  purchase_order: "Purchase order",
  payment_request: "Payment request",
  grn: "GRN",
  user: "User",
  role: "Role",
  settings: "Settings",
  document_sequence: "Document numbering",
  auth: "Sign-in",
} as const;
export type AuditEntity = keyof typeof AUDIT_ENTITIES;

type Fields = Snapshot["fields"];
const field = (label: string, value: string | number | null | undefined): Fields[string] => ({
  label,
  value: value === null || value === undefined || value === "" ? null : String(value),
});
const MAX = 1500;
const clip = (text: string) => (text.length > MAX ? `${text.slice(0, MAX)}…` : text);

function permissionSummary(permissions: string[]) {
  const granted = new Set(normalizePermissions(permissions));
  const parts = PERMISSION_MODULES.flatMap((module) => {
    const actions = (module.actions as readonly (keyof typeof PERMISSION_ACTION_LABELS)[]).filter((action) =>
      granted.has(`${module.key}:${action}` as Permission),
    );
    return actions.length ? [`${module.label}: ${actions.map((a) => PERMISSION_ACTION_LABELS[a]).join(", ")}`] : [];
  });
  return parts.join("; ") || "None";
}

const itemLabels = new Map<string, string>(
  PAYMENT_ITEM_GROUPS.flatMap((group) => group.items.map((item) => [item.key, `${group.label} – ${item.label}`] as const)),
);

/** Loads a record as a readable snapshot, or null if it doesn't exist. */
export async function loadSnapshot(entity: AuditEntity, id: string): Promise<Snapshot | null> {
  switch (entity) {
    case "project": {
      const r = await prisma.project.findUnique({ where: { id } });
      return r && { label: r.code, fields: { code: field("Code", r.code), name: field("Name", r.name) } };
    }
    case "department":
    case "category": {
      const r = entity === "department"
        ? await prisma.department.findUnique({ where: { id } })
        : await prisma.category.findUnique({ where: { id } });
      return r && { label: r.name, fields: { name: field("Name", r.name) } };
    }
    case "supplier": {
      const r = await prisma.supplier.findUnique({ where: { id } });
      return r && {
        label: r.name,
        fields: {
          name: field("Name", r.name),
          paymentTerm: field("Payment terms", paymentTermLabel(r.paymentTerm, r.creditDays)),
          vat: field("VAT", r.vat),
          cr: field("CR", r.cr),
          iban: field("IBAN", r.iban),
          address: field("Address", r.address),
          email: field("Email", r.email),
          telephone: field("Telephone", r.telephone),
          contactName: field("Contact name", r.contactName),
          contactEmail: field("Contact email", r.contactEmail),
          contactNumber: field("Contact number", r.contactNumber),
        },
      };
    }
    case "material_request": {
      const r = await prisma.materialRequest.findUnique({
        where: { id },
        include: { project: true, department: true, category: true, supplier: true, lines: { orderBy: { lineNo: "asc" } } },
      });
      return r && {
        label: r.number,
        fields: {
          status: field("Status", MATERIAL_REQUEST_STATUS_LABELS[r.status]),
          requestDate: field("Request date", toIsoDate(r.requestDate)),
          project: field("Project", `${r.project.code} – ${r.project.name}`),
          department: field("Requested by", r.department.name),
          category: field("Category", r.category.name),
          supplier: field("Supplier", r.supplier?.name),
          lines: field("Items", clip(r.lines.map((l) => `${l.lineNo}. ${l.name} — ${formatQuantity(l.quantity)} ${l.unit}${l.remarks ? ` (${l.remarks})` : ""}`).join("; "))),
        },
      };
    }
    case "purchase_order": {
      const r = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: { project: true, department: true, category: true, materialRequest: true, lines: { orderBy: { lineNo: "asc" } } },
      });
      if (!r) return null;
      const m = (v: { toString(): string }) => formatMoney(v.toString(), r.currency);
      return {
        label: r.number,
        fields: {
          status: field("Status", PURCHASE_ORDER_STATUS_LABELS[r.status]),
          orderDate: field("Order date", toIsoDate(r.orderDate)),
          materialRequest: field("MR number", r.materialRequest?.number),
          project: field("Project", `${r.project.code} – ${r.project.name}`),
          department: field("Ordered by", r.department.name),
          category: field("Subject", r.category.name),
          deliverTo: field("Deliver to", r.deliverTo),
          supplierName: field("Supplier", r.supplierName),
          supplierAddress: field("Supplier location", r.supplierAddress),
          supplierContact: field("Contact", [r.supplierContactName, r.supplierContactNumber].filter(Boolean).join(" · ")),
          supplierEmail: field("Supplier email", r.supplierEmail),
          supplierTelephone: field("Supplier tel", r.supplierTelephone),
          supplierVat: field("Supplier VAT", r.supplierVat),
          quotationRef: field("Quotation ref", r.quotationRef),
          lines: field("Items", clip(r.lines.map((l) => `${l.lineNo}. ${l.name} — ${formatQuantity(l.quantity)} ${l.unit} × ${formatMoney(l.unitPrice.toString(), r.currency, false)} = ${formatMoney(l.total.toString(), r.currency, false)}`).join("; "))),
          discount: field("Discount", m(r.discount)),
          vatRate: field("VAT %", `${r.vatRate.toString()}%`),
          total: field("Grand total", m(r.total)),
          terms: field("Terms & Conditions", r.terms && clip(r.terms)),
        },
      };
    }
    case "payment_request": {
      const r = await prisma.paymentRequest.findUnique({ where: { id }, include: { project: true, purchaseOrder: true, supplier: true } });
      return r && {
        label: r.number,
        fields: {
          status: field("Status", PAYMENT_REQUEST_STATUS_LABELS[r.status]),
          requestDate: field("Date", toIsoDate(r.requestDate)),
          purchaseOrder: field("PO ref", r.purchaseOrder?.number),
          project: field("Project", `${r.project.code} – ${r.project.name}`),
          supplier: field("Supplier", r.supplier?.name),
          inFavorOf: field("In favor of", r.inFavorOf),
          description: field("Description", clip(r.description)),
          items: field("Payment for", r.items.map((key) => itemLabels.get(key) ?? key).join(", ") + (r.otherDetails ? ` (Others: ${r.otherDetails})` : "")),
          paymentType: field("Type of payment", paymentTypeLabel(r.paymentType)),
          priority: field("Priority", priorityLabel(r.priority)),
          amount: field("Amount", formatMoney(r.amount.toString(), r.currency)),
          invoiceNo: field("Invoice no", r.invoiceNo),
          quotationNo: field("Quotation no", r.quotationNo),
        },
      };
    }
    case "grn": {
      const r = await prisma.goodsReceipt.findUnique({
        where: { id },
        include: { purchaseOrder: true, department: true, lines: { orderBy: { lineNo: "asc" }, include: { department: true } } },
      });
      return r && {
        label: r.number,
        fields: {
          status: field("Status", GRN_STATUS_LABELS[r.status]),
          receiptDate: field("Date", toIsoDate(r.receiptDate)),
          purchaseOrder: field("PO ref", r.purchaseOrder.number),
          department: field("Ordered by", r.department.name),
          supplierName: field("From", r.supplierName),
          supplierAddress: field("Address", r.supplierAddress),
          invoiceNo: field("Invoice no", r.invoiceNo),
          deliveredBy: field("Delivered by", deliveryMethodLabel(r.deliveredBy)),
          lines: field("Items", clip(r.lines.map((l) => `${l.lineNo}. ${l.description}${l.itemCode ? ` [${l.itemCode}]` : ""} — received ${formatQuantity(l.receivedQty)}, rejected ${formatQuantity(l.rejectedQty)}, accepted ${formatQuantity(l.acceptedQty)} ${l.unit} (${l.department.name})`).join("; "))),
          remarks: field("Remarks", r.remarks && clip(r.remarks)),
        },
      };
    }
    case "user": {
      const r = await prisma.user.findUnique({ where: { id }, include: { customRole: true } });
      return r && {
        label: r.email,
        fields: {
          name: field("Name", r.name),
          email: field("Email", r.email),
          role: field("Role", isSuperAdmin(r.role) ? "Super Admin" : (r.customRole?.name ?? "No role")),
          active: field("Status", r.active ? "Active" : "Deactivated"),
          mustChangePassword: field("Temporary password", r.mustChangePassword ? "Yes" : "No"),
        },
      };
    }
    case "role": {
      const r = await prisma.role.findUnique({ where: { id } });
      return r && {
        label: r.name,
        fields: {
          name: field("Name", r.name),
          description: field("Description", r.description),
          permissions: field("Permissions", permissionSummary(r.permissions)),
        },
      };
    }
    case "settings": {
      const r = await prisma.appSettings.findUnique({ where: { id: 1 } });
      return r && {
        label: "System settings",
        fields: {
          companyName: field("Company name", r.companyName),
          companyAddress: field("Company address", r.companyAddress),
          companyVat: field("Company VAT", r.companyVat),
          companyCr: field("Company CR", r.companyCr),
          companyPhone: field("Company phone", r.companyPhone),
          companyEmail: field("Company email", r.companyEmail),
          // Only a description of the logo, never the image itself.
          companyLogo: field("Logo", r.companyLogo ? `${r.companyLogoType ?? "image"}, ${Math.round(r.companyLogo.length / 1024)} KB` : null),
          currency: field("Default currency", r.currency),
          timeZone: field("Time zone", r.timeZone),
          dateFormat: field("Date format", r.dateFormat),
          sessionDurationHours: field("Session duration (hours)", r.sessionDurationHours),
          minPasswordLength: field("Minimum password length", r.minPasswordLength),
          defaultVatRate: field("Default VAT %", `${r.defaultVatRate.toString()}%`),
          purchaseOrderTerms: field("Default PO terms", r.purchaseOrderTerms && clip(r.purchaseOrderTerms)),
        },
      };
    }
    case "document_sequence": {
      const r = await prisma.documentSequence.findUnique({ where: { type: id } });
      return r && {
        label: DOCUMENT_TYPES.find((t) => t.type === r.type)?.label ?? r.type,
        fields: {
          prefix: field("Prefix", r.prefix),
          padding: field("Digits", r.padding),
          nextNumber: field("Next number", r.nextNumber),
          includeYear: field("Include year", r.includeYear ? "Yes" : "No"),
          resetYearly: field("Restart each year", r.resetYearly ? "Yes" : "No"),
        },
      };
    }
    case "auth":
      return null;
  }
}
