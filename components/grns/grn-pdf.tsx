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
  A4_WIDTH,
  PdfFooterImage,
  pdfFooterLayout,
} from "@/components/print/pdf-footer-image";

import { DELIVERY_METHODS } from "@/lib/grn";
import type { PdfFooter, PdfImage } from "@/lib/pdf-images";
import type { Signatory } from "@/lib/signatories";

export type GrnPdfData = {
  company: {
    name: string | null;
    address: string | null;
    vat: string | null;
    cr: string | null;
    phone: string | null;
    email: string | null;
    logo: PdfImage | null;
    /** Uploaded print footer, drawn on every page. */
    footer: PdfFooter | null;
  };
  number: string;
  date: string;
  status: string;
  supplierName: string;
  supplierAddress: string | null;
  mrRef: string | null;
  poRef: string;
  orderedBy: string;
  projectName: string;
  projectCode: string;
  invoiceNo: string | null;
  deliveryNote: boolean;
  deliveredBy: string;
  lines: {
    lineNo: number;
    itemCode: string | null;
    description: string;
    department: string;
    unit: string;
    ordered: string;
    received: string;
    short: string;
    excess: string;
    rejected: string;
    accepted: string;
  }[];
  remarks: string | null;
  preparedBy: string;
  generatedAt: string;
  /** Signature boxes from Settings › Signatures. */
  signatories: Signatory[];
};

const BORDER = "#a3a3a3";
const MUTED = "#525252";

const s = StyleSheet.create({
  page: {
    paddingTop: 26,
    paddingBottom: 44,
    paddingHorizontal: 28,
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#171717",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: "#171717",
  },
  company: { flexDirection: "row", gap: 10, maxWidth: "62%" },
  logo: { width: 46, height: 46, objectFit: "contain" },
  companyName: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  muted: { color: MUTED },
  bold: { fontFamily: "Helvetica-Bold" },
  titleBlock: { alignItems: "flex-end" },
  title: { fontSize: 13, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  panels: { flexDirection: "row", gap: 8, marginTop: 10 },
  panel: { borderWidth: 1, borderColor: BORDER },
  panelTitle: {
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#f5f5f5",
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  kv: { flexDirection: "row", paddingVertical: 2, paddingHorizontal: 5 },
  kvLabel: { width: 72, color: MUTED },
  kvValue: { flex: 1 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginRight: 8,
  },
  box: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: "#404040",
    alignItems: "center",
    justifyContent: "center",
  },
  tick: { fontSize: 6.5, fontFamily: "Helvetica-Bold", lineHeight: 1 },
  table: { marginTop: 10, borderWidth: 1, borderColor: BORDER },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  head: { backgroundColor: "#f5f5f5" },
  th: {
    fontFamily: "Helvetica-Bold",
    paddingVertical: 3,
    paddingHorizontal: 3,
  },
  td: { paddingVertical: 3, paddingHorizontal: 3 },
  cell: { borderRightWidth: 1, borderRightColor: BORDER },
  num: { textAlign: "right" },
  remarks: { marginTop: 10, borderWidth: 1, borderColor: BORDER },
  signRow: { flexDirection: "row", gap: 12, marginTop: "auto" },
  signBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 7,
    height: 130,
  },
  signTitle: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  signLine: {
    marginTop: "auto",
    color: MUTED,
    fontSize: 7,
  },
  // "Signature" above the line, "Date" below it on the left.
  signRule: { borderTopWidth: 1, borderTopColor: "#737373", marginTop: 1, marginBottom: 3 },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 28,
    right: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: MUTED,
  },
});

// Column widths (landscape A4 body ≈ 786pt).
const COLS = [
  { key: "lineNo", label: "Sr No", width: 30, num: false },
  { key: "poRef", label: "PO No", width: 66, num: false },
  { key: "itemCode", label: "Item Code", width: 62, num: false },
  { key: "description", label: "Item Description", width: 0, num: false },
  { key: "department", label: "Dept", width: 70, num: false },
  { key: "unit", label: "Unit", width: 38, num: false },
  { key: "ordered", label: "Ordered", width: 50, num: true },
  { key: "received", label: "Received", width: 50, num: true },
  { key: "short", label: "Short", width: 44, num: true },
  { key: "excess", label: "Excess", width: 44, num: true },
  { key: "rejected", label: "Rejected", width: 48, num: true },
  { key: "accepted", label: "Accepted", width: 50, num: true },
] as const;

function colStyle(width: number, last: boolean) {
  return [width ? { width } : { flex: 1 }, last ? {} : s.cell];
}

function KV({
  label,
  value,
  strong,
  large,
}: {
  label: string;
  value: string | null;
  /** Prints the value (not the label) in bold. */
  strong?: boolean;
  /** Prints the value a little larger. */
  large?: boolean;
}) {
  return (
    <View style={s.kv}>
      <Text style={s.kvLabel}>{label}</Text>
      <Text style={[s.kvValue, strong ? s.bold : {}, large ? { fontSize: 9.5 } : {}]}>
        {value || "—"}
      </Text>
    </View>
  );
}

