import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  max?: number
  size?: "sm" | "md" | "lg"
  showNumber?: boolean
  reviewCount?: number
  className?: string
}

export function StarRating({
  rating,
  max = 5,
  size = "sm",
  showNumber = false,
  reviewCount,
  className,
}: StarRatingProps) {
  const sizeMap = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }

  const textSizeMap = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < Math.floor(rating)
          const partial = !filled && i < rating
          return (
            <div key={i} className="relative">
              <Star
                className={cn(sizeMap[size], "text-border fill-border")}
              />
              {(filled || partial) && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: filled ? "100%" : `${(rating % 1) * 100}%` }}
                >
                  <Star className={cn(sizeMap[size], "text-amber-400 fill-amber-400")} />
                </div>
              )}
            </div>
          )
        })}
      </div>
      {showNumber && (
        <span className={cn("font-semibold text-foreground", textSizeMap[size])}>
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className={cn("text-muted-foreground", textSizeMap[size])}>
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  )
}
