// Sponsor payments for package activations: /fanhub/sponsor-packages/payment-methods and /payments
// (sponsor token, FANHUB_SPONSOR_PAYMENTS_FRONTEND.md). All money is in cents.

export type PaymentMethodType = "CARD" | "US_BANK_ACCOUNT" | "CASHAPP" | "LINK";
export type PaymentMethodStatus = "VERIFIED" | "PENDING_VERIFICATION" | "FAILED";
export type PaymentStatus = "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
// What the browser does next with a payment (see settle-checkout).
export type NextAction = "NONE" | "CONFIRM_PAYMENT" | "HANDLE_NEXT_ACTION" | "WAIT";
// An activation's payment, as the activation shows it.
export type OrderPaymentState = "PAID" | "PROCESSING" | "PENDING" | "FAILED" | "CANCELLED" | "NOT_CHARGED" | "FREE";

// GET /payment-methods/options (data[0]).
export interface PaymentMethodTypeOption {
  type: PaymentMethodType;
  label: string;
  maxSaved: number;
  saved: number;
  // false for a bank account (about 4 business days to clear).
  settlesInstantly: boolean;
}

export interface PaymentMethodOptions {
  types: PaymentMethodTypeOption[];
  // How long an unfinished payment holds its activations before it is cancelled.
  holdMinutes: number;
  currency: string;
}

// GET /payment-methods answers the list directly in `data` (defaults first, one default per type).
export interface SponsorPaymentMethod {
  id: string;
  type: PaymentMethodType;
  typeLabel: string;
  // "Visa •••• 4242", "STRIPE TEST BANK •••• 6789"…
  label: string;
  status: PaymentMethodStatus;
  // Only a usable method can pay (not expired, bank verified).
  isUsable: boolean;
  isDefault: boolean;
  isExpired: boolean;
  settlesInstantly: boolean;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  holderName: string | null;
  bankName: string | null;
  accountType: string | null;
  routingNumber: string | null;
  cashtag: string | null;
  // Link only.
  email: string | null;
  createdAt: string;
}

// POST /payment-methods/setup-intent: Stripe's form for that one type.
export interface SetupIntentStart {
  type: PaymentMethodType;
  setupIntentId: string;
  clientSecret: string;
  customerId: string;
}

// DELETE /payment-methods/:id: the method that is now the default of the removed one's type, if any.
export interface RemovedPaymentMethod {
  removedId: string;
  newDefaultId: string | null;
}

// One payment (a single activation or a whole cart), as GET /payments lists it.
export interface SponsorPayment {
  id: string;
  status: PaymentStatus;
  amountCents: number;
  refundedCents: number;
  currency: string;
  // null until a new method's payment succeeds.
  methodType: PaymentMethodType | null;
  methodLabel: string | null;
  paymentMethodId: string | null;
  savePaymentMethod: boolean;
  // Also set on a payment still PENDING after a decline in Stripe's form (it can be retried).
  failureReason: string | null;
  orderIds: string[];
  paidAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

// The `checkout` of an activation, GET /payments/:id and POST /payments/:id/confirm.
export interface SponsorCheckout extends SponsorPayment {
  nextAction: NextAction;
  // Only while it waits for the browser (HANDLE_NEXT_ACTION, CONFIRM_PAYMENT).
  clientSecret: string | null;
  paymentIntentId: string | null;
}

export interface SponsorPaymentsPage {
  items: SponsorPayment[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// An activation's `payment`.
export interface OrderPayment {
  state: OrderPaymentState;
  paymentId: string | null;
  methodLabel: string | null;
  paidAt: string | null;
  refundedCents: number;
}

// Sent with POST /activations and /activations/batch: a saved, usable method, or none to pay with a new one
// in Stripe's form (kept for next time unless savePaymentMethod is false).
export interface PaymentChoice {
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
}
