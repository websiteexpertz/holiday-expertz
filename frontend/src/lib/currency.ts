/**
 * Global Holiday Expertz Currency Standardization Utility
 * Standard Currency: United States Dollar (USD - $)
 */

export const STANDARD_CURRENCY = "USD";
export const STANDARD_CURRENCY_SYMBOL = "$";

export interface FormatPriceOptions {
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Formats a monetary amount into a clean currency string.
 * Defaults to USD ($).
 *
 * Examples:
 * - 100 -> "$100"
 * - 250 -> "$250"
 * - 1250 -> "$1,250"
 * - 1250.50 -> "$1,250.50"
 * - 10000 -> "$10,000"
 */
export function formatPrice(
  amount: number | string | undefined | null,
  options?: FormatPriceOptions
): string {
  if (amount === undefined || amount === null || amount === "" || isNaN(Number(amount))) {
    return "$0";
  }

  const numeric = Number(amount);
  const currency = (options?.currency || STANDARD_CURRENCY).toUpperCase();
  const isUSD = currency === "USD";

  // Use 0 decimal places for whole numbers, 2 for fractional numbers unless overridden
  const minDigits = options?.minimumFractionDigits ?? (numeric % 1 === 0 ? 0 : 2);
  const maxDigits = options?.maximumFractionDigits ?? 2;

  try {
    return new Intl.NumberFormat(isUSD ? "en-US" : "en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
    }).format(numeric);
  } catch {
    const symbol = isUSD ? "$" : currency === "INR" ? "₹" : `${currency} `;
    return `${symbol}${numeric.toLocaleString("en-US", {
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
    })}`;
  }
}

/**
 * Returns plain numeric string with comma formatting (without currency symbol)
 */
export function formatAmountNumber(
  amount: number | string | undefined | null,
  maximumFractionDigits = 2
): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return "0";
  return Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}
