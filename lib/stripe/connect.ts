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
