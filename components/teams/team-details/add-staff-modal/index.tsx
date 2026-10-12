"use client";

import { useState, type ReactNode } from "react";
import { Check, ClipboardList, UserStar } from "lucide-react";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Modal from "@/components/common/modal";
import PhoneInput from "@/components/common/phone-input";
import { addStaffSchema, editImportedStaffSchema } from "@/components/teams/team-details/add-staff-modal/schema";
import type { StaffRole, TeamStaffMember } from "@/components/teams/team-details/use-team-staff";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import { cn } from "@/utils/cn";
import { validateAndSetErrors } from "@/utils/validation";

export type CoachRole = "Head Coach" | "Assistant Coach";

const ROLE_VALUE: Record<CoachRole, StaffRole> = { "Head Coach": "HEAD_COACH", "Assistant Coach": "ASSISTANT_COACH" };
const ROLE_LABEL: Partial<Record<StaffRole, CoachRole>> = { HEAD_COACH: "Head Coach", ASSISTANT_COACH: "Assistant Coach" };

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

// The edit form starts from the entry; an imported title (role OTHER) leaves no role picked.
const formFor = (m: TeamStaffMember): Form => ({
  role: ROLE_LABEL[m.roleValue] ?? "",
  name: m.name,
  email: m.email,
  phone: m.phone,
});

const splitName = (name: string) => {
  const [firstName, ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.length > 0 ? rest.join(" ") : null };
};

const LABEL = "text-midnight-navy";

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  // The team the coach joins (its schoolTeamId).
  teamId: string;
  // Set to edit this entry instead of adding a new one.
  member?: TeamStaffMember | null;
  // Called after the coach is saved, so the staff list can reload.
  onSaved: (name: string) => void;
}

// Popup for adding a coach (pick head or assistant coach, then their details), or editing one.
export default function AddStaffModal({ isOpen, onClose, teamId, member, onSaved }: AddStaffModalProps) {
  // Mount it per open (the Staff tab does) so an edit starts from the entry it was opened for.
  const [form, setForm] = useState<Form>(() => (member ? formFor(member) : INITIAL));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // The invitation is keyed by the email, so the API refuses to change it while one is
  // pending or the coach is on the team.
  const emailLocked =
    !!member && (member.invitationStatus === "ACTIVE" || (member.invitationStatus === "INVITED" && !member.invitationExpired));

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const close = () => {
    setForm(INITIAL);
    setErrors({});
    onClose();
  };

  // Sends only what changed; a cleared last name or phone is sent as null.
  const saveEdit = async (m: TeamStaffMember) => {
    const schema = m.roleValue === "OTHER" ? editImportedStaffSchema : addStaffSchema;
    if (!(await validateAndSetErrors(schema, form, setErrors))) return;
    const before = formFor(m);
    const { firstName, lastName } = splitName(form.name);
    const email = form.email.trim();
    const changes: Record<string, unknown> = {
      ...(form.role && form.role !== before.role && { role: ROLE_VALUE[form.role] }),
      ...(form.name.trim() !== before.name && { firstName, lastName }),
      ...(email.toLowerCase() !== before.email.toLowerCase() && { email }),
      ...(form.phone !== before.phone && { phone: form.phone || null }),
    };
    if (Object.keys(changes).length === 0) return close();
    setSaving(true);
    // Errors (e.g. the email is already on this team's staff) are toasted by apiCall.
    const result = await apiCall({
      endpoint: routes.api.rosterStaffMember(m.id),
      method: "PATCH",
      data: changes,
      invalidates: [routes.api.rosterStaff],
    });
    setSaving(false);
    if (!result.success) return;
    onSaved(form.name.trim());
    close();
  };

  const save = async () => {
    if (member) return saveEdit(member);
    if (!(await validateAndSetErrors(addStaffSchema, form, setErrors))) return;
    const role = form.role as CoachRole;
    const { firstName, lastName } = splitName(form.name);
    setSaving(true);
    // Adds the coach to the staff list only; inviting them to Fan Hub is a separate step.
    // Errors (e.g. someone with this email is already on the staff) are toasted by apiCall.
    const result = await apiCall({
      endpoint: routes.api.rosterStaff,
      method: "POST",
      data: {
        schoolTeamId: teamId,
        role: ROLE_VALUE[role],
        firstName,
        ...(lastName && { lastName }),
        email: form.email.trim(),
        ...(form.phone && { phone: form.phone }),
      },
      invalidates: [routes.api.rosterStaff],
    });
    setSaving(false);
    if (!result.success) return;
    onSaved(form.name.trim());
    close();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={member ? "Edit Staff" : "Add Staff"}
      className="max-w-[min(560px,calc(100vw-2rem))] items-stretch"
    >
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
                  <span className="text-base font-semibold text-midnight-navy">{member ? role : `Add ${role}`}</span>
                  <span className="text-sm text-midnight-navy/60">{description}</span>
                </button>
              );
            })}
          </div>
          {errors.role && <p className="text-sm text-error">{errors.role}</p>}
          {member?.roleValue === "OTHER" && !form.role && (
            <p className="text-sm text-midnight-navy/60">{`Keeps the imported title "${member.role}" unless you pick a role.`}</p>
          )}
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
        <div className="flex flex-col gap-1">
          <Input
            label="Email"
            name="staffEmail"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="alex@school.edu"
            error={errors.email}
            disabled={emailLocked}
          />
          {emailLocked && (
            <p className="text-sm text-midnight-navy/60">
              The email can&apos;t change while an invitation is pending or the coach is on the team.
            </p>
          )}
        </div>
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
        <Button
          label={saving ? (member ? "Saving…" : "Adding…") : member ? "Save Changes" : "Add Staff"}
          variant="cta"
          onClick={save}
          disabled={saving}
          fullWidth
        />
      </div>
    </Modal>
  );
}
