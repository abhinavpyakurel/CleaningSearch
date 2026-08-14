import type { Tables } from "@/lib/database.types";
import { normalizeCity, normalizeStateCode, normalizeZipCode } from "@/lib/location/zip";

export type CleanerServiceArea = Pick<
  Tables<"cleaner_service_areas">,
  | "city"
  | "state"
  | "zip_code"
  | "radius_miles"
  | "lat"
  | "lng"
  | "is_active"
>;

export type ClientSearchLocation = {
  zip_code: string;
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  state?: string | null;
};

export function isServiceAreaComplete(
  area: Partial<CleanerServiceArea> | null | undefined
): boolean {
  if (!area || area.is_active === false) {
    return false;
  }

  return (
    normalizeCity(area.city) != null &&
    normalizeStateCode(area.state) != null &&
    normalizeZipCode(area.zip_code) != null &&
    area.radius_miles != null &&
    Number.isFinite(area.radius_miles) &&
    area.radius_miles > 0
  );
}

export function formatServiceAreaLocation(
  area: Pick<CleanerServiceArea, "city" | "state">
): string {
  const city = normalizeCity(area.city);
  const state = normalizeStateCode(area.state);

  if (!city || !state) {
    return "";
  }

  return `${city}, ${state}`;
}

export function formatServiceRadiusLabel(radiusMiles: number | null): string | null {
  if (radiusMiles == null || !Number.isFinite(radiusMiles) || radiusMiles <= 0) {
    return null;
  }

  const label = radiusMiles === 1 ? "mile" : "miles";
  return `Within ${radiusMiles} ${label}`;
}

export function formatServingBlock(
  area: Pick<CleanerServiceArea, "city" | "state" | "radius_miles">
): { locationLine: string; radiusLine: string | null } | null {
  const locationLine = formatServiceAreaLocation(area);
  const radiusLine = formatServiceRadiusLabel(area.radius_miles);

  if (!locationLine) {
    return null;
  }

  return { locationLine, radiusLine };
}
