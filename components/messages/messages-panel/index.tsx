"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ArrowLeft, ChevronRight, Plus, X } from "lucide-react";
import Tabs from "@/components/common/tabs";
import ChatBox from "@/components/messages/chat-box";
import ContactAvatar from "@/components/messages/contact-avatar";
import { GROUP_LABEL, type ContactGroup, type Conversation } from "@/components/messages/types";
import { ATHLETES, FOLLOWERS, STAFF, TEAMS, type Team } from "@/components/teams/data";
import { useSetup } from "@/context/setup";

const GROUPS = ["Players", "Followers", "Staff"] as const satisfies readonly ContactGroup[];

interface Contact {
  id: string;
  name: string;
  detail: string;
  avatar?: string;
}

// Everyone in a team you can message, per tab (sample data until roster APIs exist).
const CONTACTS: Record<ContactGroup, Contact[]> = {
  Players: ATHLETES.map((a) => ({ id: a.id, name: a.name, detail: `#${a.jersey} · ${a.position}`, avatar: a.avatar })),
  Followers: FOLLOWERS.map((f) => ({ id: f.id, name: f.name, detail: f.type })),
  Staff: STAFF.map((s) => ({ id: s.id, name: s.name, detail: s.role })),
};

const ROW = "cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors";
const ICON_BUTTON = "cursor-pointer size-9 shrink-0 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors";

// "list" = the chats, "new" = choose a team and then someone in it, otherwise a chat id.
type View = "list" | "new" | { chatId: string };

interface MessagesPanelProps {
  conversations: Conversation[];
  onConversationsChange: (next: Conversation[]) => void;
  onClose: () => void;
}

// Right-side messages drawer. The first time it lists the teams; picking a team shows its
// Players / Followers / Staff, and picking someone opens the chat. After that it opens on the
// chats list, and "+" starts a new chat.
export default function MessagesPanel({ conversations, onConversationsChange, onClose }: MessagesPanelProps) {
  const { savedSchool } = useSetup();
  const [view, setView] = useState<View>(conversations.length > 0 ? "list" : "new");
  const [team, setTeam] = useState<Team | null>(null);
  const [group, setGroup] = useState<ContactGroup>("Players");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const startNew = () => {
    setTeam(null);
    setGroup("Players");
    setView("new");
  };

  const openChat = (contact: Contact) => {
    if (!team) return;
    const id = `${team.id}-${group}-${contact.id}`;
    // Picking someone you already chat with reopens that chat instead of starting a second one.
    if (!conversations.some((c) => c.id === id)) {
      onConversationsChange([
        {
          id,
          teamId: team.id,
          teamName: team.name,
          group,
          contactId: contact.id,
          contactName: contact.name,
          contactAvatar: contact.avatar,
          messages: [],
        },
        ...conversations,
      ]);
    }
    setView({ chatId: id });
  };

  const chat = typeof view === "object" ? conversations.find((c) => c.id === view.chatId) : undefined;
  const step = view === "new" ? (team ? "contact" : "team") : null;

  // Back from the teams list returns to the chats list, if there is one.
  const back =
    step === "contact"
      ? () => setTeam(null)
      : step === "team" && conversations.length > 0
        ? () => setView("list")
        : null;
  const heading = step === "team" ? "Choose a Team" : step === "contact" && team ? team.name : "Messages";

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
          {view !== "new" && (
            <button type="button" onClick={startNew} aria-label="New message" title="New message" className={ICON_BUTTON}>
              <Plus className="size-5" strokeWidth={2} />
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Close messages" className={ICON_BUTTON}>
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>

        {chat ? (
          <ChatBox
            conversation={chat}
            onBack={() => setView("list")}
            onSend={(text) =>
              onConversationsChange(
                conversations.map((c) =>
                  c.id === chat.id
                    ? { ...c, messages: [...c.messages, { id: `msg-${Date.now()}`, text, sentAt: new Date().toISOString() }] }
                    : c
                )
              )
            }
          />
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-3">
            {view === "list" &&
              conversations.map((c) => {
                const last = c.messages[c.messages.length - 1];
                return (
                  <button key={c.id} type="button" onClick={() => setView({ chatId: c.id })} className={ROW}>
                    <ContactAvatar name={c.contactName} src={c.contactAvatar} />
                    <span className="flex-1 flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-white truncate">{c.contactName}</span>
                      <span className="text-xs text-white/50 truncate">
                        {last ? last.text : `${c.teamName} · ${GROUP_LABEL[c.group]}`}
                      </span>
                    </span>
                    <ChevronRight className="size-4 text-white/50" />
                  </button>
                );
              })}

            {step === "team" &&
              TEAMS.map((t) => (
                <button key={t.id} type="button" onClick={() => setTeam(t)} className={ROW}>
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
              ))}

            {step === "contact" && (
              <>
                <Tabs
                  tabs={GROUPS}
                  active={group}
                  onChange={setGroup}
                  counts={{ Players: CONTACTS.Players.length, Followers: CONTACTS.Followers.length, Staff: CONTACTS.Staff.length }}
                  className="mb-1"
                />
                {CONTACTS[group].map((c) => (
                  <button key={c.id} type="button" onClick={() => openChat(c)} className={ROW}>
                    <ContactAvatar name={c.name} src={c.avatar} />
                    <span className="flex-1 flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-white truncate">{c.name}</span>
                      <span className="text-xs text-white/50 truncate">{c.detail}</span>
                    </span>
                    <ChevronRight className="size-4 text-white/50" />
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </aside>
    </div>,
    document.body
  );
}
