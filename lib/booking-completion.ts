export type CompletionSide = "client" | "cleaner";

export type CompletionBookingFields = {
  cleaner_marked_complete_at: string | null;
  client_marked_complete_at: string | null;
};

export type CompletionUpdatePayload = {
  cleaner_marked_complete_at?: string;
  client_marked_complete_at?: string;
  status?: "completed";
  payout_status?: "ready";
};

export function buildCompletionUpdate(
  booking: CompletionBookingFields,
  side: CompletionSide,
  nowIso: string
): CompletionUpdatePayload {
  if (side === "client") {
    const payload: CompletionUpdatePayload = {
      client_marked_complete_at: nowIso,
    };

    if (booking.cleaner_marked_complete_at != null) {
      payload.status = "completed";
      payload.payout_status = "ready";
    }

    return payload;
  }

  const payload: CompletionUpdatePayload = {
    cleaner_marked_complete_at: nowIso,
  };

  if (booking.client_marked_complete_at != null) {
    payload.status = "completed";
    payload.payout_status = "ready";
  }

  return payload;
}

export function hasCompletionStarted(booking: CompletionBookingFields): boolean {
  return (
    booking.cleaner_marked_complete_at != null ||
    booking.client_marked_complete_at != null
  );
}

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  locked: "Locked",
  ready: "Ready",
  paid: "Paid",
  paused: "Paused",
};

export function getPayoutStatusLabel(status: string): string {
  return PAYOUT_STATUS_LABELS[status] ?? status;
}
