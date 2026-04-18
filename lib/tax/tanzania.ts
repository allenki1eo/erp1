/**
 * Tanzania tax helpers — Beverage industry.
 * Rates are configurable via tax_code / excise_rate tables;
 * these constants are sensible defaults for seeding/UI hints.
 *
 * Refs: Tanzania Revenue Authority (TRA) — VAT Act, Excise Duty Act.
 * Verify current rates with finance before relying in production.
 */

export const TZ_VAT_STANDARD = 0.18;       // 18% standard VAT
export const TZ_VAT_ZERO = 0;
export const TZ_WITHHOLDING_GENERAL = 0.02;

export type ProductClass = "BEER" | "SPIRIT" | "WINE" | "NON_ALC";

/**
 * Default placeholder excise rates (TZS).
 * IMPORTANT: replace with current TRA-published rates per fiscal year.
 */
export const DEFAULT_EXCISE_TZS: Record<ProductClass, { perLitre?: number; perLoA?: number }> = {
  BEER: { perLitre: 765 },           // per litre of beer (placeholder)
  SPIRIT: { perLitre: 3655 },        // per litre of finished spirit (placeholder)
  WINE: { perLitre: 2466 },
  NON_ALC: { perLitre: 0 },
};

export interface ExciseInput {
  productClass: ProductClass;
  litres: number;
  abv?: number;                       // 0..1 (e.g. 0.40 for 40%)
  ratePerLitre?: number;
  ratePerLoA?: number;                // per litre of absolute alcohol
}

export function calculateExcise(input: ExciseInput): number {
  const { litres, abv, ratePerLitre, ratePerLoA, productClass } = input;
  if (ratePerLoA && abv != null) {
    return litres * abv * ratePerLoA;
  }
  const perL = ratePerLitre ?? DEFAULT_EXCISE_TZS[productClass]?.perLitre ?? 0;
  return litres * perL;
}

export function calculateVat(taxableAmount: number, rate: number = TZ_VAT_STANDARD): number {
  return Math.round(taxableAmount * rate * 100) / 100;
}

export interface InvoiceTaxBreakdown {
  subtotal: number;
  excise: number;
  vat: number;
  total: number;
}

/**
 * Tanzania convention: excise is added to the price base, then VAT is on (price + excise).
 */
export function buildInvoiceTax(opts: {
  netSubtotal: number;
  exciseTotal: number;
  vatRate?: number;
}): InvoiceTaxBreakdown {
  const { netSubtotal, exciseTotal, vatRate = TZ_VAT_STANDARD } = opts;
  const vat = calculateVat(netSubtotal + exciseTotal, vatRate);
  return {
    subtotal: netSubtotal,
    excise: exciseTotal,
    vat,
    total: netSubtotal + exciseTotal + vat,
  };
}
