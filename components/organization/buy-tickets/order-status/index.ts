import type { TicketOrderStatus } from "@/utils/types/tickets";

// Order status label and pill colour, for the Orders table and the receipt.
export const ORDER_STATUS: Record<TicketOrderStatus, { label: string; color: string }> = {
  PAID: { label: "Paid", color: "bg-success" },
  PENDING: { label: "Pending", color: "bg-steel-blue" },
  FAILED: { label: "Failed", color: "bg-error/70" },
  // Light grey reads on both the dark table and the white receipt.
  CANCELLED: { label: "Cancelled", color: "bg-[#D1D5DB]" },
};
