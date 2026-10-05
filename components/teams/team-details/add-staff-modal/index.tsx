"use client";

import { useState, type ReactNode } from "react";
import { Check, ClipboardList, UserStar } from "lucide-react";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Modal from "@/components/common/modal";
import PhoneInput from "@/components/common/phone-input";
import type { StaffMember } from "@/components/teams/data";
import { addStaffSchema } from "@/components/teams/team-details/add-staff-modal/schema";
import { cn } from "@/utils/cn";
import { validateAndSetErrors } from "@/utils/validation";

export type CoachRole = "Head Coach" | "Assistant Coach";

const ROLES: { role: CoachRole; description: string; icon: ReactNode }[] = [
  { role: "Head Coach", description: "Leads the team and its staff.", icon: <UserStar className="size-6" strokeWidth={1.75} /> },
  {
    role: "Assistant Coach",
    description: "Supports the head coach at practices and games.",
    icon: <ClipboardList className="size-6" strokeWidth={1.75} />,
  },
];

const INITIAL = { role: "" as CoachRole | "", name: "", email: "", phone: "" };
type Form = typeof INITIAL;

const LABEL = "text-midnight-navy";

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (member: StaffMember) => void;
}

// Popup for adding a coach: pick head or assistant coach, then their details.
export default function AddStaffModal({ isOpen, onClose, onAdd }: AddStaffModalProps) {
  const [form, setForm] = useState<Form>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const close = () => {
    setForm(INITIAL);
    setErrors({});
    onClose();
  };

  const save = async () => {
    if (!(await validateAndSetErrors(addStaffSchema, form, setErrors))) return;
    onAdd({
      id: `staff-${Date.now()}`,
      name: form.name.trim(),
      role: form.role as CoachRole,
      email: form.email.trim(),
      phone: form.phone,
      status: "Active",
    });
    close();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Add Staff" className="max-w-[min(560px,calc(100vw-2rem))] items-stretch">
      <div className="w-full flex flex-col gap-5">
        {/* Role */}
        <div className="flex flex-col gap-2">
          <span className="text-base font-medium text-midnight-navy">
            Role<span className="text-error"> *</span>
          </span>
          <div role="radiogroup" aria-label="Staff role" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ROLES.map(({ role, description, icon }) => {
              const selected = form.role === role;
              return (
                <button
                  key={role}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => update("role", role)}
                  className={cn(
                    "relative text-left rounded-[12px] border-2 p-4 flex flex-col gap-2 transition-colors",
                    selected ? "border-steel-blue bg-steel-blue/10" : "border-[rgba(11,28,45,0.12)] hover:border-steel-blue/50"
                  )}
                >
                  {selected && (
                    <span className="absolute top-3 right-3 size-5 rounded-full bg-steel-blue flex items-center justify-center">
                      <Check className="size-3.5 text-white" strokeWidth={3} />
                    </span>
                  )}
                  <span className="size-10 rounded-full bg-[#F5F6F8] text-steel-blue flex items-center justify-center">{icon}</span>
                  <span className="text-base font-semibold text-midnight-navy">{`Add ${role}`}</span>
                  <span className="text-sm text-midnight-navy/60">{description}</span>
                </button>
              );
            })}
          </div>
          {errors.role && <p className="text-sm text-error">{errors.role}</p>}
        </div>

        {/* Details */}
        <Input
          label="Full Name"
          name="staffName"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Alex Morgan"
          error={errors.name}
        />
        <Input
          label="Email"
          name="staffEmail"
          type="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="alex@school.edu"
          error={errors.email}
        />
        <PhoneInput
          label="Phone (Optional)"
          name="staffPhone"
          value={form.phone}
          onValueChange={(v) => update("phone", v)}
          error={errors.phone}
          labelClassName={LABEL}
        />
      </div>
      <div className="w-full flex gap-3">
        <Button label="Cancel" variant="secondary" onClick={close} fullWidth />
        <Button label="Add Staff" variant="cta" onClick={save} fullWidth />
      </div>
    </Modal>
  );
}
