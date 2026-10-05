"use client";

import { useState } from "react";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Modal from "@/components/common/modal";
import Select from "@/components/common/select";
import type { Athlete, Sport } from "@/components/teams/data";
import { addPlayerSchema } from "@/components/teams/team-details/add-player-modal/schema";
import { validateAndSetErrors } from "@/utils/validation";

const POSITIONS: Record<Sport, string[]> = {
  Basketball: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
  Football: ["Quarterback", "Running Back", "Wide Receiver", "Tight End", "Lineman", "Linebacker", "Cornerback", "Safety", "Kicker"],
  Soccer: ["Goalkeeper", "Defender", "Midfielder", "Forward"],
};

// Current school year plus the next six graduating classes.
const GRAD_YEARS = Array.from({ length: 7 }, (_, i) => String(new Date().getFullYear() + i));

const INITIAL = { name: "", email: "", jersey: "", position: "", graduated: "" };
type Form = typeof INITIAL;

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sport: Sport;
  takenJerseys: number[];
  onAdd: (player: Athlete) => void;
}

// Popup form for adding a player to a team's roster.
export default function AddPlayerModal({ isOpen, onClose, sport, takenJerseys, onAdd }: AddPlayerModalProps) {
  const [form, setForm] = useState<Form>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const close = () => {
    setForm(INITIAL);
    setErrors({});
    onClose();
  };

  const save = async () => {
    if (!(await validateAndSetErrors(addPlayerSchema(takenJerseys), form, setErrors))) return;
    onAdd({
      id: `athlete-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      avatar: "",
      jersey: Number(form.jersey),
      position: form.position,
      graduated: Number(form.graduated),
      status: "Active",
    });
    close();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Add Player" className="max-w-[min(520px,calc(100vw-2rem))] items-stretch">
      <div className="w-full flex flex-col gap-4">
        <Input label="Full Name" name="name" required value={form.name} onChange={set("name")} placeholder="Jordan Smith" error={errors.name} />
        <Input
          label="Email"
          name="email"
          type="email"
          required
          value={form.email}
          onChange={set("email")}
          placeholder="jordan@email.com"
          error={errors.email}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Jersey #"
            name="jersey"
            required
            value={form.jersey}
            // Digits only, up to two.
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 2);
              setForm((prev) => ({ ...prev, jersey: v }));
              if (errors.jersey) setErrors((prev) => ({ ...prev, jersey: "" }));
            }}
            placeholder="12"
            error={errors.jersey}
          />
          <Select
            label="Graduation Year"
            name="graduated"
            required
            value={form.graduated}
            onChange={set("graduated")}
            options={GRAD_YEARS.map((y) => ({ label: y, value: y }))}
            placeholder="Select year"
            error={errors.graduated}
          />
        </div>
        <Select
          label="Position"
          name="position"
          required
          value={form.position}
          onChange={set("position")}
          options={POSITIONS[sport].map((p) => ({ label: p, value: p }))}
          placeholder="Select position"
          error={errors.position}
        />
      </div>
      <div className="w-full flex gap-3">
        <Button label="Cancel" variant="secondary" onClick={close} fullWidth />
        <Button label="Add Player" variant="cta" onClick={save} fullWidth />
      </div>
    </Modal>
  );
}
