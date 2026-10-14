"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ArrowLeft, ChevronRight, Plus, X } from "lucide-react";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import { fetchConversation, startDirect } from "@/components/messages/chat-api";
import ChatBox from "@/components/messages/chat-box";
import ContactAvatar from "@/components/messages/contact-avatar";
import GroupForm from "@/components/messages/group-form";
import { conversationName, formatListTime, previewText } from "@/components/messages/helpers";
import MemberPicker from "@/components/messages/member-picker";
import type { ChatAudience, MemberTab, OrgConversation, TeamMember } from "@/components/messages/types";
import type { Team } from "@/components/teams/data";
import { useOrgTeams } from "@/components/teams/use-org-teams";
import { useSetup } from "@/context/setup";
import { cn } from "@/utils/cn";

const ROW = "cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors";
const ICON_BUTTON = "cursor-pointer size-9 shrink-0 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors";

// "chat" keeps the conversation it was opened with; the polled list's newer copy wins when there is one.
type View =
  | { kind: "list" }
  | { kind: "team" }
  | { kind: "members"; team: Team }
  | { kind: "group"; team: Team; audience: ChatAudience }
  | { kind: "chat"; conversation: OrgConversation };

interface MessagesPanelProps {
  // The org's conversations across all teams, polled by the header.
  conversations: OrgConversation[];
  loading: boolean;
  // Refetches the conversations (after a send or a read receipt).
  onRefresh: () => void;
  // Puts a just-created or just-fetched conversation in the list.
  onUpsert: (conversation: OrgConversation) => void;
  onClose: () => void;
}

// Right-side messages drawer. It opens on the chats list; "+" picks a team, then someone on its
// Players / Parents / Staff / Followers tabs for a direct chat, or a tab / chosen people for a group.
export default function MessagesPanel({ conversations, loading, onRefresh, onUpsert, onClose }: MessagesPanelProps) {
  const { savedSchool } = useSetup();
  const { teams, loading: teamsLoading } = useOrgTeams();
  const [view, setView] = useState<View>(loading || conversations.length > 0 ? { kind: "list" } : { kind: "team" });
  const [tab, setTab] = useState<MemberTab>("players");
  const [selected, setSelected] = useState<string[]>([]);
  const [openingFanId, setOpeningFanId] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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

  const chat = view.kind === "chat" ? (conversations.find((c) => c.id === view.conversation.id) ?? view.conversation) : null;

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

  return createPortal(
    <div className="fixed inset-0 z-9995">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside
        role="dialog"
        aria-label="Messages"
        className="absolute top-0 right-0 h-full w-full sm:w-105 flex flex-col bg-[rgba(11,28,45,0.96)] backdrop-blur-[48px] border-l border-white/10 shadow-2xl"
      >
        {/* Title bar */}
        <div className="h-20 shrink-0 flex items-center gap-3 px-5 border-b border-white/10">
          {back && (
            <button type="button" onClick={back} aria-label="Back" className={ICON_BUTTON}>
              <ArrowLeft className="size-5" strokeWidth={2} />
            </button>
          )}
          <h2 className="flex-1 min-w-0 truncate font-display font-black text-2xl uppercase text-white leading-none">{heading}</h2>
          {(view.kind === "list" || view.kind === "chat") && (
            <button
              type="button"
              onClick={() => setView({ kind: "team" })}
              aria-label="New message"
              title="New message"
              className={ICON_BUTTON}
            >
              <Plus className="size-5" strokeWidth={2} />
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Close messages" className={ICON_BUTTON}>
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>

        {chat ? (
          <ChatBox key={chat.id} conversation={chat} onBack={() => setView({ kind: "list" })} onActivity={onRefresh} />
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
                conversations.map((c) => {
                  const unread = c.unreadCount > 0;
                  const at = c.lastMessageAt ?? c.createdAt;
                  return (
                    <button key={c.id} type="button" onClick={() => setView({ kind: "chat", conversation: c })} className={ROW}>
                      <ContactAvatar
                        name={conversationName(c)}
                        src={c.type === "DIRECT" ? c.participants[0]?.fan.avatarUrl : null}
                        group={c.type === "GROUP"}
                      />
                      <span className="flex-1 flex flex-col min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="flex-1 min-w-0 text-sm font-semibold text-white truncate">{conversationName(c)}</span>
                          <span className="shrink-0 text-[11px] text-white/40">{formatListTime(at)}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className={cn("flex-1 min-w-0 text-xs truncate", unread ? "font-medium text-white" : "text-white/50")}>
                            {previewText(c)}
                          </span>
                          {unread && (
                            <span className="shrink-0 min-w-5 h-5 px-1 rounded-full bg-error text-white text-[11px] font-bold leading-none flex items-center justify-center">
                              {c.unreadCount}
                            </span>
                          )}
                        </span>
                        {c.team && <span className="text-[11px] text-white/40 truncate">{c.team.name}</span>}
                      </span>
                    </button>
                  );
                })
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
      </aside>
    </div>,
    document.body
  );
}
