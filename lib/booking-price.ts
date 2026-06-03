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

export function computeBookingPricing(
  hourlyRate: number,
  durationHours: number
): BookingPricing {
  const base_price = round2(hourlyRate * durationHours);
  const platform_fee = round2(base_price * PLATFORM_SERVICE_FEE_RATE);
  const total_price = round2(base_price + platform_fee);

  return { base_price, platform_fee, total_price };
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

export function formatHourlyRate(rate: number | null): string {
  if (rate == null || !Number.isFinite(rate)) {
    return "Rate not set";
  }

  const rounded = Number.isInteger(rate) ? rate : rate.toFixed(2);
  return `$${rounded}/hr`;
}
