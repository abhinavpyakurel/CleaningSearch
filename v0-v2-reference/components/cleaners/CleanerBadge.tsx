import { ShieldCheck, Leaf, Award, Clock, BadgeCheck, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

const badgeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  "Top Rated": {
    icon: <Award className="w-3 h-3" />,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  "Eco Certified": {
    icon: <Leaf className="w-3 h-3" />,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  "Eco Specialist": {
    icon: <Leaf className="w-3 h-3" />,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  "Background Checked": {
    icon: <ShieldCheck className="w-3 h-3" />,
    color: "bg-sky-50 text-sky-700 border-sky-200",
  },
  Insured: {
    icon: <ShieldCheck className="w-3 h-3" />,
    color: "bg-sky-50 text-sky-700 border-sky-200",
  },
  "1000+ Jobs": {
    icon: <BadgeCheck className="w-3 h-3" />,
    color: "bg-violet-50 text-violet-700 border-violet-200",
  },
  "Fast Responder": {
    icon: <Zap className="w-3 h-3" />,
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  "Commercial Pro": {
    icon: <Award className="w-3 h-3" />,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  Multilingual: {
    icon: <BadgeCheck className="w-3 h-3" />,
    color: "bg-pink-50 text-pink-700 border-pink-200",
  },
  "Budget Friendly": {
    icon: <Zap className="w-3 h-3" />,
    color: "bg-lime-50 text-lime-700 border-lime-200",
  },
  "Deep Clean Pro": {
    icon: <Award className="w-3 h-3" />,
    color: "bg-orange-50 text-orange-700 border-orange-200",
  },
}

interface CleanerBadgeProps {
  badge: string
  className?: string
}

export function CleanerBadge({ badge, className }: CleanerBadgeProps) {
  const config = badgeConfig[badge] ?? {
    icon: <BadgeCheck className="w-3 h-3" />,
    color: "bg-muted text-muted-foreground border-border",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border",
        config.color,
        className
      )}
    >
      {config.icon}
      {badge}
    </span>
  )
}
