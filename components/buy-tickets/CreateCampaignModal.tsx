"use client";

import { useState } from "react";
import { DollarSign, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Modal from "@/components/common/modal";
import QuantityStepper from "@/components/common/quantity-stepper";
import { createCampaignSchema } from "@/components/buy-tickets/schema";
import { validateAndSetErrors } from "@/utils/validation";

export interface CampaignTier {
  key: number;
  title: string;
  description: string;
  amount: string;
  tickets: number;
}

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  // "create": starts with one empty row. "edit": prefilled with initialTiers.
  mode?: "create" | "edit";
  initialTiers?: CampaignTier[];
  // Receives the rows on submit: new rows (create) or the full edited list (edit).
  onSave: (tiers: CampaignTier[]) => void;
}

let nextKey = 1;
const newTier = (): CampaignTier => ({ key: nextKey++, title: "", description: "", amount: "", tickets: 1 });

const LABEL = "text-sm font-medium text-midnight-navy";

// Create / Edit Campaign dialog: a two-column table (campaign details | available tickets)
// with an Add button to append more rows. No campaigns endpoint yet — the caller receives
// the rows. Mount it fresh per open (e.g. with a `key`) so edit mode re-reads initialTiers.
export default function CreateCampaignModal({
  isOpen,
  onClose,
  mode = "create",
  initialTiers,
  onSave,
}: CreateCampaignModalProps) {
  const isEdit = mode === "edit";
  const initial = () => (isEdit && initialTiers?.length ? initialTiers.map((t) => ({ ...t })) : [newTier()]);
  const [tiers, setTiers] = useState<CampaignTier[]>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setTiers(initial());
    setErrors({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Field errors are keyed by yup path, e.g. "tiers[0].title".
  const errorKey = (i: number, field: keyof CampaignTier) => `tiers[${i}].${field}`;

  const update = (i: number, field: "title" | "description" | "amount" | "tickets", value: string | number) => {
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
    const key = errorKey(i, field);
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const addRow = () => setTiers((prev) => [...prev, newTier()]);

  const removeRow = (i: number) => {
    setTiers((prev) => prev.filter((_, idx) => idx !== i));
    // Row indices shift after a removal, so stale path-keyed errors no longer line up.
    setErrors({});
  };

  const handleCreate = async () => {
    if (!(await validateAndSetErrors(createCampaignSchema, { tiers }, setErrors))) return;
    onSave(tiers);
    toast.success(
      isEdit ? "Campaigns updated." : tiers.length === 1 ? "Campaign created." : `${tiers.length} campaigns created.`
    );
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? "Edit Campaign" : "Create Campaign"}
      className="max-w-[min(760px,calc(100vw-2rem))] items-stretch max-h-[calc(100vh-2rem)] overflow-hidden"
    >
      <div className="w-full flex-1 min-h-0 flex flex-col rounded-[12px] border border-[rgba(11,28,45,0.12)] overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 h-12 bg-[#F5F6F8] border-b border-[rgba(11,28,45,0.12)]">
          <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-midnight-navy/70">Campaign</span>
          <span className="w-[152px] text-xs font-semibold uppercase tracking-wide text-midnight-navy/70">
            Available Tickets
          </span>
          <button
            type="button"
            onClick={addRow}
            className="h-8 px-3 rounded-[8px] flex items-center gap-1.5 text-sm font-medium text-white shrink-0"
            style={{ background: "var(--gradient-cta)" }}
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Add
          </button>
        </div>

        {/* Rows */}
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
          {tiers.map((tier, i) => (
            <div
              key={tier.key}
              className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 border-b last:border-b-0 border-[rgba(11,28,45,0.08)]"
            >
              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <Input
                  label="Campaign Title"
                  name={`title-${tier.key}`}
                  value={tier.title}
                  onChange={(e) => update(i, "title", e.target.value)}
                  placeholder="e.g. General Admission"
                  error={errors[errorKey(i, "title")]}
                  labelClassName={LABEL}
                />
                <Input
                  label="Description"
                  name={`description-${tier.key}`}
                  value={tier.description}
                  onChange={(e) => update(i, "description", e.target.value)}
                  placeholder="e.g. Entry to all home games"
                  error={errors[errorKey(i, "description")]}
                  labelClassName={LABEL}
                />
                <Input
                  label="Amount"
                  name={`amount-${tier.key}`}
                  value={tier.amount}
                  onChange={(e) => update(i, "amount", e.target.value)}
                  placeholder="0.00"
                  icon={<DollarSign className="size-5" />}
                  error={errors[errorKey(i, "amount")]}
                  labelClassName={LABEL}
                />
              </div>

              <div className="w-[152px] shrink-0 flex flex-col gap-2 sm:pt-7">
                <span className={`${LABEL} sm:hidden`}>Available Tickets</span>
                <QuantityStepper
                  label="Available Tickets"
                  value={tier.tickets}
                  min={1}
                  onChange={(n) => update(i, "tickets", n)}
                  error={errors[errorKey(i, "tickets")]}
                />
              </div>

              <div className="w-[68px] shrink-0 flex sm:justify-center sm:pt-8">
                {tiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    aria-label={`Remove row ${i + 1}`}
                    className="size-10 rounded-[8px] flex items-center justify-center text-error hover:bg-error/10 transition-colors"
                  >
                    <Trash2 className="size-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full flex gap-3">
        <Button label="Cancel" variant="secondary" onClick={handleClose} fullWidth />
        <Button label={isEdit ? "Save Changes" : "Create Campaign"} variant="cta" onClick={handleCreate} fullWidth />
      </div>
    </Modal>
  );
}
