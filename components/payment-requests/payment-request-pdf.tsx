import "server-only";

import {
  Document,
  Font,
  Image,
  Page,
  Polyline,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";

import {
  A4_WIDTH,
  PdfFooterImage,
  pdfFooterLayout,
} from "@/components/print/pdf-footer-image";

import {
  OTHERS_ITEM,
  PAYMENT_ITEM_GROUPS,
  PAYMENT_PRIORITIES,
  PAYMENT_TYPES,
} from "@/lib/payment-request-options";
import type { PdfFooter, PdfImage } from "@/lib/pdf-images";

export type PaymentRequestPdfData = {
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
  items: string[];
  otherDetails: string | null;
  paymentType: string;
  priority: string;
  description: string;
  inFavorOf: string;
  project: string;
  amount: string;
  amountInWords: string;
  invoiceNo: string | null;
  quotationNo: string | null;
  poRef: string | null;
  preparedBy: string;
  generatedAt: string;
};

// Never split words with hyphens ("Vehi-cle"); wrap at spaces only. This applies to every PDF the server renders.
Font.registerHyphenationCallback((word) => [word]);

const BORDER = "#a3a3a3";
const MUTED = "#525252";

const s = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 30,
    fontSize: 9,
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
  company: { flexDirection: "row", gap: 10, maxWidth: "62%" },
  logo: { width: 65, height: 65, objectFit: "contain" },
  companyName: {
    fontSize: 12.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  muted: { color: MUTED },
  bold: { fontFamily: "Helvetica-Bold" },
  titleBlock: { alignItems: "flex-end" },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  // Columns size to their content first, so headings and labels stay on one line.
  groups: {
    flexDirection: "row",
    marginTop: 12,
    borderWidth: 1,
    borderColor: BORDER,
    fontSize: 8,
  },
  group: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  groupLast: { flexGrow: 1, flexShrink: 1, flexBasis: "auto", padding: 5 },
  groupTitle: { fontFamily: "Helvetica-Bold", marginBottom: 4 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },
  box: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: "#404040",
    alignItems: "center",
    justifyContent: "center",
  },
  refs: { marginTop: 10, borderWidth: 1, borderColor: BORDER },
  fields: { marginTop: 14, borderWidth: 1, borderColor: BORDER },
  fieldRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  fieldLabel: {
    width: 110,
    padding: 5,
    backgroundColor: "#f5f5f5",
    borderRightWidth: 1,
    borderRightColor: BORDER,
    fontFamily: "Helvetica-Bold",
  },
  fieldValue: { flex: 1, padding: 5 },
  third: { flex: 1, flexDirection: "row" },
  thirdLabel: { width: 74 },
  divider: { borderRightWidth: 1, borderRightColor: BORDER },
  signRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  signBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 7,
    height: 150,
  },
  signTitle: { fontFamily: "Helvetica-Bold", fontSize: 9.5 },
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
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: MUTED,
  },
});

function Box({ checked, label }: { checked: boolean; label: string }) {
  return (
    <View style={s.option}>
      <View style={s.box}>
        {/* Drawn, not typed: the built-in PDF fonts have no ✓ character. */}
        {checked && (
          <Svg width={7} height={7} viewBox="0 0 10 10">
            <Polyline points="1.2,5.4 4,8.2 8.8,1.8" stroke="#171717" strokeWidth={1.8} fill="none" />
          </Svg>
        )}
      </View>
      <Text>{label}</Text>
    </View>
  );
}

function FieldRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string | null;
  last?: boolean;
}) {
  return (
    <View style={[s.fieldRow, last ? { borderBottomWidth: 0 } : {}]}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value || "—"}</Text>
    </View>
  );
}

function SignatureBox({ title, name }: { title?: string; name?: string }) {
  return (
    <View style={s.signBox}>
      {title ? <Text style={s.signTitle}>{title}</Text> : <Text> </Text>}
      {name && <Text style={[s.muted, { marginTop: 2 }]}>{name}</Text>}
      <View style={s.signLine}>
        <Text>Signature</Text>
        <Text>Date</Text>
      </View>
    </View>
  );
}

