import { startPayoutSetupAction } from "@/app/cleaner/dashboard/actions";

type PayoutSetupCardProps = {
  stripeAccountId: string | null;
  stripePayoutsEnabled: boolean;
};

export function PayoutSetupCard({
  stripeAccountId,
  stripePayoutsEnabled,
}: PayoutSetupCardProps) {
  if (stripePayoutsEnabled) {
    return (
      <div className="rounded-2xl border border-green-100 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">Payout setup complete</h2>
        <p className="mt-1 text-sm text-gray-500">
          You can receive payouts after completed jobs are released.
        </p>
      </div>
    );
  }

  const hasAccount = stripeAccountId != null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">
        {hasAccount ? "Finish payout setup" : "Set up payouts"}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {hasAccount
          ? "Stripe needs more information before payouts can be enabled."
          : "Connect your Stripe account so CleanMatch can pay you after completed jobs."}
      </p>
      <form action={startPayoutSetupAction} className="mt-6">
        <button
          type="submit"
          className="rounded-xl bg-[#00695C] px-6 py-3 font-semibold text-white transition-all hover:bg-[#004D40]"
        >
          {hasAccount ? "Finish setup" : "Set up payouts"}
        </button>
      </form>
    </div>
  );
}
