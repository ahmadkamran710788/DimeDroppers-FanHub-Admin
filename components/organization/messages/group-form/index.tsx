"use client";

import { useState } from "react";
import Button from "@/components/common/button";
import FilterChips, { type FilterChipOption } from "@/components/common/filter-chips";
import Input from "@/components/common/input";
import Textarea from "@/components/common/textarea";
import { startGroup } from "@/components/organization/messages/chat-api";
import { groupSchema } from "@/components/organization/messages/schema";
import type { ChatAudience, OrgConversation } from "@/components/organization/messages/types";
import type { Team } from "@/components/organization/teams/data";
import { validateAndSetErrors } from "@/utils/validation";

const AUDIENCE_HINT: Record<ChatAudience, string> = {
  PLAYERS: "Everyone on the Players tab.",
  PARENTS: "Everyone on the Parents tab.",
  STAFF: "Coaches, plus the team's official scorekeepers and videographers.",
  FOLLOWERS: "Everyone who follows the team.",
  ALL: "Everyone on any tab, each person once.",
  CUSTOM: "Only the people you picked.",
};

interface GroupFormProps {
  team: Team;
  initialAudience: ChatAudience;
  // Fans picked in select mode; offered as the "Selected" audience.
  selected: string[];
  onCreated: (conversation: OrgConversation) => void;
}

// New group chat: a title everyone sees, who it goes to and an optional first message.
export default function GroupForm({ team, initialAudience, selected, onCreated }: GroupFormProps) {
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState<ChatAudience>(initialAudience);
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const options: FilterChipOption<ChatAudience>[] = [
    { value: "PLAYERS", label: "Players" },
    { value: "PARENTS", label: "Parents" },
    { value: "STAFF", label: "Staff" },
    { value: "FOLLOWERS", label: "Followers" },
    { value: "ALL", label: "Everyone" },
    ...(selected.length > 0 ? [{ value: "CUSTOM" as const, label: `Selected (${selected.length})` }] : []),
  ];

  const submit = async () => {
    if (!(await validateAndSetErrors(groupSchema, { title, body }, setErrors))) return;
    setSaving(true);
    const conversation = await startGroup({
      schoolTeamId: team.id,
      title: title.trim(),
      audience,
      ...(audience === "CUSTOM" && { fanIds: selected }),
      ...(body.trim() && { body: body.trim() }),
    });
    setSaving(false);
    if (conversation) onCreated(conversation);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-5"
    >
      <Input
        label="Title"
        name="group-title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
        }}
        placeholder="e.g. Varsity players"
        variant="dark"
        labelClassName="text-white"
        hint="Everyone in the group sees it."
        error={errors.title}
        required
      />

      <div className="flex flex-col gap-2">
        <span className="text-base font-medium text-white">Send to</span>
        <FilterChips options={options} value={audience} onChange={setAudience} />
        <p className="text-sm text-white/60">{`${AUDIENCE_HINT[audience]} Team: ${team.name}.`}</p>
      </div>

      <Textarea
        label="First message"
        name="group-body"
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          if (errors.body) setErrors((prev) => ({ ...prev, body: "" }));
        }}
        placeholder="Optional. Sent as soon as the group is created."
        maxLength={4000}
        rows={5}
        fieldVariant="dark"
        counterInLabel
        error={errors.body}
      />

      <Button type="submit" variant="cta" label={saving ? "Creating…" : "Create Group"} disabled={saving} fullWidth />
    </form>
  );
}
