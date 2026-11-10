import toast from "react-hot-toast";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { dollars } from "@/components/sponsor/fundable-needs/data";
import { routes } from "@/utils/routes";
import type { Contribution } from "@/utils/types/needs";

// After Stripe is done with a payment (in the payment form, or back from a redirect): tells the backend
// (POST /contributions/:id/confirm) and tells the sponsor how it went. Stripe's webhook records the payment
// too, so a failure here only means this screen couldn't update yet. null when the call failed.
export async function confirmContribution(contributionId: string, paymentIntentId: string): Promise<Contribution | null> {
  const r = await sponsorRequest<Contribution>("POST", routes.api.sponsorContributionConfirm(contributionId), {
    body: { paymentIntentId },
  });
  const contribution = r.view;
  if (!contribution) {
    toast.error(
      r.message
        ? `We couldn't update your payment here: ${r.message} If you paid, it will show shortly.`
        : "We couldn't update your payment here. If you paid, it will show shortly."
    );
    return null;
  }
  switch (contribution.status) {
    case "PAID":
      toast.success(`Thank you! You funded ${dollars(contribution.amountCents)}.`);
      break;
    case "PROCESSING":
      toast.success("Your bank payment is processing. It counts toward the goal once it clears.");
      break;
    case "FAILED":
      toast.error(contribution.failureReason || "The payment didn't go through. Please try another payment method.");
      break;
    default:
      toast("Your payment hasn't gone through yet. It will show here once it does.");
  }
  return contribution;
}
