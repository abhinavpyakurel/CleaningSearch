import type { Tables } from "@/lib/database.types";

export type CleanerAvailabilityWindow = Pick<
  Tables<"cleaner_availability_windows">,
  "day_of_week" | "start_time" | "end_time"
>;

export const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DAY_LABELS_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export const DEFAULT_AVAILABILITY_WINDOWS: CleanerAvailabilityWindow[] = [
  { day_of_week: 1, start_time: "09:00:00", end_time: "17:00:00" },
  { day_of_week: 2, start_time: "09:00:00", end_time: "17:00:00" },
  { day_of_week: 3, start_time: "09:00:00", end_time: "17:00:00" },
  { day_of_week: 4, start_time: "09:00:00", end_time: "17:00:00" },
  { day_of_week: 5, start_time: "09:00:00", end_time: "17:00:00" },
];

export const ACTIVE_BOOKING_STATUSES = [
  "pending",
  "countered",
  "accepted_pending_payment",
  "confirmed",
] as const;

export const DEFAULT_BOOKING_DURATION_HOURS = 2;

export const AVAILABILITY_OUTSIDE_WINDOW_ERROR =
  "This cleaner is not available at that time. Choose a time within their availability.";

export const BOOKING_OVERLAP_ERROR =
  "This cleaner already has a booking near that time. Please choose another time.";

