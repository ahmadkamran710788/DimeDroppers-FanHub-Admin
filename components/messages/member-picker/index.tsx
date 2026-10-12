"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Megaphone } from "lucide-react";
import Button from "@/components/common/button";
import Checkbox from "@/components/common/checkbox";
import Loader from "@/components/common/loader";
import SearchInput from "@/components/common/search-input";
import Tabs from "@/components/common/tabs";
import { fetchMembers } from "@/components/messages/chat-api";
import ContactAvatar from "@/components/messages/contact-avatar";
import {
  MEMBER_TABS,
  TAB_AUDIENCE,
  TAB_LABEL,
  tagLabel,
  type ChatAudience,
  type MemberTab,
  type TeamMember,
  type TeamMembers,
} from "@/components/messages/types";
import type { Team } from "@/components/teams/data";
import { cn } from "@/utils/cn";

const ROW = "cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors disabled:opacity-50 disabled:cursor-wait";
const TEXT_BUTTON = "cursor-pointer flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

interface MemberPickerProps {
  team: Team;
  tab: MemberTab;
  onTabChange: (tab: MemberTab) => void;
  // Fans picked for a group, kept across tabs.
  selected: string[];
  onSelectedChange: (next: string[]) => void;
  // The fan whose chat is being opened; their row is disabled meanwhile.
  openingFanId: string | null;
  // Picking someone outside select mode opens the direct chat with them.
  onOpenDirect: (member: TeamMember) => void;
  // "Message all <tab>" (that tab) or "New group" (CUSTOM, the selected fans).
  onNewGroup: (audience: ChatAudience) => void;
}

// The people of a team the org can message, on Players / Parents / Staff / Followers tabs.
export default function MemberPicker({
  team,
  tab,
  onTabChange,
  selected,
  onSelectedChange,
  openingFanId,
  onOpenDirect,
  onNewGroup,
}: MemberPickerProps) {
  const [members, setMembers] = useState<TeamMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selecting, setSelecting] = useState(selected.length > 0);

  useEffect(() => {
    let cancelled = false;
    fetchMembers(team.id).then((data) => {
      if (cancelled) return;
      setMembers(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [team.id]);

  // The response holds the whole team, so search filters here instead of refetching.
  const query = search.trim().toLowerCase();
  const rows = (members?.tabs[tab] ?? []).filter(
    (m) => !query || m.fan.name.toLowerCase().includes(query) || m.fan.email.toLowerCase().includes(query)
  );
  const tabCount = members?.counts[tab] ?? 0;

  const toggle = (fanId: string) =>
    onSelectedChange(selected.includes(fanId) ? selected.filter((id) => id !== fanId) : [...selected, fanId]);

  const stopSelecting = () => {
    setSelecting(false);
    onSelectedChange([]);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-5 pt-5 flex flex-col gap-3">
        {/* Four tabs with counts are wider than the drawer, so the bar scrolls sideways. */}
        <div className="overflow-x-auto">
          <Tabs
            tabs={MEMBER_TABS}
            active={tab}
            onChange={onTabChange}
            counts={members?.counts}
            // Tab values are the API's lowercase keys; buttons don't inherit text-transform.
            className="w-max min-w-full *:capitalize"
          />
        </div>
        <SearchInput
          variant="dark"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search members"
        />
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNewGroup(TAB_AUDIENCE[tab])}
            disabled={loading || tabCount === 0}
            className={TEXT_BUTTON}
          >
            <Megaphone className="size-4" strokeWidth={2} />
            {`Message all ${TAB_LABEL[tab]}`}
          </button>
          <button type="button" onClick={selecting ? stopSelecting : () => setSelecting(true)} className={TEXT_BUTTON}>
            {selecting ? "Cancel" : "Select"}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3 flex flex-col gap-3">
        {loading ? (
          <Loader />
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-white/50">
            {query ? "Nobody matches that search." : `No ${TAB_LABEL[tab].toLowerCase()} with a Fan Hub account yet.`}
          </p>
        ) : (
          rows.map((m) => {
            const checked = selected.includes(m.fan.id);
            // Staff tags differ (Coach, Scorekeeper…); on the other tabs the email tells people apart.
            const detail = tab === "staff" ? [...m.tags.map(tagLabel), m.fan.email].join(" · ") : m.fan.email;
            return (
              <button
                key={m.fan.id}
                type="button"
                onClick={() => (selecting ? toggle(m.fan.id) : onOpenDirect(m))}
                disabled={openingFanId !== null}
                aria-pressed={selecting ? checked : undefined}
                className={cn(ROW, selecting && checked && "bg-white/15")}
              >
                {selecting && <Checkbox checked={checked} />}
                <ContactAvatar name={m.fan.name} src={m.fan.avatarUrl} />
                <span className="flex-1 flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-white truncate">{m.fan.name}</span>
                  <span className="text-xs text-white/50 truncate">{detail}</span>
                </span>
                {!selecting &&
                  (openingFanId === m.fan.id ? (
                    <span className="size-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
                  ) : (
                    <ChevronRight className="size-4 text-white/50" />
                  ))}
              </button>
            );
          })
        )}
      </div>

      {selecting && (
        <div className="px-5 py-4 border-t border-white/10">
          <Button
            variant="cta"
            label={selected.length > 0 ? `New Group (${selected.length})` : "Pick people for a group"}
            onClick={() => onNewGroup("CUSTOM")}
            disabled={selected.length === 0}
            fullWidth
          />
        </div>
      )}
    </div>
  );
}
