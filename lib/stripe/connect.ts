import Stripe from "stripe";

import { getAppOrigin } from "@/lib/stripe/app-origin";

export type CleanerStripeStatus = {
  stripe_details_submitted: boolean;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_onboarding_complete: boolean;
};

function getStripeSecretKey(): string {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe secret key not configured.");
  }
  return secretKey;
}

export function getStripe(): Stripe {
  return new Stripe(getStripeSecretKey());
}

export function mapAccountToCleanerStripeStatus(
  account: Stripe.Account
): CleanerStripeStatus {
  const detailsSubmitted = account.details_submitted ?? false;
  const chargesEnabled = account.charges_enabled ?? false;
  const payoutsEnabled = account.payouts_enabled ?? false;

  return {
    stripe_details_submitted: detailsSubmitted,
    stripe_charges_enabled: chargesEnabled,
    stripe_payouts_enabled: payoutsEnabled,
    stripe_onboarding_complete: detailsSubmitted && payoutsEnabled,
  };
}

export async function createExpressConnectedAccount(
  email: string | null | undefined
): Promise<Stripe.Account> {
  const stripe = getStripe();

  return stripe.accounts.create({
    type: "express",
    country: "US",
    email: email ?? undefined,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
}

export async function fetchCleanerStripeStatus(
  accountId: string
): Promise<CleanerStripeStatus> {
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(accountId);
  return mapAccountToCleanerStripeStatus(account);
}

export function getPayoutOnboardingUrls(origin?: string): {
  returnUrl: string;
  refreshUrl: string;
} {
  const appOrigin = origin ?? getAppOrigin();
  return {
    returnUrl: `${appOrigin}/cleaner/payouts/return`,
    refreshUrl: `${appOrigin}/cleaner/payouts/refresh`,
  };
}

export type BookingPayoutTransferParams = {
  bookingId: string;
  cleanerId: string;
  amountCents: number;
  destinationAccountId: string;
  idempotencyKey: string;
};

export type StripeBalanceAmount = {
  currency: string;
  amount: number;
};

export type PlatformBalanceDebug = {
  mode: "test" | "live" | "unknown";
  available: StripeBalanceAmount[];
  pending: StripeBalanceAmount[];
};

function getStripeMode(): "test" | "live" | "unknown" {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return "unknown";
  }

  if (secretKey.startsWith("sk_test")) {
    return "test";
  }

  if (secretKey.startsWith("sk_live")) {
    return "live";
  }

  return "unknown";
}

function formatBalanceAmounts(
  amounts: Stripe.Balance.Available[] | Stripe.Balance.Pending[]
): StripeBalanceAmount[] {
  return amounts.map((entry) => ({
    currency: entry.currency,
    amount: entry.amount,
  }));
}

function getAvailableCentsForCurrency(
  available: StripeBalanceAmount[],
  currency: string
): number {
  const entry = available.find(
    (item) => item.currency.toLowerCase() === currency.toLowerCase()
  );
  return entry?.amount ?? 0;
}

export async function getPlatformBalanceDebug(): Promise<PlatformBalanceDebug> {
  const stripe = getStripe();
  const balance = await stripe.balance.retrieve();

  return {
    mode: getStripeMode(),
    available: formatBalanceAmounts(balance.available),
    pending: formatBalanceAmounts(balance.pending),
  };
}

export async function createBookingPayoutTransfer(
  params: BookingPayoutTransferParams
): Promise<Stripe.Transfer> {
  const stripe = getStripe();
  const currency = "usd";

  const balanceDebug = await getPlatformBalanceDebug();
  const availableUsdCents = getAvailableCentsForCurrency(
    balanceDebug.available,
    currency
  );

  console.log("[payout-transfer] Stripe balance debug", {
    mode: balanceDebug.mode,
    available: balanceDebug.available,
    pending: balanceDebug.pending,
    requestedTransferAmountCents: params.amountCents,
    requestedTransferCurrency: currency,
    destinationConnectedAccountId: params.destinationAccountId,
    bookingId: params.bookingId,
  });

  if (availableUsdCents < params.amountCents) {
    if (availableUsdCents === 0) {
      throw new Error(
        "The app is using a different Stripe sandbox/account than the dashboard balance you funded."
      );
    }

    throw new Error(
      `Insufficient platform balance: ${availableUsdCents} cents available in USD, ${params.amountCents} cents requested.`
    );
  }

  try {
    console.log("[payout-transfer] creating transfer", {
      bookingId: params.bookingId,
      cleanerId: params.cleanerId,
      amount: params.amountCents,
      currency,
      destination: params.destinationAccountId,
      idempotencyKey: params.idempotencyKey,
    });

    const transfer = await stripe.transfers.create(
      {
        amount: params.amountCents,
        currency,
        destination: params.destinationAccountId,
        metadata: {
          booking_id: params.bookingId,
          cleaner_id: params.cleanerId,
          platform: "CleanMatch",
        },
      },
      {
        idempotencyKey: params.idempotencyKey,
      }
    );

    console.log("[payout-transfer] transfer created", {
      id: transfer.id,
      amount: transfer.amount,
      currency: transfer.currency,
      destination: transfer.destination,
    });

    return transfer;
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error("[payout-transfer] transfer failed", {
        type: error.type,
        code: error.code ?? null,
        message: error.message,
        requestId: error.requestId ?? null,
      });
      throw new Error(error.message);
    }

    console.error("[payout-transfer] transfer failed", {
      type: "unknown",
      code: null,
      message: error instanceof Error ? error.message : "Unknown error",
      requestId: null,
    });

    throw error;
  }
}

export async function createAccountOnboardingLink(
  accountId: string,
  origin?: string
): Promise<string> {
  const stripe = getStripe();
  const { returnUrl, refreshUrl } = getPayoutOnboardingUrls(origin);

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  if (!link.url) {
    throw new Error("Could not create Stripe onboarding link.");
  }

  return link.url;
}
