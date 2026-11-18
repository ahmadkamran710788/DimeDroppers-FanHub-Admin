"use client";

import { useState } from "react";
import Button from "@/components/common/button";
import Modal from "@/components/common/modal";
import Toggle from "@/components/common/toggle";
import { campaignRow, saveCampaign } from "@/components/organization/engagement/engagement-rows";
import type { ChallengeCampaign } from "@/utils/types/engagement";

// Dark text on the white popup, label left and switch right; the off track is darkened (it is made for dark
// backgrounds).
const ROW = { labelClassName: "text-base text-midnight-navy", className: "w-full justify-between [&_[role=switch][aria-checked=false]]:bg-midnight-navy/20" };

interface ChallengeSettingsModalProps {
  challenge: ChallengeCampaign;
  onClose: () => void;
  // Called after a change, so the list can reload.
  onSaved: () => void;
}

// The gear on a challenge row: allow Dime multipliers and show fans its progress (the on / off switch is
// hidden for now).
// Each switch saves on its own.
export default function ChallengeSettingsModal({ challenge, onClose, onSaved }: ChallengeSettingsModalProps) {
  const row = campaignRow("challenges", challenge);
  const [values, setValues] = useState({ active: row.active, multiplier: row.multiplier, visibility: row.visibility });
  const [saving, setSaving] = useState(false);

  const change = async (key: keyof typeof values, value: boolean) => {
    setSaving(true);
    const saved = await saveCampaign("challenges", row, { [key]: value });
    setSaving(false);
    if (!saved) return;
    setValues((prev) => ({ ...prev, [key]: value }));
    onSaved();
  };

  return (
    <Modal isOpen onClose={onClose} title={challenge.title} className="max-w-[min(480px,calc(100vw-2rem))] items-stretch">
      <div className="w-full flex flex-col gap-5">
        {/* The Active switch is hidden for now; to bring it back:
        <Toggle
          {...ROW}
          label={row.statusLocked ? "Active (an ended challenge can't be turned back on)" : "Active"}
          checked={values.active}
          onChange={(v) => !saving && !row.statusLocked && void change("active", v)}
        /> */}
        <Toggle {...ROW} label="Allow Dime multipliers" checked={values.multiplier} onChange={(v) => !saving && void change("multiplier", v)} />
        <Toggle
          {...ROW}
          label={row.visibilityLabel}
          checked={values.visibility}
          onChange={(v) => !saving && void change("visibility", v)}
        />
        {row.multiplierNote && <p className="text-sm text-midnight-navy/60">Multipliers are off for all challenges in Settings.</p>}
      </div>
      <Button label="Done" variant="cta" onClick={onClose} fullWidth />
    </Modal>
  );
}
