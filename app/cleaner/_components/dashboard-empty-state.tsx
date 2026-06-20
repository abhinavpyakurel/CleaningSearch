import type { LucideIcon } from "lucide-react";

type DashboardEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function DashboardEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: DashboardEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card py-10 text-center">
      <Icon className="mx-auto mb-3 size-10 text-muted-foreground/40" />
      <p className="mb-1 font-semibold text-foreground">{title}</p>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
