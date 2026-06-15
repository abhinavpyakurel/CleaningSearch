import { refreshPayoutSetupAction } from "@/app/cleaner/dashboard/actions";

export default async function CleanerPayoutsRefreshPage() {
  await refreshPayoutSetupAction();
}
