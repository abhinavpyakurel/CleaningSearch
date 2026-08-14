export type VisitType = "First clean" | "Recurring"
export type BookingService = "Standard" | "Deep clean" | "Move in/out"
export type HomeType = "Apartment" | "House" | "Townhouse" | "Studio"
export type TimeWindow = "Morning" | "Afternoon" | "Evening"

export interface BookingDraft {
  visitType: VisitType
  serviceType: BookingService
  homeType: HomeType
  bedrooms: number
  bathrooms: number
  areas: string[]
  petHair: boolean
  lastCleaned: string
  addOns: string[]
  specialRequests: string
  hours: number
  photos: string[]
  address: string
  unit: string
  city: string
  zip: string
  date: string
  timeWindow: TimeWindow | ""
}

export const AREAS = ["Kitchen", "Living room", "Bedrooms", "Bathrooms", "Dining room", "Home office", "Laundry", "Hallways"]
export const ADD_ONS = ["Inside fridge", "Inside oven", "Interior windows", "Inside cabinets", "Laundry & fold", "Balcony / patio", "Baseboards", "Dishes"]
export const LAST_CLEANED = ["Within a week", "2–4 weeks ago", "1–3 months ago", "3+ months ago"]
export const TIME_WINDOWS: Array<{ value: TimeWindow; time: string }> = [
  { value: "Morning", time: "8:00 AM – 12:00 PM" },
  { value: "Afternoon", time: "12:00 PM – 4:00 PM" },
  { value: "Evening", time: "4:00 PM – 7:00 PM" },
]

export const INITIAL_BOOKING: BookingDraft = {
  visitType: "First clean",
  serviceType: "Standard",
  homeType: "Apartment",
  bedrooms: 2,
  bathrooms: 1,
  areas: ["Kitchen", "Living room", "Bedrooms", "Bathrooms"],
  petHair: false,
  lastCleaned: "2–4 weeks ago",
  addOns: [],
  specialRequests: "",
  hours: 3,
  photos: [],
  address: "",
  unit: "",
  city: "",
  zip: "",
  date: "",
  timeWindow: "",
}

export function recommendHours(draft: BookingDraft) {
  let hours = 1.5 + draft.bedrooms * 0.45 + draft.bathrooms * 0.6
  hours += Math.max(0, draft.areas.length - 4) * 0.2
  if (draft.serviceType === "Deep clean") hours += 1.5
  if (draft.serviceType === "Move in/out") hours += 2
  if (draft.homeType === "House" || draft.homeType === "Townhouse") hours += 0.5
  if (draft.petHair) hours += 0.5
  if (draft.lastCleaned === "1–3 months ago") hours += 0.75
  if (draft.lastCleaned === "3+ months ago") hours += 1.25
  hours += draft.addOns.length * 0.4
  return Math.max(2, Math.round(hours * 2) / 2)
}

export function priceBooking(hours: number, hourlyRate: number) {
  const labor = hours * hourlyRate
  const fee = labor * 0.15
  return { labor, fee, total: labor + fee }
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value)
}

export function formatBookingDate(value: string) {
  if (!value) return "Date not selected"
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "long", day: "numeric" }).format(new Date(`${value}T12:00:00`))
}
