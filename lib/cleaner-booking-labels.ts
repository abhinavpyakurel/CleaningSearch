export const CLEANER_STATUS_LABELS: Record<string, string> = {
  pending: "New request",
  countered: "Counter sent",
  accepted_pending_payment: "Awaiting client payment",
  confirmed: "Paid and confirmed",
  in_progress: "In progress",
  completed: "Completed",
  disputed: "Disputed",
  cancelled: "Cancelled",
  declined: "Declined",
};

export function getCleanerStatusLabel(
  status: string,
  paymentStatus: string
): string {
  if (status === "cancelled" && paymentStatus === "refunded") {
    return "Cancelled";
  }

  if (status === "confirmed" && paymentStatus === "paid") {
    return "Paid and confirmed";
  }

  return CLEANER_STATUS_LABELS[status] ?? status;
}

export function getCleanerStatusBadgeVariant(
  status: string,
  paymentStatus: string
): "default" | "secondary" | "outline" {
  switch (status) {
    case "confirmed":
    case "in_progress":
    case "completed":
      if (paymentStatus === "paid") {
        return "default";
      }
      return "secondary";
    case "cancelled":
    case "declined":
    case "disputed":
      return "outline";
    case "countered":
    case "accepted_pending_payment":
    case "pending":
      return "secondary";
    default:
      return "outline";
  }
}
