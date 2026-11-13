import { CreditCard, DollarSign, Landmark, Link2, type LucideIcon } from "lucide-react";
import type { PaymentMethodType, PaymentStatus, SponsorPaymentMethod } from "@/utils/types/sponsor-payments";

// Class names shared by the Billing Info sections (values from the Billing Info design).

// A section's dark card.
export const PANEL = "rounded-[16px] border border-[#1e2026] bg-[#121317]";

// Small caps section heading ("ADD A PAYMENT METHOD", "BILLING HISTORY").
export const SECTION_HEADING = "text-[13px] font-bold tracking-[1.2px] uppercase text-[#a1a1aa]";

// The pink-to-blue save button ("Save card", "Save bank account"); callers add nothing but the label.
export const GRADIENT_BUTTON =
  "h-12 min-w-0 px-[22px] rounded-[12px] text-[15px] font-semibold text-white backdrop-blur-none bg-[linear-gradient(90deg,#6b8afd,#ec4899)]";

// A small outlined button on a dark card ("Receipt").
export const SMALL_OUTLINE_BUTTON =
  "h-10 min-w-0 px-3 rounded-[8px] border border-[#2a2c33] bg-transparent text-[13px] font-normal text-[#f4f4f5] backdrop-blur-none hover:bg-white/5";

// A dark field like the design's: near-black fill, grey border, 12px corners.
export const DARK_FIELD =
  "h-12 rounded-[12px] bg-[#0b0d12] border-[#2a2c33] text-[15px] font-normal placeholder:text-[#71717a] focus:border-[#7c6cff]";

export const DARK_LABEL = "text-[13px] font-semibold text-[#f4f4f5]";

export interface AddMethodOption {
  type: PaymentMethodType;
  name: string;
  description: string;
  Icon: LucideIcon;
  // The icon tile's fill and icon colour.
  tileClassName: string;
}

// "Add a payment method", in the design's order (Link added after the design's three).
export const ADD_METHODS: AddMethodOption[] = [
  {
    type: "CARD",
    name: "Card",
    description: "Add a debit or credit card via Stripe.",
    Icon: CreditCard,
    tileClassName: "bg-[#1e2026] text-[#f4f4f5]",
  },
  {
    type: "US_BANK_ACCOUNT",
    name: "Bank Account",
    description: "Pay from your business bank account (ACH) via Stripe.",
    Icon: Landmark,
    tileClassName: "bg-[#1e2026] text-[#f4f4f5]",
  },
  {
    type: "CASHAPP",
    name: "Cash App Pay",
    description: "Link Cash App to make fast, secure payments.",
    Icon: DollarSign,
    tileClassName: "bg-[#00d54b] text-white",
  },
  {
    type: "LINK",
    name: "Link",
    description: "Pay with the cards and banks saved in your Link account.",
    Icon: Link2,
    tileClassName: "bg-[#00d66f] text-black",
  },
];

// What the open form says and its save button, by type.
export const ADD_COPY: Record<PaymentMethodType, { intro?: string; save: string; note: string; saveClassName?: string }> = {
  CARD: {
    save: "Save card",
    note: "Card details go straight to Stripe. Dime never stores your full card number.",
  },
  US_BANK_ACCOUNT: {
    intro: "Log in to your bank through Stripe to verify in seconds, or enter your account details by hand.",
    save: "Save bank account",
    note: "Accounts entered by hand are verified with a small deposit in 1–2 business days.",
  },
  CASHAPP: {
    intro: "You’ll be sent to Cash App to approve Dime Sponsors, then brought back here.",
    save: "Continue to Cash App",
    note: "Cash App payments go through Stripe.",
    saveClassName: "bg-none bg-[#00d54b] text-black font-bold",
  },
  LINK: {
    intro: "Sign in to Link with your email to pay with what you saved there.",
    save: "Save Link",
    note: "Your Link details stay with Stripe.",
  },
};

const CARD_BRANDS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  american_express: "Amex",
  discover: "Discover",
  diners: "Diners",
  jcb: "JCB",
  unionpay: "UnionPay",
};

// A saved method's coloured badge: its card brand, "Bank", "$" or "Link".
export function badgeOf(m: SponsorPaymentMethod): { text: string; className: string } {
  switch (m.type) {
    case "CARD": {
      const brand = m.brand?.toLowerCase() ?? "";
      return { text: CARD_BRANDS[brand] ?? "Card", className: "bg-[#1e3a8a] text-white text-[13px]" };
    }
    case "US_BANK_ACCOUNT":
      return { text: "Bank", className: "bg-[#27272a] text-white text-[13px]" };
    case "CASHAPP":
      return { text: "$", className: "bg-[#00d54b] text-white text-[20px]" };
    case "LINK":
      return { text: "Link", className: "bg-[#00d66f] text-black text-[13px]" };
  }
}

// A payment's pill in Billing History.
export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; className: string }> = {
  SUCCEEDED: { label: "PAID", className: "bg-[#052e16] text-[#86efac]" },
  PROCESSING: { label: "BANK CLEARING", className: "bg-[#2b1d05] text-[#fde68a]" },
  PENDING: { label: "WAITING", className: "bg-[#2b1d05] text-[#fde68a]" },
  FAILED: { label: "FAILED", className: "bg-[#3b0d12] text-[#fca5a5]" },
  CANCELLED: { label: "CANCELLED", className: "bg-[#27272a] text-[#a1a1aa]" },
};
