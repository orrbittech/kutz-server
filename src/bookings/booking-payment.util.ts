import type { StyleEntity } from '../database/entities/style.entity';

/** Stripe card minimum for ZAR (100 cents = R1). Below this we confirm without charging. */
export const STRIPE_MIN_ZAR_CHARGE_CENTS = 100;

export function sumStylePricesCents(
  styles: Pick<StyleEntity, 'priceCents'>[],
): number {
  return styles.reduce((acc, s) => acc + (s.priceCents ?? 0), 0);
}

export function bookingRequiresCardPayment(totalCents: number): boolean {
  return totalCents >= STRIPE_MIN_ZAR_CHARGE_CENTS;
}
