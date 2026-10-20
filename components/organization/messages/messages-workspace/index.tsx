"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ChevronRight, Plus } from "lucide-react";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import { fetchConversation, startDirect } from "@/components/organization/messages/chat-api";
import ChatBox from "@/components/organization/messages/chat-box";
import ConversationRow from "@/components/organization/messages/conversation-row";
import GroupForm from "@/components/organization/messages/group-form";

import MemberPicker from "@/components/organization/messages/member-picker";
import type { ChatAudience, MemberTab, OrgConversation, TeamMember } from "@/components/organization/messages/types";
import type { Team } from "@/components/organization/teams/data";
import { useOrgTeams } from "@/components/organization/teams/use-org-teams";
import { useSetup } from "@/context/setup";

// Clickable team rows (crest, two lines of text): native <button>s, not action buttons.
const ROW = "cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors";
const ICON_BUTTON = "cursor-pointer size-9 bg-transparent hover:bg-white/10";

// "chat" keeps the conversation it was opened with; the polled list's newer copy wins when there is one.
type View =
  | { kind: "list" }
  | { kind: "team" }
  | { kind: "members"; team: Team }
  | { kind: "group"; team: Team; audience: ChatAudience }
  | { kind: "chat"; conversation: OrgConversation };

interface MessagesWorkspaceProps {
  // The org's conversations across all teams, polled once for the dashboard (context/org-chat).
  conversations: OrgConversation[];
  loading: boolean;
  // Refetches the conversations (after a send or a read receipt).
  onRefresh: () => void;
  // Puts a just-created or just-fetched conversation in the list.
  onUpsert: (conversation: OrgConversation) => void;
  // A conversation to open straight away (the header's messages box links here with ?chat=).
  initialChatId?: string;
}

// The messaging screens: the chats list, then "+" picks a team, then someone on its Players /
// Parents / Staff / Followers tabs for a direct chat, or a tab / chosen people for a group.
// Rendered on the Communications page.
export default function MessagesWorkspace({ conversations, loading, onRefresh, onUpsert, initialChatId }: MessagesWorkspaceProps) {
  const { savedSchool } = useSetup();
  const { teams, loading: teamsLoading } = useOrgTeams();
  const [view, setView] = useState<View>(loading || conversations.length > 0 ? { kind: "list" } : { kind: "team" });
  const [tab, setTab] = useState<MemberTab>("players");
  const [selected, setSelected] = useState<string[]>([]);
  const [openingFanId, setOpeningFanId] = useState<string | null>(null);
  // The linked chat, shown as soon as the polled list contains it; cleared when the user goes back.
  const [pendingChatId, setPendingChatId] = useState(initialChatId ?? null);

  const pickTeam = (team: Team) => {
    setTab("players");
    setSelected([]);
    setView({ kind: "members", team });
  };

  const openChat = (conversation: OrgConversation) => {
    onUpsert(conversation);
    setView({ kind: "chat", conversation });
  };

  // Reopens the existing direct chat with this fan, or starts one (idempotent per team + fan).
  const openDirect = async (team: Team, member: TeamMember) => {
    const known = conversations.find((c) => c.id === member.directConversationId);
    if (known) {
      setView({ kind: "chat", conversation: known });
      return;
    }
    setOpeningFanId(member.fan.id);
    const conversation = member.directConversationId
      ? await fetchConversation(member.directConversationId)
      : await startDirect(team.id, member.fan.id);
    setOpeningFanId(null);
    if (conversation) openChat(conversation);
  };

  const chat =
    view.kind === "chat"
      ? (conversations.find((c) => c.id === view.conversation.id) ?? view.conversation)
      : view.kind === "list" && pendingChatId
        ? (conversations.find((c) => c.id === pendingChatId) ?? null)
        : null;

  const showList = () => {
    setPendingChatId(null);
    setView({ kind: "list" });
  };

  const back =
    view.kind === "team"
      ? () => setView({ kind: "list" })
      : view.kind === "members"
        ? () => setView({ kind: "team" })
        : view.kind === "group"
          ? () => setView({ kind: "members", team: view.team })
          : null;
  const heading =
    view.kind === "team"
      ? "Choose a Team"
      : view.kind === "members"
        ? view.team.name
        : view.kind === "group"
          ? "New Group"
          : "Messages";

  const crest = savedSchool?.logoUrl || "/images/preview-crest.png";

  return (
    <>
      {/* Title bar */}
      <div className="h-20 shrink-0 flex items-center gap-3 px-5 border-b border-white/10">
        {back && (
          <Button
            size="icon"
            icon={<ArrowLeft className="size-5" strokeWidth={2} />}
            onClick={back}
            aria-label="Back"
            className={ICON_BUTTON}
          />
        )}
        <h2 className="flex-1 min-w-0 truncate font-display font-black text-2xl uppercase text-white leading-none">{heading}</h2>
        {(view.kind === "list" || view.kind === "chat") && (
          <Button
            size="icon"
            icon={<Plus className="size-5" strokeWidth={2} />}
            onClick={() => {
              setPendingChatId(null);
              setView({ kind: "team" });
            }}
            aria-label="New message"
            title="New message"
            className={ICON_BUTTON}
          />
        )}
      </div>

      {chat ? (
        <ChatBox key={chat.id} conversation={chat} onBack={showList} onActivity={onRefresh} />
      ) : view.kind === "members" ? (
        <MemberPicker
          key={view.team.id}
          team={view.team}
          tab={tab}
          onTabChange={setTab}
          selected={selected}
          onSelectedChange={setSelected}
          openingFanId={openingFanId}
          onOpenDirect={(member) => void openDirect(view.team, member)}
          onNewGroup={(audience) => setView({ kind: "group", team: view.team, audience })}
        />
      ) : view.kind === "group" ? (
        <GroupForm
          team={view.team}
          initialAudience={view.audience}
          selected={selected}
          onCreated={(conversation) => {
            setSelected([]);
            openChat(conversation);
          }}
        />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-3">
          {view.kind === "list" &&
            (loading ? (
              <Loader />
            ) : conversations.length === 0 ? (
              <div className="m-auto flex flex-col items-center gap-4 text-center">
                <p className="text-sm text-white/50">No conversations yet. Message a player, parent, coach or follower of one of your teams.</p>
                <Button variant="cta" label="New Message" onClick={() => setView({ kind: "team" })} />
              </div>
            ) : (
              conversations.map((c) => (
                <ConversationRow key={c.id} conversation={c} onClick={() => setView({ kind: "chat", conversation: c })} />
              ))
            ))}

          {view.kind === "team" &&
            (teamsLoading ? (
              <Loader />
            ) : teams.length === 0 ? (
              <p className="py-12 text-center text-sm text-white/50">No teams yet. Add a team to message its people.</p>
            ) : (
              teams.map((t) => (
                <button key={t.id} type="button" onClick={() => pickTeam(t)} className={ROW}>
                  <Image
                    src={crest}
                    alt=""
                    width={40}
                    height={40}
                    // The school logo may be an uploaded remote URL with no configured image host.
                    unoptimized={crest.startsWith("http")}
                    className="size-10 shrink-0 rounded-full object-cover bg-black/40 p-0.5 border-2"
                    style={{ borderColor: t.ring }}
                  />
                  <span className="flex-1 flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-white truncate">{t.name}</span>
                    <span className="text-xs text-white/50 truncate">{`${t.sport} · ${t.level}`}</span>
                  </span>
                  <ChevronRight className="size-4 text-white/50" />
                </button>
              ))
            ))}
        </div>
      )}
    </>
  );
}
