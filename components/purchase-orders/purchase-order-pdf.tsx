import "server-only";

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import {
  PDF_FOOTER_PADDING,
  PDF_FOOTER_TEXT_BOTTOM,
  PdfFooterImage,
} from "@/components/print/pdf-footer-image";

import type { PdfImage } from "@/lib/pdf-images";

export type PurchaseOrderPdfData = {
  company: {
    name: string | null;
    address: string | null;
    vat: string | null;
    cr: string | null;
    phone: string | null;
    email: string | null;
    /** PNG or JPEG bytes (react-pdf does not support WebP). */
    logo: PdfImage | null;
    /** Uploaded print footer, drawn on every page. */
    footer: PdfImage | null;
  };
  number: string;
  date: string;
  status: string;
  supplier: {
    name: string;
    location: string | null;
    contactName: string | null;
    contactNumber: string | null;
    email: string | null;
    telephone: string | null;
    vat: string | null;
    quotationRef: string | null;
  };
  order: {
    orderDate: string;
    mrNumber: string | null;
    orderedBy: string;
    projectName: string;
    projectCode: string;
    subject: string;
    deliverTo: string;
  };
  currency: string;
  lines: {
    lineNo: number;
    name: string;
    unit: string;
    quantity: string;
    unitPrice: string;
    total: string;
  }[];
  totals: {
    subtotal: string;
    discount: string;
    totalAfterDiscount: string;
    vatRate: string;
    vatAmount: string;
    total: string;
  };
  terms: string | null;
  preparedBy: string;
  generatedAt: string;
};

const BORDER = "#d4d4d4";
const MUTED = "#525252";

