"use client"

import type { LucideIcon } from "lucide-react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function SelectCard({ selected, title, description, icon: Icon, onClick }: { selected: boolean; title: string; description?: string; icon?: LucideIcon; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={cn("relative flex min-h-20 items-start gap-3 rounded-xl border p-4 text-left transition-colors", selected ? "border-primary bg-accent" : "border-border bg-card hover:bg-muted/60")}>
      {Icon && <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}><Icon className="size-4" /></span>}
      <span className="min-w-0"><span className="block text-sm font-semibold text-foreground">{title}</span>{description && <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{description}</span>}</span>
      {selected && <Check className="absolute right-3 top-3 size-4 text-primary" />}
    </button>
  )
}

export function TagButton({ selected, children, onClick }: { selected: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-pressed={selected} className={cn("rounded-full border px-3 py-2 text-xs font-medium transition-colors", selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted")}>{children}</button>
}

export function StepTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p><h2 className="mt-2 text-2xl font-bold text-foreground text-balance">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p></div>
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-sm font-semibold text-foreground">{children}</p>
}
