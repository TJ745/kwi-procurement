import { TZDate } from "@date-fns/tz";
import type { Metadata } from "next";

import { ImageUpload } from "@/components/admin/image-upload";
import {
  CompanySettingsForm,
  DocumentSequenceForm,
  PurchaseOrderDefaultsForm,
  RegionalSettingsForm,
  SecuritySettingsForm,
} from "@/components/admin/settings-forms";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  removeCompanyLogo,
  removePrintFooter,
  updateCompanySettings,
  updateDocumentSequence,
  updatePurchaseOrderDefaults,
  updateRegionalSettings,
  updateSecuritySettings,
  uploadCompanyLogo,
  uploadPrintFooter,
} from "@/lib/actions/settings";
import { currencyOptions } from "@/lib/currencies";
import { getEditableSettings } from "@/lib/data/admin";
import { DOCUMENT_TYPES } from "@/lib/document-numbering";
import { getNavItem } from "@/lib/navigation";
import { requireSuperAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

function timeZoneOptions() {
  const zones = Intl.supportedValuesOf("timeZone");
  return ["UTC", ...zones.filter((zone) => zone !== "UTC")].map((zone) => ({
    value: zone,
    label: zone.replaceAll("_", " "),
  }));
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">{children}</CardContent>
    </Card>
  );
}

export default async function Page() {
  const { settings: current } = await requireSuperAdmin();
  const { settings, sequences } = await getEditableSettings();
  const item = getNavItem("/settings");
  const s = settings ?? current;
  const currentYear = new TZDate(new Date(), s.timeZone).getFullYear();
  const logoUrl = s.companyLogoType
    ? `/api/settings/logo?v=${s.updatedAt.getTime()}`
    : null;
  const footerUrl = s.printFooterType
    ? `/api/settings/footer?v=${s.updatedAt.getTime()}`
    : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={item.title} description={item.description} />

      <Section
        title="Company profile"
        description="Your organisation's details, for use on future procurement documents."
      >
        <ImageUpload
          noun="logo"
          imageUrl={logoUrl}
          upload={uploadCompanyLogo}
          remove={removeCompanyLogo}
          accept="image/png,image/jpeg,image/webp"
          maxBytes={512 * 1024}
          hint="PNG, JPEG or WebP, up to 512 KB."
        />
        <CompanySettingsForm
          action={updateCompanySettings}
          defaultValues={{
            companyName: s.companyName ?? "",
            companyAddress: s.companyAddress ?? "",
            companyVat: s.companyVat ?? "",
            companyCr: s.companyCr ?? "",
            companyPhone: s.companyPhone ?? "",
            companyEmail: s.companyEmail ?? "",
          }}
        />
      </Section>

      <Section
        title="Print footer"
        description="Printed across the bottom of every page of printed lists, reports and document PDFs."
      >
        <ImageUpload
          noun="footer"
          imageUrl={footerUrl}
          upload={uploadPrintFooter}
          remove={removePrintFooter}
          accept="image/png,image/jpeg"
          maxBytes={1024 * 1024}
          hint="PNG or JPEG, up to 1 MB. A wide banner works best, e.g. 2400 × 200 pixels."
          wide
        />
      </Section>

      <Section
        title="Regional"
        description="Dates across the app use this time zone and format. The currency is the default for future documents."
      >
        <RegionalSettingsForm
          action={updateRegionalSettings}
          currencies={currencyOptions()}
          timeZones={timeZoneOptions()}
          defaultValues={{ currency: s.currency, timeZone: s.timeZone, dateFormat: s.dateFormat }}
        />
      </Section>

      <Section title="Security" description="Sign-in session length and password policy.">
        <SecuritySettingsForm
          action={updateSecuritySettings}
          defaultValues={{
            sessionDurationHours: String(s.sessionDurationHours),
            minPasswordLength: String(s.minPasswordLength),
          }}
        />
      </Section>

      <Section
        title="Purchase order defaults"
        description="Starting values for new purchase orders."
      >
        <PurchaseOrderDefaultsForm
          action={updatePurchaseOrderDefaults}
          defaultValues={{
            defaultVatRate: s.defaultVatRate.toString(),
            purchaseOrderTerms: s.purchaseOrderTerms ?? "",
          }}
        />
      </Section>

      <Section
        title="Document numbering"
        description="Number format for procurement documents. Numbers are assigned when those modules are built."
      >
        {DOCUMENT_TYPES.map(({ type, label }) => {
          const sequence = sequences.find((row) => row.type === type);
          if (!sequence) return null;
          // Mirrors allocateDocumentNumber: a yearly restart is due.
          const restartDue =
            sequence.includeYear &&
            sequence.resetYearly &&
            sequence.counterYear !== null &&
            sequence.counterYear !== currentYear;
          return (
            <DocumentSequenceForm
              key={type}
              label={label}
              currentYear={currentYear}
              action={updateDocumentSequence.bind(null, type)}
              defaultValues={{
                prefix: sequence.prefix,
                includeYear: sequence.includeYear,
                resetYearly: sequence.resetYearly,
                padding: String(sequence.padding),
                nextNumber: String(restartDue ? 1 : sequence.nextNumber),
              }}
            />
          );
        })}
      </Section>
    </div>
  );
}
