"use client";

import { useCallback, useState } from "react";
import { Plus, Power, Settings } from "lucide-react";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import Loader from "@/components/common/loader";
import PageHeading from "@/components/common/page-heading";
import ChatPane from "@/components/organization/fanhub-ai/chat-pane";
import SettingsModal from "@/components/organization/fanhub-ai/settings-modal";
import ThreadRow from "@/components/organization/fanhub-ai/thread-row";
import { useAgentSettings } from "@/components/organization/fanhub-ai/use-agent-settings";
import { useAgentThread } from "@/components/organization/fanhub-ai/use-agent-thread";
import { useAgentThreads } from "@/components/organization/fanhub-ai/use-agent-threads";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";

interface FanHubAiPageProps {
  // From ?thread=: the chat to open.
  threadId?: string;
}

// FanHub AI: the organization's own AI agent (FANHUB_ORGANISER_AGENT_FRONTEND.md). The organiser chats with it
// in plain language; it reads, changes and removes records only inside this organization, and every change
// waits for Confirm. Chats on the left, the open chat on the right, and the agent's on / off switch and areas
// behind Agent settings.
export default function FanHubAiPage({ threadId }: FanHubAiPageProps) {
  const settingsState = useAgentSettings();
  const { threads, loading: threadsLoading, error: threadsError, refresh: refreshThreads, touch, remove } = useAgentThreads();
  const [selectedId, setSelectedId] = useState<string | null>(threadId ?? null);
  // Changes when the organiser opens a chat (not when a new chat gets its thread), so the box starts empty.
  const [paneKey, setPaneKey] = useState(0);
  // Below xl the list and the chat take turns.
  const [showChat, setShowChat] = useState(!!threadId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // The URL keeps the open chat, so a reload comes back to it (no navigation: the page keeps its state).
  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    window.history.replaceState(null, "", id ? routes.ui.fanhubAiThread(id) : routes.ui.fanhubAi);
  }, []);

  const open = (id: string | null) => {
    select(id);
    setPaneKey((key) => key + 1);
    setShowChat(true);
  };

  const chat = useAgentThread({ threadId: selectedId, onCreated: select, onReply: touch });

  const settings = settingsState.settings;
  const agentOff = settings?.enabled === false;
  const summary = threads?.find((t) => t.id === selectedId);
  const title = chat.thread?.title || summary?.title || "New chat";

  const deleteOpen = async () => {
    if (!selectedId) return false;
    const deleted = await remove(selectedId);
    if (deleted) {
      open(null);
      setShowChat(false);
    }
    return deleted;
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        title="FanHub AI"
        description="Your organization’s own AI agent. Ask it to look up, add or change your games, teams, campaigns, tickets and more. Nothing changes until you confirm."
        actions={
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button
              label="Agent settings"
              icon={<Settings className="size-5" />}
              onClick={() => setSettingsOpen(true)}
              disabled={!settings}
            />
            <Button variant="cta" label="New chat" icon={<Plus className="size-5" />} onClick={() => open(null)} className="px-6" />
          </div>
        }
      />

      {settingsState.error && !settings && (
        <p className="text-sm text-white/60">{settingsState.error}</p>
      )}

      {agentOff && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#ffc999]/30 bg-[#3d2a12] px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-[#ffc999]">
            <Power className="size-4 shrink-0" aria-hidden="true" />
            Your agent is turned off. Your chats stay readable, but it won’t answer until you turn it on.
          </p>
          <Button size="sm" label="Turn it on" onClick={() => setSettingsOpen(true)} className="h-9 px-4 text-sm bg-white/15" />
        </div>
      )}

      <div className="h-[calc(100vh-280px)] min-h-[560px] grid grid-cols-1 grid-rows-1 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)] rounded-[8px] overflow-hidden border border-white/10 bg-[rgba(11,28,45,0.96)] backdrop-blur-[48px]">
        <section
          aria-label="Chats"
          className={cn("min-h-0 flex flex-col xl:border-r border-white/10", showChat && "hidden xl:flex")}
        >
          <h3 className="px-5 pt-5 pb-2 text-xs font-bold tracking-[1.2px] text-white/60">
            {threads ? `CHATS · ${threads.length}` : "CHATS"}
          </h3>
          <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 flex flex-col gap-1">
            {threadsLoading ? (
              <Loader className="m-auto" />
            ) : !threads ? (
              <div className="m-auto flex flex-col items-center gap-3 px-4 text-center">
                <p className="text-sm text-white/60">{threadsError ?? "Couldn’t load your chats."}</p>
                <Button size="sm" label="Try again" onClick={() => void refreshThreads()} className="h-9 px-4 text-sm" />
              </div>
            ) : threads.length === 0 ? (
              <p className="m-auto px-4 text-center text-sm text-white/50">
                No chats yet. Ask your agent something to start one.
              </p>
            ) : (
              threads.map((thread) => (
                <ThreadRow
                  key={thread.id}
                  thread={thread}
                  selected={thread.id === selectedId}
                  onSelect={() => open(thread.id)}
                />
              ))
            )}
          </div>
        </section>

        <ChatPane
          key={paneKey}
          thread={chat.thread}
          title={title}
          loading={chat.loading}
          loadError={chat.loadError}
          waiting={chat.waiting}
          notice={chat.notice}
          outgoing={chat.outgoing}
          expiredTokens={chat.expiredTokens}
          agentOff={agentOff}
          onSend={chat.send}
          onAnswer={chat.answer}
          onRefresh={chat.refresh}
          onDelete={selectedId ? () => setConfirmDelete(true) : undefined}
          onBack={() => setShowChat(false)}
          onOpenSettings={() => setSettingsOpen(true)}
          className={cn(!showChat && "hidden xl:flex")}
        />
      </div>

      {settingsOpen && settings && (
        <SettingsModal settings={settings} onClose={() => setSettingsOpen(false)} onSave={settingsState.save} />
      )}

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this chat?"
        message="The chat and its messages are removed from your list. Changes the agent already made stay as they are."
        confirmLabel="Delete chat"
        busyLabel="Deleting…"
        onConfirm={deleteOpen}
        destructive
      />
    </div>
  );
}
