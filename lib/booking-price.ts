/** Platform service fee on cleaner labor (see project rules). */
export const PLATFORM_SERVICE_FEE_RATE = 0.15;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export type BookingPricing = {
  base_price: number;
  platform_fee: number;
  total_price: number;
};

export type BookingPricingCents = {
  service_price_cents: number;
  platform_fee_cents: number;
  total_price_cents: number;
};

export type AcceptedBookingPricingCents = {
  cleaner_payout_cents: number;
  platform_fee_cents: number;
  total_price_cents: number;
};

export function computeBookingPricing(
  hourlyRate: number,
  durationHours: number
): BookingPricing {
  const base_price = round2(hourlyRate * durationHours);
  const platform_fee = round2(base_price * PLATFORM_SERVICE_FEE_RATE);
  const total_price = round2(base_price + platform_fee);

  return { base_price, platform_fee, total_price };
}

export function computeBookingPricingCents(
  hourlyRate: number,
  clientRequestedHours: number
): BookingPricingCents {
  const service_price_cents = Math.round(hourlyRate * clientRequestedHours * 100);
  const platform_fee_cents = Math.round(
    service_price_cents * PLATFORM_SERVICE_FEE_RATE
  );
  const total_price_cents = service_price_cents + platform_fee_cents;

  return { service_price_cents, platform_fee_cents, total_price_cents };
}

export function computeAcceptedBookingPricingCents(
  hourlyRate: number,
  hours: number
): AcceptedBookingPricingCents {
  const cleaner_payout_cents = Math.round(hourlyRate * hours * 100);
  const platform_fee_cents = Math.round(
    cleaner_payout_cents * PLATFORM_SERVICE_FEE_RATE
  );
  const total_price_cents = cleaner_payout_cents + platform_fee_cents;

  return { cleaner_payout_cents, platform_fee_cents, total_price_cents };
}

type BookingPriceFields = {
  total_price: number | null;
  base_price: number | null;
  platform_fee: number | null;
};

/** Total from stored booking fields only (no live cleaner rate). */
export function getBookingTotalAmount(
  booking: BookingPriceFields
): number | null {
  if (
    booking.total_price != null &&
    Number.isFinite(booking.total_price)
  ) {
    return booking.total_price;
  }

  if (
    booking.base_price != null &&
    Number.isFinite(booking.base_price) &&
    booking.platform_fee != null &&
    Number.isFinite(booking.platform_fee)
  ) {
    return round2(booking.base_price + booking.platform_fee);
  }

  return null;
}

export function formatUsd(amount: number | null): string {
  if (amount == null || !Number.isFinite(amount)) {
    return "—";
  }

  const rounded = Number.isInteger(amount) ? amount : amount.toFixed(2);
  return `$${rounded}`;
}

export function formatUsdFromCents(cents: number | null): string {
  if (cents == null || !Number.isFinite(cents)) {
    return "—";
  }

  return formatUsd(cents / 100);
}

export function formatHourlyRate(rate: number | null): string {
  if (rate == null || !Number.isFinite(rate)) {
    return "Rate not set";
  }

  const rounded = Number.isInteger(rate) ? rate : rate.toFixed(2);
  return `$${rounded}/hr`;
}