export function normalizeTimeToMinutes(value: string): number | null {
  const trimmed = value.trim();
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

export function formatTimeForDisplay(time: string): string {
  const minutes = normalizeTimeToMinutes(time);
  if (minutes == null) {
    return time;
  }

  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(mins).padStart(2, "0")} ${period}`;
}

export function formatTimeForInput(time: string): string {
  const minutes = normalizeTimeToMinutes(time);
  if (minutes == null) {
    return "09:00";
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function getDayOfWeekFromDateString(date: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const localDate = new Date(year, month - 1, day);
  if (
    localDate.getFullYear() !== year ||
    localDate.getMonth() !== month - 1 ||
    localDate.getDate() !== day
  ) {
    return null;
  }

  return localDate.getDay();
}

export function buildScheduledAtIso(date: string, time: string): string | null {
  const dayOfWeek = getDayOfWeekFromDateString(date);
  const startMinutes = normalizeTimeToMinutes(time);
  if (dayOfWeek == null || startMinutes == null) {
    return null;
  }

  const scheduled = new Date(`${date}T${formatTimeForInput(time)}:00`);
  if (Number.isNaN(scheduled.getTime())) {
    return null;
  }

  return scheduled.toISOString();
}

export function getWindowForDay(
  windows: CleanerAvailabilityWindow[],
  dayOfWeek: number
): CleanerAvailabilityWindow | null {
  return windows.find((window) => window.day_of_week === dayOfWeek) ?? null;
}

export function isWithinAvailabilityWindow(
  windows: CleanerAvailabilityWindow[],
  date: string,
  time: string,
  durationHours: number = DEFAULT_BOOKING_DURATION_HOURS
): boolean {
  if (windows.length === 0) {
    return false;
  }

  const dayOfWeek = getDayOfWeekFromDateString(date);
  const startMinutes = normalizeTimeToMinutes(time);
  if (dayOfWeek == null || startMinutes == null) {
    return false;
  }

  const window = getWindowForDay(windows, dayOfWeek);
  if (!window) {
    return false;
  }

  const windowStart = normalizeTimeToMinutes(window.start_time);
  const windowEnd = normalizeTimeToMinutes(window.end_time);
  if (windowStart == null || windowEnd == null) {
    return false;
  }

  const durationMinutes = Math.max(0, durationHours) * 60;
  const requestEnd = startMinutes + durationMinutes;

  return startMinutes >= windowStart && requestEnd <= windowEnd;
}

type BookingInterval = {
  scheduled_at: string;
  duration_hours: number | null;
  client_requested_hours?: number | null;
};

export function getBookingDurationHours(
  booking: BookingInterval,
  fallbackHours: number = DEFAULT_BOOKING_DURATION_HOURS
): number {
  const duration =
    booking.duration_hours ?? booking.client_requested_hours ?? fallbackHours;
  if (!Number.isFinite(duration) || duration <= 0) {
    return fallbackHours;
  }
  return duration;
}

export function intervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

export function findOverlappingBooking(
  bookings: BookingInterval[],
  scheduledAtIso: string,
  durationHours: number
): BookingInterval | null {
  const requestStart = new Date(scheduledAtIso).getTime();
  if (Number.isNaN(requestStart)) {
    return null;
  }

  const requestEnd = requestStart + durationHours * 60 * 60 * 1000;

  const now = Date.now();

  for (const booking of bookings) {
    if (!booking.scheduled_at) {
      continue;
    }

    const existingStart = new Date(booking.scheduled_at).getTime();
    if (Number.isNaN(existingStart) || existingStart <= now) {
      continue;
    }

    const existingDuration = getBookingDurationHours(booking);
    const existingEnd = existingStart + existingDuration * 60 * 60 * 1000;

    if (intervalsOverlap(requestStart, requestEnd, existingStart, existingEnd)) {
      return booking;
    }
  }

  return null;
}

function groupConsecutiveDays(days: number[]): string {
  if (days.length === 0) {
    return "";
  }

  const ranges: string[] = [];
  let rangeStart = days[0]!;
  let previous = days[0]!;

  for (let index = 1; index <= days.length; index += 1) {
    const current = days[index];
    if (current === previous + 1) {
      previous = current;
      continue;
    }

    if (rangeStart === previous) {
      ranges.push(DAY_LABELS_SHORT[rangeStart]!);
    } else {
      ranges.push(`${DAY_LABELS_SHORT[rangeStart]}–${DAY_LABELS_SHORT[previous]}`);
    }

    if (current == null) {
      break;
    }

    rangeStart = current;
    previous = current;
  }

  return ranges.join(", ");
}

export function formatAvailabilitySummary(
  windows: CleanerAvailabilityWindow[]
): string | null {
  if (windows.length === 0) {
    return null;
  }

  const sorted = [...windows].sort((a, b) => a.day_of_week - b.day_of_week);
  const timeGroups = new Map<string, number[]>();

  for (const window of sorted) {
    const key = `${window.start_time}|${window.end_time}`;
    const days = timeGroups.get(key) ?? [];
    days.push(window.day_of_week);
    timeGroups.set(key, days);
  }

  const parts: string[] = [];
  for (const [key, days] of timeGroups) {
    const [startTime, endTime] = key.split("|");
    if (!startTime || !endTime) {
      continue;
    }

    const dayLabel = groupConsecutiveDays(days.sort((a, b) => a - b));
    parts.push(
      `${dayLabel}, ${formatTimeForDisplay(startTime)}–${formatTimeForDisplay(endTime)}`
    );
  }

  if (parts.length === 0) {
    return null;
  }

  return `Available ${parts.join("; ")}`;
}

export function formatTypicalAvailabilitySummary(
  windows: CleanerAvailabilityWindow[]
): string | null {
  const summary = formatAvailabilitySummary(windows);
  if (!summary) {
    return null;
  }

  return summary.replace(/^Available /, "Typical availability: ");
}

export type WeeklyAvailabilityRow = {
  dayOfWeek: number;
  dayLabelShort: string;
  timeRanges: string[];
};

export function buildWeeklyAvailabilityRows(
  windows: CleanerAvailabilityWindow[]
): WeeklyAvailabilityRow[] {
  return DAY_LABELS_SHORT.map((dayLabelShort, dayOfWeek) => {
    const dayWindows = windows
      .filter((window) => window.day_of_week === dayOfWeek)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    const timeRanges = dayWindows.map(
      (window) =>
        `${formatTimeForDisplay(window.start_time)}–${formatTimeForDisplay(window.end_time)}`
    );

    return {
      dayOfWeek,
      dayLabelShort,
      timeRanges,
    };
  });
}

export function cleanerHasAvailabilityOnDay(
  windows: CleanerAvailabilityWindow[],
  dayOfWeek: number
): boolean {
  return windows.some((window) => window.day_of_week === dayOfWeek);
}

export type DayAvailabilityState = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

export function windowsToDayStates(
  windows: CleanerAvailabilityWindow[]
): DayAvailabilityState[] {
  const useDefaultSuggestion = windows.length === 0;
  const byDay = new Map(
    windows.map((window) => [
      window.day_of_week,
      {
        enabled: true,
        startTime: formatTimeForInput(window.start_time),
        endTime: formatTimeForInput(window.end_time),
      },
    ])
  );

  return DAY_LABELS.map((_, dayOfWeek) => {
    const existing = byDay.get(dayOfWeek);
    if (existing) {
      return existing;
    }

    const defaultWindow = DEFAULT_AVAILABILITY_WINDOWS.find(
      (window) => window.day_of_week === dayOfWeek
    );

    return {
      enabled: useDefaultSuggestion && Boolean(defaultWindow),
      startTime: defaultWindow
        ? formatTimeForInput(defaultWindow.start_time)
        : "09:00",
      endTime: defaultWindow
        ? formatTimeForInput(defaultWindow.end_time)
        : "17:00",
    };
  });
}

export function dayStatesToWindows(
  dayStates: DayAvailabilityState[]
): CleanerAvailabilityWindow[] {
  const windows: CleanerAvailabilityWindow[] = [];

  dayStates.forEach((day, dayOfWeek) => {
    if (!day.enabled) {
      return;
    }

    const startMinutes = normalizeTimeToMinutes(day.startTime);
    const endMinutes = normalizeTimeToMinutes(day.endTime);
    if (startMinutes == null || endMinutes == null || endMinutes <= startMinutes) {
      return;
    }

    windows.push({
      day_of_week: dayOfWeek,
      start_time: `${formatTimeForInput(day.startTime)}:00`,
      end_time: `${formatTimeForInput(day.endTime)}:00`,
    });
  });

  return windows;
}
