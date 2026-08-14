import { CalendarCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Availability } from "@/lib/types"

const availabilityConfig: Record<Availability, { color: string; dot: string }> = {
  "Available Today": {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  "Available This Week": {
    color: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
  },
  "Available Next Week": {
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
}

interface AvailabilityChipProps {
  availability: Availability
  className?: string
}

export function AvailabilityChip({ availability, className }: AvailabilityChipProps) {
  const config = availabilityConfig[availability]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        config.color,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {availability}
    </span>
  )
}
