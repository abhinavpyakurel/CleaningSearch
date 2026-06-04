import { resend } from "./resend";

function formatScheduledAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

type NewBookingArgs = {
  cleanerEmail: string;
  cleanerName?: string | null;
  clientName?: string | null;
  bookingId: string;
  scheduledAt: string;
  durationHours: number;
  serviceAddress: string;
};

export async function sendNewBookingEmailToCleaner(args: NewBookingArgs) {
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev>";
  const greetingName = args.cleanerName?.trim() || "there";
  const clientLabel = args.clientName?.trim() || "A client";
  const scheduledLabel = formatScheduledAt(args.scheduledAt);
  const durationLabel =
    args.durationHours === 1 ? "1 hour" : `${args.durationHours} hours`;

  const html = `
    <p>Hi ${greetingName},</p>
    <p>${clientLabel} requested a cleaning.</p>
    <ul>
      <li><strong>Date &amp; time:</strong> ${scheduledLabel}</li>
      <li><strong>Duration:</strong> ${durationLabel}</li>
      <li><strong>Address:</strong> ${args.serviceAddress}</li>
    </ul>
    <p>Log in to CleanMatch to accept or decline this request.</p>
  `.trim(); 

  try {
    console.log("EMAIL_DEBUG: sendNewBookingEmailToCleaner called", {
      cleanerEmail: args.cleanerEmail,
      cleanerName: args.cleanerName,
      clientName: args.clientName,
      bookingId: args.bookingId,
    });

    const result = await resend.emails.send({
      from,
      to: [args.cleanerEmail],
      subject: "New cleaning request on CleanMatch",
      html,
    });

    console.log("EMAIL_DEBUG: Resend result", result);
  } catch (error) {
    console.error("EMAIL_DEBUG: Failed to send new booking email to cleaner:", error);
  }
}

export async function sendBookingAcceptedEmailToClient(args: {
  clientEmail: string;
  clientName?: string | null;
  cleanerName?: string | null;
  bookingId: string;
  scheduledAt: string;
  durationHours: number;
  serviceAddress: string;
}) {
  const from =
    process.env.EMAIL_FROM ?? "CleanMatch <onboarding@resend.dev>";

  // Override the email address to send to for debugging - Need to change to the client's email addresss
  const to = process.env.DEV_OVERRIDE_TO ?? args.clientEmail;
  const greetingName = args.clientName?.trim() || "there";
  const cleanerLabel = args.cleanerName?.trim() || "your cleaner";
  const scheduledLabel = formatScheduledAt(args.scheduledAt);
  const durationLabel =
    args.durationHours === 1
      ? "1 hour"
      : `${args.durationHours} hours`;

  const html = `
    <p>Hi ${greetingName},</p>
    <p>${cleanerLabel} has <strong>accepted</strong> your cleaning request.</p>
    <ul>
      <li><strong>Date &amp; time:</strong> ${scheduledLabel}</li>
      <li><strong>Duration:</strong> ${durationLabel}</li>
      <li><strong>Address:</strong> ${args.serviceAddress}</li>
    </ul>
    <p>You can log in to CleanMatch to review the details.</p>
  `.trim();

  try {
    console.log("EMAIL_DEBUG: sendBookingAcceptedEmailToClient called", {
      clientEmail: args.clientEmail,
      clientName: args.clientName,
      cleanerName: args.cleanerName,
      bookingId: args.bookingId,
      to,
    });

    const result = await resend.emails.send({
      from,
      to: [to],
      subject: "Your cleaning request was accepted – CleanMatch",
      html,
    });

    console.log("EMAIL_DEBUG: Resend result", result);
  } catch (error) {
    console.error(
      "EMAIL_DEBUG: Failed to send booking accepted email to client:",
      error
    );
  }
}

export async function sendBookingDeclinedEmailToClient(args: {
  clientEmail: string;
  clientName?: string | null;
  cleanerName?: string | null;
  bookingId: string;
  scheduledAt: string;
  durationHours: number;
  serviceAddress: string;
}) {
  const from =
    process.env.EMAIL_FROM ?? "CleanMatch <onboarding@resend.dev>";

  const to = process.env.DEV_OVERRIDE_TO ?? args.clientEmail;
  const greetingName = args.clientName?.trim() || "there";
  const cleanerLabel = args.cleanerName?.trim() || "your cleaner";
  const scheduledLabel = formatScheduledAt(args.scheduledAt);
  const durationLabel =
    args.durationHours === 1
      ? "1 hour"
      : `${args.durationHours} hours`;

  const html = `
    <p>Hi ${greetingName},</p>
    <p>${cleanerLabel} has <strong>declined</strong> your cleaning request.</p>
    <ul>
      <li><strong>Date &amp; time:</strong> ${scheduledLabel}</li>
      <li><strong>Duration:</strong> ${durationLabel}</li>
      <li><strong>Address:</strong> ${args.serviceAddress}</li>
    </ul>
    <p>You can log in to CleanMatch to request another cleaner or create a new booking.</p>
  `.trim();

  try {
    console.log("EMAIL_DEBUG: sendBookingDeclinedEmailToClient called", {
      clientEmail: args.clientEmail,
      clientName: args.clientName,
      cleanerName: args.cleanerName,
      bookingId: args.bookingId,
      to,
    });

    const result = await resend.emails.send({
      from,
      to: [to],
      subject: "Your cleaning request was declined – CleanMatch",
      html,
    });

    console.log("EMAIL_DEBUG: Resend result", result);
  } catch (error) {
    console.error(
      "EMAIL_DEBUG: Failed to send booking declined email to client:",
      error
    );
  }
}