function SignatureBox({ signatory }: { signatory: Signatory }) {
  return (
    <View style={s.signBox}>
      <Text style={s.signTitle}>{signatory.title || " "}</Text>
      {signatory.position && <Text style={[s.muted, { marginTop: 2 }]}>{signatory.position}</Text>}
      {signatory.name && <Text style={{ marginTop: 2 }}>{signatory.name}</Text>}
      <View style={s.signLine}>
        <Text>Signature</Text>
        <View style={s.signRule} />
        <Text>Date</Text>
      </View>
    </View>
  );
}

export function GrnPdf({ data }: { data: GrnPdfData }) {
  const { company } = data;
  const footer = pdfFooterLayout(company.footer, { pageWidth: A4_WIDTH.landscape, inset: 28 });
  const registration = [
    company.vat && `VAT: ${company.vat}`,
    company.cr && `CR: ${company.cr}`,
  ]
    .filter(Boolean)
    .join("   ");
  const contact = [company.phone, company.email].filter(Boolean).join("   ");

  return (
    <Document
      title={`GRN ${data.number}`}
      author={company.name ?? undefined}
      creator="Procurement Management"
    >
      <Page
        size="A4"
        orientation="landscape"
        style={[
          s.page,
          footer ? { paddingBottom: footer.padding } : {},
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
            <Text style={s.title}>GOODS RECEIVED NOTE</Text>
            <Text style={[s.bold, { fontSize: 10.5, marginTop: 3 }]}>
              {data.number}
            </Text>
            <Text style={[s.muted, { marginTop: 2 }]}>Date: {data.date}</Text>          </View>
        </View>

        <View style={s.panels}>
          <View style={[s.panel, { flex: 1 }]}>
            <Text style={s.panelTitle}>From</Text>
            <KV label="Supplier" value={data.supplierName} strong large />
            <KV label="Address" value={data.supplierAddress} />
          </View>
          <View style={[s.panel, { flex: 1 }]}>
            <Text style={s.panelTitle}>References</Text>
            <KV label="MR Ref" value={data.mrRef} strong />
            <KV label="PO Ref" value={data.poRef} strong />
            <KV label="Invoice No" value={data.invoiceNo} strong />
            <KV label="Delivery note" value={data.deliveryNote ? "Received" : "Not received"} strong />
          </View>
          <View style={[s.panel, { flex: 1.2 }]}>
            <Text style={s.panelTitle}>Order</Text>
            <KV label="Ordered by" value={data.orderedBy} strong />
            <KV label="Project name" value={data.projectName} strong />
            <KV label="Project code" value={data.projectCode} strong />
            <View style={s.kv}>
              <Text style={s.kvLabel}>Delivered by</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {DELIVERY_METHODS.map((method) => (
                  <View key={method.value} style={s.option}>
                    <View style={s.box}>
                      {data.deliveredBy === method.value && (
                        <Text style={s.tick}>X</Text>
                      )}
                    </View>
                    <Text>{method.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={s.table}>
          <View style={[s.row, s.head]} fixed>
            {COLS.map((col, index) => (
              <Text
                key={col.key}
                style={[
                  s.th,
                  ...colStyle(col.width, index === COLS.length - 1),
                  col.num ? s.num : {},
                ]}
              >
                {col.label}
              </Text>
            ))}
          </View>
          {data.lines.map((line) => {
            const values: Record<(typeof COLS)[number]["key"], string> = {
              lineNo: String(line.lineNo),
              poRef: data.poRef,
              itemCode: line.itemCode ?? "",
              description: line.description,
              department: line.department,
              unit: line.unit,
              ordered: line.ordered,
              received: line.received,
              short: line.short,
              excess: line.excess,
              rejected: line.rejected,
              accepted: line.accepted,
            };
            return (
              <View key={line.lineNo} style={s.row} wrap={false}>
                {COLS.map((col, index) => (
                  <Text
                    key={col.key}
                    style={[
                      s.td,
                      ...colStyle(col.width, index === COLS.length - 1),
                      col.num ? s.num : {},
                    ]}
                  >
                    {values[col.key]}
                  </Text>
                ))}
              </View>
            );
          })}
        </View>

        <View style={s.remarks} wrap={false}>
          <Text style={s.panelTitle}>Remarks</Text>
          <Text style={{ padding: 5, minHeight: 24 }}>
            {data.remarks ?? ""}
          </Text>
        </View>

        <View style={s.signRow} wrap={false}>
          {data.signatories.map((signatory, index) => (
            <SignatureBox key={index} signatory={signatory} />
          ))}
        </View>

        <PdfFooterImage layout={footer} />
        <View
          style={[
            s.footer,
            footer ? { bottom: footer.textBottom } : {},
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
