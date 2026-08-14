import { isWithinRadiusMiles } from "@/lib/location/distance";
import {
  citiesMatch,
  normalizeStateCode,
  normalizeZipCode,
} from "@/lib/location/zip";
import {
  type CleanerServiceArea,
  type ClientSearchLocation,
  isServiceAreaComplete,
} from "@/lib/location/service-area";

export const PROXIMITY_TIER = {
  SAME_ZIP: 100,
  WITHIN_RADIUS: 80,
  SAME_CITY: 60,
  NONE: 0,
} as const;

export type ProximityTier = (typeof PROXIMITY_TIER)[keyof typeof PROXIMITY_TIER];

export type DiscoverableCleaner = {
  user_id: string;
  avg_rating: number;
  total_jobs: number;
  service_area: CleanerServiceArea;
};

export type RankedCleaner<T extends DiscoverableCleaner> = T & {
  proximity_tier: ProximityTier;
  location_label: string | null;
};

export function getProximityTier(
  serviceArea: CleanerServiceArea,
  clientLocation: ClientSearchLocation
): ProximityTier {
  if (!isServiceAreaComplete(serviceArea)) {
    return PROXIMITY_TIER.NONE;
  }

  const clientZip = normalizeZipCode(clientLocation.zip_code);
  const cleanerZip = normalizeZipCode(serviceArea.zip_code);

  if (clientZip && cleanerZip && clientZip === cleanerZip) {
    return PROXIMITY_TIER.SAME_ZIP;
  }

  if (
    isWithinRadiusMiles(
      clientLocation.lat,
      clientLocation.lng,
      serviceArea.lat,
      serviceArea.lng,
      serviceArea.radius_miles
    )
  ) {
    return PROXIMITY_TIER.WITHIN_RADIUS;
  }

  const clientState = normalizeStateCode(clientLocation.state);
  const cleanerState = normalizeStateCode(serviceArea.state);

  if (
    clientState &&
    cleanerState &&
    clientState === cleanerState &&
    citiesMatch(clientLocation.city, serviceArea.city)
  ) {
    return PROXIMITY_TIER.SAME_CITY;
  }

  return PROXIMITY_TIER.NONE;
}

export function getLocationLabel(
  tier: ProximityTier,
  serviceArea: Pick<CleanerServiceArea, "city" | "state">
): string | null {
  if (tier === PROXIMITY_TIER.SAME_ZIP || tier === PROXIMITY_TIER.WITHIN_RADIUS) {
    return "Serving your area";
  }

  if (tier === PROXIMITY_TIER.SAME_CITY) {
    const city = serviceArea.city?.trim();
    return city ? `Serving ${city}` : null;
  }

  return null;
}

export function cleanerMatchesClientSearch(
  serviceArea: CleanerServiceArea,
  clientLocation: ClientSearchLocation
): boolean {
  return getProximityTier(serviceArea, clientLocation) > PROXIMITY_TIER.NONE;
}

export function rankDiscoverableCleaners<T extends DiscoverableCleaner>(
  cleaners: T[],
  clientLocation: ClientSearchLocation
): RankedCleaner<T>[] {
  const ranked = cleaners
    .map((cleaner) => {
      const proximity_tier = getProximityTier(
        cleaner.service_area,
        clientLocation
      );

      return {
        ...cleaner,
        proximity_tier,
        location_label: getLocationLabel(
          proximity_tier,
          cleaner.service_area
        ),
      };
    })
    .filter((cleaner) => cleaner.proximity_tier > PROXIMITY_TIER.NONE);

  ranked.sort((a, b) => {
    if (b.proximity_tier !== a.proximity_tier) {
      return b.proximity_tier - a.proximity_tier;
    }

    if (b.avg_rating !== a.avg_rating) {
      return b.avg_rating - a.avg_rating;
    }

    if (b.total_jobs !== a.total_jobs) {
      return b.total_jobs - a.total_jobs;
    }

    return a.user_id.localeCompare(b.user_id);
  });

  return ranked;
}