export function PaymentRequestPdf({ data }: { data: PaymentRequestPdfData }) {
  const { company } = data;
  const footer = pdfFooterLayout(company.footer, {
    pageWidth: A4_WIDTH.portrait,
    inset: 30,
  });
  const ticked = new Set(data.items);
  const registration = [
    company.vat && `VAT: ${company.vat}`,
    company.cr && `CR: ${company.cr}`,
  ]
    .filter(Boolean)
    .join("   ");
  const contact = [company.phone, company.email].filter(Boolean).join("   ");

  return (
    <Document
      title={`Payment Request ${data.number}`}
      author={company.name ?? undefined}
      creator="Procurement Management"
    >
      <Page
        size="A4"
        style={[s.page, footer ? { paddingBottom: footer.padding } : {}]}
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
            <Text style={s.title}>PAYMENT REQUEST</Text>
            <Text style={[s.bold, { fontSize: 11, marginTop: 4 }]}>
              {data.number}
            </Text>
            <Text style={[s.muted, { marginTop: 2 }]}>Date: {data.date}</Text>
            <Text style={s.muted}>Status: {data.status}</Text>
          </View>
        </View>

        <View style={s.groups}>
          {PAYMENT_ITEM_GROUPS.map((group) => (
            <View key={group.key} style={s.group}>
              <Text style={s.groupTitle}>{group.label}</Text>
              {group.items.map((item) => (
                <Box
                  key={item.key}
                  checked={ticked.has(item.key)}
                  label={
                    item.key === OTHERS_ITEM && data.otherDetails
                      ? `Others: ${data.otherDetails}`
                      : item.label
                  }
                />
              ))}
            </View>
          ))}
          <View style={s.group}>
            <Text style={s.groupTitle}>Type of Payment</Text>
            {PAYMENT_TYPES.map((option) => (
              <Box
                key={option.value}
                checked={data.paymentType === option.value}
                label={option.label}
              />
            ))}
          </View>
          <View style={s.groupLast}>
            <Text style={s.groupTitle}>Priority</Text>
            {PAYMENT_PRIORITIES.map((option) => (
              <Box
                key={option.value}
                checked={data.priority === option.value}
                label={option.label}
              />
            ))}
          </View>
        </View>

        <View style={s.refs}>
          <View style={[s.fieldRow, { borderBottomWidth: 0 }]}>
            <View style={s.third}>
              <Text style={[s.fieldLabel, s.thirdLabel]}>Invoice No</Text>
              <Text style={[s.fieldValue, s.divider]}>
                {data.invoiceNo || "—"}
              </Text>
            </View>
            <View style={s.third}>
              <Text style={[s.fieldLabel, s.thirdLabel]}>Quotation No</Text>
              <Text style={[s.fieldValue, s.divider]}>
                {data.quotationNo || "—"}
              </Text>
            </View>
            <View style={s.third}>
              <Text style={[s.fieldLabel, s.thirdLabel]}>PO Ref</Text>
              <Text style={s.fieldValue}>{data.poRef || "—"}</Text>
            </View>
          </View>
        </View>

        <View style={s.fields}>
          <FieldRow label="Description" value={data.description} />
          <FieldRow label="In Favor of" value={data.inFavorOf} />
          <FieldRow label="Project" value={data.project} />
          <FieldRow label="Amount" value={data.amount} />
          <FieldRow label="Amount in Words" value={data.amountInWords} last />
        </View>

        <View wrap={false} style={{ marginTop: 18 }}>
          <View style={s.signRow}>
            <SignatureBox title="Prepared By" name={data.preparedBy} />
            <SignatureBox title="Checked By" name="Accounts Dept." />
            <SignatureBox title="Approved By" name="General Manager" />
          </View>
          <View style={s.signRow}>
            <SignatureBox title="Executive Director" />
            <SignatureBox title="Finance Department" />
            <SignatureBox />
          </View>
        </View>

        <PdfFooterImage layout={footer} />
        <View
          style={[s.footer, footer ? { bottom: footer.textBottom } : {}]}
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
