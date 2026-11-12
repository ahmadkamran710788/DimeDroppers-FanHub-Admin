// A payment Stripe sent the sponsor back from (a redirect-based method), still to be confirmed. Read on the
// server page from its search params, then confirmed in the browser by usePaymentReturn.
export interface ReturnedPayment {
  paymentId: string;
  paymentIntentId: string;
}

const single = (value: string | string[] | undefined) => (typeof value === "string" && value ? value : undefined);

// ?payment=<id>&payment_intent=<pi_…> (Stripe adds payment_intent to the return_url).
export function returnedPaymentOf(params: { [key: string]: string | string[] | undefined }): ReturnedPayment | undefined {
  const paymentId = single(params.payment);
  const paymentIntentId = single(params.payment_intent);
  return paymentId && paymentIntentId ? { paymentId, paymentIntentId } : undefined;
}
