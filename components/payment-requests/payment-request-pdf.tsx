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
  note: string | null;
  /** Instalments against the PO, shown when this request is not a single full payment. */
  history: {
    poNumber: string;
    poTotal: string;
    rows: {
      label: string;
      number: string;
      date: string;
      status: string;
      amount: string;
      balance: string;
      current: boolean;
    }[];
    totalRequested: string;
    remaining: string;
  } | null;
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
  note: { marginTop: 10, borderWidth: 1, borderColor: BORDER },
  noteLabel: {
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#f5f5f5",
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  noteBody: { padding: 5, lineHeight: 1.35, minHeight: 22 },
  history: { marginTop: 10, borderWidth: 1, borderColor: BORDER, fontSize: 8.5 },
  historyTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#f5f5f5",
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  hRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER },
  hHead: { fontFamily: "Helvetica-Bold", backgroundColor: "#fafafa" },
  hCurrent: { backgroundColor: "#fdf3e7" },
  hCell: { paddingVertical: 3, paddingHorizontal: 5, borderRightWidth: 1, borderRightColor: BORDER },
  hNum: { textAlign: "right" },
  signRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  signBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 7,
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

const SIGN_HEIGHT = 130;
const MIN_SIGN_HEIGHT = 80;

/**
 * Signature box height that keeps the payment history on page 1: the two rows
 * of boxes give up the space the table needs beyond what is already free.
 */
function signatureHeight(historyRows: number) {
  if (historyRows === 0) return SIGN_HEIGHT;
  // Measured: about 60pt for the table's title, header and total rows plus 16.4pt per payment.
  const tableHeight = 64 + historyRows * 17;
  // Free space under 130pt boxes when Description and Note fit on one line each; 8pt safety margin.
  const freeBelowBoxes = 70 - 8;
  const shrink = Math.max(0, Math.ceil((tableHeight - freeBelowBoxes) / 2));
  return Math.max(MIN_SIGN_HEIGHT, SIGN_HEIGHT - shrink);
}

function SignatureBox({ title, name, height }: { title?: string; name?: string; height: number }) {
  return (
    <View style={[s.signBox, { height }]}>
      {title ? <Text style={s.signTitle}>{title}</Text> : <Text> </Text>}
      {name && <Text style={[s.muted, { marginTop: 2 }]}>{name}</Text>}
      <View style={s.signLine}>
        <Text>Signature</Text>
        <Text>Date</Text>
      </View>
    </View>
  );
}

const HISTORY_COLS = [
  { key: "label", header: "Payment", width: 78, num: false },
  { key: "number", header: "PR No", width: 0, num: false },
  { key: "date", header: "Date", width: 72, num: false },
  { key: "status", header: "Status", width: 62, num: false },
  { key: "amount", header: "Amount", width: 92, num: true },
  { key: "balance", header: "Balance after", width: 92, num: true },
] as const;

function historyCell(width: number, num: boolean, last: boolean) {
  return [s.hCell, width ? { width } : { flex: 1 }, num ? s.hNum : {}, last ? { borderRightWidth: 0 } : {}];
}

/** Every instalment against the PO up to this request, with the running balance. */
function PaymentHistory({ history }: { history: NonNullable<PaymentRequestPdfData["history"]> }) {
  const lastIndex = HISTORY_COLS.length - 1;
  return (
    <View style={s.history} wrap={false}>
      <View style={s.historyTitle}>
        <Text>Payment history · {history.poNumber}</Text>
        <Text>PO total: {history.poTotal}</Text>
      </View>
      <View style={[s.hRow, s.hHead]}>
        {HISTORY_COLS.map((col, index) => (
          <Text key={col.key} style={historyCell(col.width, col.num, index === lastIndex)}>
            {col.header}
          </Text>
        ))}
      </View>
      {history.rows.map((row) => (
        <View key={row.number} style={[s.hRow, row.current ? s.hCurrent : {}]}>
          {HISTORY_COLS.map((col, index) => (
            <Text
              key={col.key}
              style={[...historyCell(col.width, col.num, index === lastIndex), row.current ? s.bold : {}]}
            >
              {row[col.key]}
            </Text>
          ))}
        </View>
      ))}
      <View style={[s.hRow, s.hHead, { borderBottomWidth: 0 }]}>
        <Text style={[s.hCell, { flex: 1 }]}>Total requested · Remaining on PO</Text>
        <Text style={historyCell(92, true, false)}>{history.totalRequested}</Text>
        <Text style={historyCell(92, true, true)}>{history.remaining}</Text>
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
  const signHeight = signatureHeight(data.history?.rows.length ?? 0);
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

        <View style={s.note} wrap={false}>
          <Text style={s.noteLabel}>Note:-</Text>
          <Text style={s.noteBody}>{data.note ?? ""}</Text>
        </View>

        <View wrap={false}>
          <View style={s.signRow}>
            <SignatureBox title="Prepared By" name={data.preparedBy} height={signHeight} />
            <SignatureBox title="Checked By" name="Accounts Dept." height={signHeight} />
            <SignatureBox title="Approved By" name="General Manager" height={signHeight} />
          </View>
          <View style={s.signRow}>
            <SignatureBox title="Executive Director" height={signHeight} />
            <SignatureBox title="Finance Department" height={signHeight} />
            <SignatureBox height={signHeight} />
          </View>
        </View>

        {data.history && <PaymentHistory history={data.history} />}

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
