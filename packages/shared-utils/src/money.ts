/**
 * Money handling: store as integer minor units + currency code.
 * NEVER use floats for money.
 */

export interface MoneyAmount {
  /** Amount in the smallest unit (cents for USD, fen for CNY, satang for THB, etc.) */
  amount: number;
  /** ISO 4217 code, uppercase. */
  currency: string;
}

const CURRENCY_FRACTION_DIGITS: Record<string, number> = {
  USD: 2, EUR: 2, GBP: 2, CNY: 2, JPY: 0, KRW: 0, THB: 2, IDR: 0, VND: 0, SGD: 2,
};

export function formatMoney(m: MoneyAmount, locale = 'en-US'): string {
  const fraction = CURRENCY_FRACTION_DIGITS[m.currency] ?? 2;
  const value = m.amount / Math.pow(10, fraction);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: m.currency,
  }).format(value);
}
