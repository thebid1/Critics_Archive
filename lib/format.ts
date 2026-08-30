/**
 * Currency display helpers — CRITICS ARCHIVE sells in Naira (Paystack's home
 * currency); GBP/USD/EUR kept for dev/legacy. Prices are stored as whole
 * minor-free integers (e.g. 25000 = ₦25,000).
 */
export const CURRENCY_SYMBOL: Record<string, string> = {
  NGN: "₦",
  GBP: "£",
  USD: "$",
  EUR: "€",
};

export function formatPrice(currency: string, amount: number): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? `${currency} `;
  return `${symbol}${amount.toLocaleString("en-NG")}`;
}