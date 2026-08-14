const ZIP_PATTERN = /^\d{5}$/;

const US_STATE_CODES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC",
]);

export function normalizeZipCode(value: string | null | undefined): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length !== 5) {
    return null;
  }

  return digits;
}

export function isValidZipCode(value: string | null | undefined): boolean {
  const normalized = normalizeZipCode(value);
  return normalized != null && ZIP_PATTERN.test(normalized);
}

export function normalizeStateCode(
  value: string | null | undefined
): string | null {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();

  if (!US_STATE_CODES.has(normalized)) {
    return null;
  }

  return normalized;
}

export function normalizeCity(value: string | null | undefined): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function citiesMatch(
  left: string | null | undefined,
  right: string | null | undefined
): boolean {
  const a = normalizeCity(left);
  const b = normalizeCity(right);

  if (!a || !b) {
    return false;
  }

  return a.localeCompare(b, "en-US", { sensitivity: "accent" }) === 0;
}
