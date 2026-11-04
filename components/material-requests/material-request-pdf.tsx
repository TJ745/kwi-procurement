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

import type { PdfFooter, PdfImage } from "@/lib/pdf-images";
import {
  MATERIAL_REQUEST_STATUS_LABELS,
  type MaterialRequestStatusValue,
} from "@/lib/validation/material-request";

export type MaterialRequestPdfData = {
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
    footer: PdfFooter | null;
  };
  number: string;
  requestDate: string;
  status: MaterialRequestStatusValue;
  projectName: string;
  projectCode: string;
  department: string;
  category: string;
  supplier: string | null;
  createdBy: string;
  generatedAt: string;
  lines: {
    lineNo: number;
    name: string;
    unit: string;
    quantity: string;
    remarks: string | null;
  }[];
};

const BORDER = "#d4d4d4";
const MUTED = "#525252";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 56,
    paddingHorizontal: 36,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#171717",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: "#171717",
  },
  company: { flexDirection: "row", gap: 10, maxWidth: "60%" },
  logo: { width: 65, height: 65, objectFit: "contain" },
  companyName: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  muted: { color: MUTED },
  titleBlock: { alignItems: "flex-end" },
  title: { fontSize: 15, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  number: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 4 },
  info: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  infoCell: {
    width: "50%",
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  infoLabel: { width: 65, color: MUTED },
  infoValue: { flex: 1, fontFamily: "Helvetica-Bold" },
  table: { marginTop: 14, borderWidth: 1, borderColor: BORDER },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headRow: { backgroundColor: "#f5f5f5" },
  th: {
    fontFamily: "Helvetica-Bold",
    paddingVertical: 5,
    paddingHorizontal: 5,
    textAlign: "center",
  },
  td: { paddingVertical: 5, paddingHorizontal: 5 },
  colSr: {
    width: 40,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  colName: { flex: 3, borderRightWidth: 1, borderRightColor: BORDER },
  colUnit: {
    width: 60,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  colQty: {
    width: 70,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  colRemarks: { flex: 2 },
  // marginTop "auto" pushes the boxes to the bottom of the last page, just above the footer.
  signatures: {
    flexDirection: "row",
    gap: 12,
    marginTop: "auto",
    paddingTop: 24,
  },
  signBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 8,
    minHeight: 150,
  },
  signTitle: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  signName: { marginTop: 3, color: MUTED },
  signLine: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#737373",
    paddingTop: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    color: MUTED,
    fontSize: 8,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: MUTED,
  },
});

function InfoCell({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.infoCell}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "—"}</Text>
    </View>
  );
}

function SignatureBox({ title, name }: { title: string; name: string }) {
  return (
    <View style={styles.signBox} wrap={false}>
      <Text style={styles.signTitle}>{title}</Text>
      <Text style={styles.signName}>{name}</Text>
      <View style={styles.signLine}>
        <Text>Signature</Text>
        <Text>Date</Text>
      </View>
    </View>
  );
}

export function MaterialRequestPdf({ data }: { data: MaterialRequestPdfData }) {
  const { company } = data;
  const footer = pdfFooterLayout(company.footer, {
    pageWidth: A4_WIDTH.portrait,
    inset: 36,
  });
  const registration = [
    company.vat && `VAT: ${company.vat}`,
    company.cr && `CR: ${company.cr}`,
  ]
    .filter(Boolean)
    .join("   ");
  const contact = [company.phone, company.email].filter(Boolean).join("   ");

  return (
    <Document
      title={`Material Request ${data.number}`}
      author={company.name ?? undefined}
      creator="Procurement Management"
    >
      <Page
        size="A4"
        style={[styles.page, footer ? { paddingBottom: footer.padding } : {}]}
      >
        <View style={styles.header}>
          <View style={styles.company}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an HTML img */}
            {company.logo && <Image style={styles.logo} src={company.logo} />}
            <View>
              <Text style={styles.companyName}>
                {company.name ?? "Procurement Management"}
              </Text>
              {company.address && (
                <Text style={styles.muted}>{company.address}</Text>
              )}
              {registration && <Text style={styles.muted}>{registration}</Text>}
              {contact && <Text style={styles.muted}>{contact}</Text>}
            </View>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>MATERIAL REQUEST</Text>
            <Text style={styles.number}>{data.number}</Text>
            <Text style={[styles.muted, { marginTop: 2 }]}>
              Status: {MATERIAL_REQUEST_STATUS_LABELS[data.status]}
            </Text>
          </View>
        </View>

        <View style={styles.info}>
          <InfoCell label="Request date :" value={data.requestDate} />
          <InfoCell label="Project Name :" value={data.projectName} />
          <InfoCell label="Requested by :" value={data.department} />
          <InfoCell label="Project Code :" value={data.projectCode} />
          <InfoCell label="Supplier :" value={data.supplier} />
          <InfoCell label="Category :" value={data.category} />
        </View>

        <View style={styles.table}>
          <View style={[styles.row, styles.headRow]} fixed>
            <Text style={[styles.th, styles.colSr]}>Sr No</Text>
            <Text style={[styles.th, styles.colName]}>Material</Text>
            <Text style={[styles.th, styles.colUnit]}>Unit</Text>
            <Text style={[styles.th, styles.colQty]}>Quantity</Text>
            <Text style={[styles.th, styles.colRemarks]}>Remarks</Text>
          </View>
          {data.lines.map((line) => (
            <View key={line.lineNo} style={styles.row} wrap={false}>
              <Text style={[styles.td, styles.colSr]}>{line.lineNo}</Text>
              <Text style={[styles.td, styles.colName]}>{line.name}</Text>
              <Text style={[styles.td, styles.colUnit]}>{line.unit}</Text>
              <Text style={[styles.td, styles.colQty]}>{line.quantity}</Text>
              <Text style={[styles.td, styles.colRemarks]}>
                {line.remarks ?? ""}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.signatures} wrap={false}>
          <SignatureBox title="Reviewed By" name={data.createdBy} />
          <SignatureBox title="Authorized By" name={data.department} />
          <SignatureBox title="Approved By" name="General Manager" />
        </View>

        <PdfFooterImage layout={footer} />
        <View
          style={[styles.footer, footer ? { bottom: footer.textBottom } : {}]}
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