const s = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 52,
    paddingHorizontal: 32,
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#171717",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: "#171717",
  },
  company: { flexDirection: "row", gap: 10, maxWidth: "60%" },
  logo: { width: 65, height: 65, objectFit: "contain" },
  companyName: {
    fontSize: 12.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  muted: { color: MUTED },
  titleBlock: { alignItems: "flex-end" },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  bold: { fontFamily: "Helvetica-Bold" },
  panels: { flexDirection: "row", gap: 10, marginTop: 12 },
  panel: { flex: 1, borderWidth: 1, borderColor: BORDER },
  panelTitle: {
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#f5f5f5",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  kv: { flexDirection: "row", paddingVertical: 2.5, paddingHorizontal: 6 },
  kvLabel: { width: 82, color: MUTED },
  kvValue: { flex: 1 },
  table: { marginTop: 12, borderWidth: 1, borderColor: BORDER },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headRow: { backgroundColor: "#f5f5f5" },
  th: {
    fontFamily: "Helvetica-Bold",
    paddingVertical: 4,
    paddingHorizontal: 4,
    textAlign: "center",
  },
  td: { paddingVertical: 4, paddingHorizontal: 4 },
  cSr: {
    width: 30,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  cName: { flex: 4, borderRightWidth: 1, borderRightColor: BORDER },
  cUnit: {
    width: 44,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  cQty: {
    width: 52,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  cPrice: {
    width: 66,
    textAlign: "right",
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  cTotal: { width: 80, textAlign: "right" },
  intro: { marginTop: 10 },
  // Terms (left) and totals (right) side by side.
  summary: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 8,
  },
  totals: {
    width: 220,
    marginLeft: "auto",
    borderWidth: 1,
    borderColor: BORDER,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  grandRow: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: "#f5f5f5",
  },
  terms: { flex: 1, borderWidth: 1, borderColor: BORDER },
  termsBody: { padding: 6, lineHeight: 0.7 },
  // marginTop "auto" pushes the boxes to the bottom of the last page, just above the footer.
  signatures: {
    flexDirection: "row",
    gap: 14,
    marginTop: "auto",
    paddingTop: 24,
  },
  signBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 8,
    minHeight: 130,
  },
  signTitle: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  signLine: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#737373",
    paddingTop: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    color: MUTED,
    fontSize: 7.5,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: MUTED,
  },
});

function KV({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={s.kv}>
      <Text style={s.kvLabel}>{label}</Text>
      <Text style={s.kvValue}>{value || "—"}</Text>
    </View>
  );
}

function SignatureBox({ title, name }: { title: string; name: string }) {
  return (
    <View style={s.signBox} wrap={false}>
      <Text style={s.signTitle}>{title}</Text>
      <Text style={[s.muted, { marginTop: 3 }]}>{name}</Text>
      <View style={s.signLine}>
        <Text>Signature</Text>
        <Text>Date</Text>
      </View>
    </View>
  );
}

export function PurchaseOrderPdf({ data }: { data: PurchaseOrderPdfData }) {
  const { company, supplier, order, totals } = data;
  const registration = [
    company.vat && `VAT: ${company.vat}`,
    company.cr && `CR: ${company.cr}`,
  ]
    .filter(Boolean)
    .join("   ");
  const contact = [company.phone, company.email].filter(Boolean).join("   ");

  return (
    <Document
      title={`Purchase Order ${data.number}`}
      author={company.name ?? undefined}
      creator="Procurement Management"
    >
      <Page
        size="A4"
        style={[
          s.page,
          company.footer ? { paddingBottom: PDF_FOOTER_PADDING } : {},
        ]}
      >
        <View style={s.header}>
          <View style={s.company}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an HTML img */}
            {company.logo && <Image style={s.logo} src={company.logo} />}
            <View>
              <Text style={s.companyName}>
                {company.name ?? "Procurement Management"}
              </Text>
              {company.address && (
                <Text style={s.muted}>{company.address}</Text>
              )}
              {registration && <Text style={s.muted}>{registration}</Text>}
              {contact && <Text style={s.muted}>{contact}</Text>}
            </View>
          </View>
          <View style={s.titleBlock}>
            <Text style={s.title}>PURCHASE ORDER</Text>
            <Text style={[s.bold, { fontSize: 11, marginTop: 4 }]}>
              {data.number}
            </Text>
            <Text style={[s.muted, { marginTop: 2 }]}>Date: {data.date}</Text>
            <Text style={s.muted}>Status: {data.status}</Text>
          </View>
        </View>

        <View style={s.panels}>
          <View style={s.panel}>
            <Text style={s.panelTitle}>To</Text>
            <KV label="Company" value={supplier.name} />
            <KV label="Location" value={supplier.location} />
            <KV
              label="Contact person"
              value={
                [supplier.contactName, supplier.contactNumber]
                  .filter(Boolean)
                  .join(" · ") || null
              }
            />
            <KV label="Email" value={supplier.email} />
            <KV label="Tel" value={supplier.telephone} />
            <KV label="VAT number" value={supplier.vat} />
            <KV label="Quotation ref" value={supplier.quotationRef} />
          </View>
          <View style={s.panel}>
            <Text style={s.panelTitle}>Purchase order data</Text>
            <KV label="Order date" value={order.orderDate} />
            <KV label="MR number" value={order.mrNumber} />
            <KV label="Ordered by" value={order.orderedBy} />
            <KV label="Project name" value={order.projectName} />
            <KV label="Project code" value={order.projectCode} />
            <KV label="Subject" value={order.subject} />
            <KV label="Deliver to" value={order.deliverTo} />
          </View>
        </View>

        <Text style={s.intro}>
          With reference to above mentioned subject & your above Quotation Ref{" "}
          <Text style={s.bold}>{supplier.quotationRef || "—"}</Text>, Dated{" "}
          <Text style={s.bold}>{order.orderDate}</Text>, we hereby confirmed the
          order for the <Text style={s.bold}>{order.subject}</Text> as follows:
        </Text>

        <View style={s.table}>
          <View style={[s.row, s.headRow]} fixed>
            <Text style={[s.th, s.cSr]}>Sr No</Text>
            <Text style={[s.th, s.cName]}>Description & Brand Name</Text>
            <Text style={[s.th, s.cUnit]}>Unit</Text>
            <Text style={[s.th, s.cQty]}>Quantity</Text>
            <Text style={[s.th, s.cPrice]}>Unit price</Text>
            <Text style={[s.th, s.cTotal]}>Total</Text>
          </View>
          {data.lines.map((line) => (
            <View key={line.lineNo} style={s.row} wrap={false}>
              <Text style={[s.td, s.cSr]}>{line.lineNo}</Text>
              <Text style={[s.td, s.cName]}>{line.name}</Text>
              <Text style={[s.td, s.cUnit]}>{line.unit}</Text>
              <Text style={[s.td, s.cQty]}>{line.quantity}</Text>
              <Text style={[s.td, s.cPrice]}>{line.unitPrice}</Text>
              <Text style={[s.td, s.cTotal]}>{line.total}</Text>
            </View>
          ))}
        </View>

        <View style={s.summary}>
          {data.terms && (
            <View style={s.terms}>
              <Text style={s.panelTitle}>Terms & Conditions</Text>
              <Text style={s.termsBody}>{data.terms}</Text>
            </View>
          )}
          <View style={s.totals} wrap={false}>
            <View style={s.totalRow}>
              <Text style={s.muted}>Subtotal</Text>
              <Text>{totals.subtotal}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.muted}>Discount</Text>
              <Text>- {totals.discount}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.muted}>Total After Discount</Text>
              <Text>{totals.totalAfterDiscount}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.muted}>VAT ({totals.vatRate}%)</Text>
              <Text>{totals.vatAmount}</Text>
            </View>
            <View style={[s.totalRow, s.grandRow]}>
              <Text style={s.bold}>Grand total ({data.currency})</Text>
              <Text style={s.bold}>{totals.total}</Text>
            </View>
          </View>
        </View>

        <View style={s.signatures} wrap={false}>
          <SignatureBox title="Prepared By" name={data.preparedBy} />
          <SignatureBox title="Approved By" name="General Manager" />
        </View>

        <PdfFooterImage image={company.footer} inset={32} />
        <View
          style={[
            s.footer,
            company.footer ? { bottom: PDF_FOOTER_TEXT_BOTTOM } : {},
          ]}
          fixed
        >
          <Text>
            {data.number} · Generated {data.generatedAt}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
