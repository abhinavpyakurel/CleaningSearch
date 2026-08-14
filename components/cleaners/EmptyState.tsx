import { SearchX, RotateCcw } from "lucide-react"

interface EmptyStateProps {
  onReset: () => void
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <SearchX className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground text-lg mb-2">No cleaners found</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">
        Try adjusting your filters or search terms to find available cleaners in your area.
      </p>
      <button
        onClick={onReset}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        Reset Filters
      </button>
    </div>
  )
}
