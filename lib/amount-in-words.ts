import { currencyDigits } from "@/lib/money";

/**
 * English amount in words for payment documents, e.g.
 * "One Thousand Two Hundred Five Kuwaiti Dinars and Five Hundred Fils Only".
 * Works on the decimal string so large amounts stay exact.
 */

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const SCALES = ["", "Thousand", "Million", "Billion", "Trillion", "Quadrillion"];

/** Minor-unit names for common currencies (plural form). */
const MINOR_UNITS: Record<string, string> = {
  KWD: "Fils", BHD: "Fils", AED: "Fils", JOD: "Fils", IQD: "Fils", YER: "Fils",
  SAR: "Halalas", QAR: "Dirhams", OMR: "Baisa", EGP: "Piastres",
  USD: "Cents", EUR: "Cents", CAD: "Cents", AUD: "Cents", NZD: "Cents", SGD: "Cents", HKD: "Cents",
  GBP: "Pence", PKR: "Paisa", INR: "Paise", LKR: "Cents", BDT: "Poisha",
};
const NO_PLURAL = /(Yen|Yuan|Won|Baht|Rand|Renminbi)$/;

function underThousand(value: number) {
  const words: string[] = [];
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  if (hundreds) words.push(`${ONES[hundreds]} Hundred`);
  if (rest < 20) {
    if (rest) words.push(ONES[rest]);
  } else {
    words.push(TENS[Math.floor(rest / 10)] + (rest % 10 ? `-${ONES[rest % 10]}` : ""));
  }
  return words.join(" ");
}

/** Words for a non-negative integer given as digits. */
export function integerToWords(digits: string) {
  const clean = digits.replace(/^0+/, "");
  if (!clean) return "Zero";
  const groups: number[] = [];
  for (let end = clean.length; end > 0; end -= 3) {
    groups.unshift(Number(clean.slice(Math.max(0, end - 3), end)));
  }
  if (groups.length > SCALES.length) return clean; // beyond quadrillions: show digits
  return groups
    .map((group, index) => {
      if (!group) return "";
      const scale = SCALES[groups.length - 1 - index];
      return scale ? `${underThousand(group)} ${scale}` : underThousand(group);
    })
    .filter(Boolean)
    .join(" ");
}

function majorName(currency: string, singular: boolean) {
  let name = currency;
  try {
    name = new Intl.DisplayNames(["en"], { type: "currency" }).of(currency) ?? currency;
  } catch {
    // Unknown code: use it as is.
  }
  name = name.replace(/\b\w/g, (letter) => letter.toUpperCase());
  return singular || NO_PLURAL.test(name) ? name : `${name}s`;
}

export function amountInWords(amount: { toString(): string }, currency: string) {
  const digits = currencyDigits(currency);
  const [whole = "0", fraction = ""] = amount.toString().trim().split(".");
  const minorDigits = fraction.padEnd(digits, "0").slice(0, digits);
  const major = whole.replace(/^0+/, "");
  const minor = minorDigits.replace(/^0+/, "");

  const parts: string[] = [];
  if (major || !minor) {
    parts.push(`${integerToWords(major)} ${majorName(currency, major === "1")}`);
  }
  if (minor) {
    const unit = MINOR_UNITS[currency];
    parts.push(unit ? `${integerToWords(minor)} ${unit}` : `${minorDigits}/${"1".padEnd(digits + 1, "0")}`);
  }
  return `${parts.join(" and ")} Only`;
}
