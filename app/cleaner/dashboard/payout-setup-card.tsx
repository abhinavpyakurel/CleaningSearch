import { AlertCircle, ChevronRight, Wallet } from "lucide-react";

import { startPayoutSetupAction } from "@/app/cleaner/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUsdFromCents } from "@/lib/booking-price";

type PayoutSetupCardProps = {
  stripeAccountId: string | null;
  stripePayoutsEnabled: boolean;
  readyPayoutCents?: number;
  paidOutCents?: number;
  lockedPayoutCents?: number;
};

export function PayoutSetupCard({
  stripeAccountId,
  stripePayoutsEnabled,
  readyPayoutCents = 0,
  paidOutCents = 0,
  lockedPayoutCents = 0,
}: PayoutSetupCardProps) {
  if (stripePayoutsEnabled) {
    return (
      <Card className="border border-border shadow-sm">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Wallet className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Payout status
            </span>
          </div>
          <Badge variant="secondary" className="mb-3 text-xs">
            Connected
          </Badge>
          {readyPayoutCents > 0 ? (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground">Ready for payout</p>
              <p className="text-lg font-bold text-foreground">
                {formatUsdFromCents(readyPayoutCents)}
              </p>
            </div>
          ) : null}
          {lockedPayoutCents > 0 ? (
            <p className="mb-3 text-xs text-muted-foreground">
              Processing: {formatUsdFromCents(lockedPayoutCents)}
            </p>
          ) : null}
          {paidOutCents > 0 ? (
            <div>
              <p className="text-xs text-muted-foreground">Paid out</p>
              <p className="text-lg font-bold text-foreground">
                {formatUsdFromCents(paidOutCents)}
              </p>
            </div>
          ) : null}
          {readyPayoutCents === 0 &&
          paidOutCents === 0 &&
          lockedPayoutCents === 0 ? (
            <p className="text-xs text-muted-foreground">
              Complete jobs to start earning. Payouts release after both sides
              confirm completion.
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const hasAccount = stripeAccountId != null;

  return (
    <Card className="border border-border shadow-sm">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Wallet className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            Payout status
          </span>
        </div>
        <Badge variant="secondary" className="mb-2 text-xs">
          Not connected
        </Badge>
        <p className="mb-4 text-xs text-muted-foreground">
          {hasAccount
            ? "Stripe needs more information before payouts can be enabled."
            : "Connect your Stripe account to receive payouts after completed jobs."}
        </p>
        <form action={startPayoutSetupAction}>
          <Button type="submit" variant="outline" size="sm" className="w-full">
            {hasAccount ? "Finish setup" : "Connect Stripe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

type PayoutSetupBannerProps = {
  stripeAccountId: string | null;
  stripePayoutsEnabled: boolean;
};

export function PayoutSetupBanner({
  stripeAccountId,
  stripePayoutsEnabled,
}: PayoutSetupBannerProps) {
  if (stripePayoutsEnabled) {
    return null;
  }

  const hasAccount = stripeAccountId != null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-yellow-600" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-yellow-900">
          {hasAccount ? "Finish payout setup" : "Action required: Set up payouts"}
        </p>
        <p className="mt-0.5 text-xs text-yellow-700">
          Connect your Stripe account to receive payments for completed jobs.
        </p>
      </div>
      <form action={startPayoutSetupAction} className="shrink-0">
        <Button
          type="submit"
          size="sm"
          variant="outline"
          className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
        >
          Set up now
          <ChevronRight className="ml-1 size-3.5" />
        </Button>
      </form>
    </div>
  );
}
