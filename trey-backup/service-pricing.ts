export const SERVICE_CURRENCIES = [
  { code: "INR", label: "Indian Rupee", symbol: "₹", payment: "Razorpay" },
] as const;

export type ServiceCurrency = (typeof SERVICE_CURRENCIES)[number]["code"];

export function normalizeServiceCurrency(currency: string | null | undefined): ServiceCurrency {
  const normalized = (currency || "INR").toUpperCase();
  return SERVICE_CURRENCIES.some((item) => item.code === normalized)
    ? (normalized as ServiceCurrency)
    : "INR";
}

export function getServiceCurrencyMeta(currency: string | null | undefined) {
  const normalized = normalizeServiceCurrency(currency);
  return SERVICE_CURRENCIES.find((item) => item.code === normalized) || SERVICE_CURRENCIES[0];
}

export function getServiceAmount(price: string): number | null {
  const match = price.replace(/,/g, "").match(/\d+(?:\.\d{1,2})?/);
  return match ? Number(match[0]) : null;
}

export function formatServicePrice(price: string, currency: string | null | undefined): string {
  const meta = getServiceCurrencyMeta(currency);
  const amount = getServiceAmount(price);

  if (amount === null) {
    return price;
  }

  const formattedAmount = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${meta.symbol}${formattedAmount}`;
}
