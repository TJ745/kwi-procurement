/** ISO 4217 currencies supported by the runtime, e.g. "KWD — Kuwaiti Dinar". */
export function currencyOptions() {
  const names = new Intl.DisplayNames(["en"], { type: "currency" });
  return Intl.supportedValuesOf("currency").map((code) => ({
    value: code,
    label: `${code} — ${names.of(code) ?? code}`,
  }));
}
