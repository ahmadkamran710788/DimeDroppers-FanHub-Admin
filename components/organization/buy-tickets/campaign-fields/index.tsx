"use client";

import { DollarSign } from "lucide-react";
import Input from "@/components/common/input";
import QuantityStepper from "@/components/common/quantity-stepper";
import type { TicketTypeRow, TierField } from "@/components/organization/buy-tickets/campaign-tier";

const LABEL = "text-sm font-medium text-midnight-navy";

interface CampaignFieldsProps {
  row: TicketTypeRow;
  onChange: (field: TierField, value: string | number) => void;
  // The error for a field, if any.
  errorOf: (field: TierField) => string | undefined;
}

// One ticket type's details (title, description, amount) beside its tickets-per-game stepper:
// a "+ Add" block of the Create / Edit Campaign dialog.
export default function CampaignFields({ row, onChange, errorOf }: CampaignFieldsProps) {
  return (
    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start gap-4">
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <Input
          label="Ticket Title"
          name={`title-${row.key}`}
          value={row.title}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder="e.g. General Admission"
          error={errorOf("title")}
          labelClassName={LABEL}
        />
        <Input
          label="Description"
          name={`description-${row.key}`}
          value={row.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="e.g. Open seating · All ages"
          error={errorOf("description")}
          labelClassName={LABEL}
        />
        <Input
          label="Amount"
          name={`amount-${row.key}`}
          value={row.amount}
          onChange={(e) => onChange("amount", e.target.value)}
          placeholder="0.00"
          icon={<DollarSign className="size-5" />}
          error={errorOf("amount")}
          labelClassName={LABEL}
        />
      </div>

      <div className="w-[152px] shrink-0 flex flex-col gap-2 sm:pt-7">
        <span className={`${LABEL} sm:hidden`}>Available Tickets</span>
        <QuantityStepper
          label="Available Tickets"
          value={row.tickets}
          min={1}
          onChange={(n) => onChange("tickets", n)}
          error={errorOf("tickets")}
        />
        <span className="text-xs text-midnight-navy/50">Per game</span>
      </div>
    </div>
  );
}
