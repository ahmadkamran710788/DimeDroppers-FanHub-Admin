"use client";

import { useState } from "react";
import Button from "@/components/common/button";
import Modal from "@/components/common/modal";
import Toggle from "@/components/common/toggle";
import { AREAS, fieldLabel } from "@/components/organization/fanhub-ai/data";
import { formatBubbleTime } from "@/components/organization/messages/helpers";
import { cn } from "@/utils/cn";
import type { AgentArea, AgentSettings, AgentSettingsUpdate } from "@/utils/types/organiser-agent";

// The switch is made for dark backgrounds; on the white popup its off track is darkened.
const SWITCH = "[&_[role=switch][aria-checked=false]]:bg-midnight-navy/20";

interface SettingsModalProps {
  settings: AgentSettings;
  onClose: () => void;
  // Returns whether it saved.
  onSave: (update: AgentSettingsUpdate) => Promise<boolean>;
}

// The organisation's own switch for its agent (only the organisation controls it): on / off, and the areas
// it may work in. Saved together; takes effect on the agent's next message.
export default function SettingsModal({ settings, onClose, onSave }: SettingsModalProps) {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [areas, setAreas] = useState<Partial<Record<AgentArea, boolean>>>(() =>
    Object.fromEntries(settings.areas.map((a) => [a.family, a.enabled]))
  );
  const [saving, setSaving] = useState(false);

  const changed =
    enabled !== settings.enabled || settings.areas.some((a) => (areas[a.family] ?? true) !== a.enabled);

  async function save() {
    setSaving(true);
    const disabledFamilies = settings.areas.filter((a) => areas[a.family] === false).map((a) => a.family);
    const saved = await onSave({ enabled, disabledFamilies });
    setSaving(false);
    if (saved) onClose();
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Agent settings"
      className="max-w-[min(560px,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] overflow-y-auto items-stretch gap-5"
    >
      <p className="text-sm text-midnight-navy/70">
        Only your organization controls its agent. It works only with your organization’s records, and every change
        waits for your Confirm.
      </p>

      <div className="flex items-center justify-between gap-4 rounded-[12px] bg-midnight-navy/5 px-4 py-3">
        <div className="flex flex-col">
          <span className="text-base font-semibold text-midnight-navy">Agent</span>
          <span className="text-xs text-midnight-navy/60">
            {enabled ? "On: it answers your messages." : "Off: every message is refused. Your chats stay readable."}
          </span>
        </div>
        <Toggle ariaLabel="Agent on" checked={enabled} onChange={setEnabled} className={SWITCH} />
      </div>

      <div className={cn("flex flex-col gap-1", !enabled && "opacity-60")}>
        <h3 className="text-xs font-bold tracking-[1.2px] uppercase text-midnight-navy/60">Areas it can work in</h3>
        <ul className="flex flex-col divide-y divide-midnight-navy/10">
          {settings.areas.map(({ family }) => (
            <li key={family} className="flex items-center justify-between gap-4 py-3">
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-midnight-navy">{AREAS[family]?.label ?? fieldLabel(family)}</span>
                {AREAS[family]?.hint && <span className="text-xs text-midnight-navy/60">{AREAS[family].hint}</span>}
              </div>
              <Toggle
                size="sm"
                ariaLabel={AREAS[family]?.label ?? fieldLabel(family)}
                checked={areas[family] ?? true}
                onChange={(on) => setAreas((prev) => ({ ...prev, [family]: on }))}
                className={SWITCH}
              />
            </li>
          ))}
        </ul>
        <p className="text-xs text-midnight-navy/50">
          {settings.updatedAt
            ? `Last saved ${formatBubbleTime(settings.updatedAt)}.`
            : "Not saved yet: the agent is on and works in every area."}
        </p>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Button variant="secondary" label="Cancel" onClick={onClose} fullWidth />
        <Button variant="cta" label={saving ? "Saving…" : "Save"} onClick={() => void save()} disabled={saving || !changed} fullWidth />
      </div>
    </Modal>
  );
}
