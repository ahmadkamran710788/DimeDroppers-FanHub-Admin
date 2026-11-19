"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { Eye } from "lucide-react";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import type { MediaGame } from "@/components/organization/media/data";
import { useEngageChat, type EngageMessage } from "@/components/organization/media/use-engage-chat";

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function MessageRow({ message }: { message: EngageMessage }) {
  const name = message.fan?.name || "Fan";
  return (
    <li className="flex gap-3">
      <span className="size-10 shrink-0 rounded-full bg-white/15 flex items-center justify-center text-sm font-semibold text-white">
        {initials(name)}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-semibold text-white">{name}</span>
          <span className="text-xs text-white/50">{when(message.createdAt)}</span>
        </div>
        <p className="rounded-2xl rounded-tl-sm bg-white/8 px-4 py-2 text-base leading-6 text-white whitespace-pre-wrap break-words">
          {message.body}
        </p>
      </div>
    </li>
  );
}

function ApiChat({ gameId }: { gameId: string }) {
  const { messages, loading, error, hasMore, loadingOlder, loadOlder } = useEngageChat(gameId);
  const listRef = useRef<HTMLDivElement>(null);
  // Whether the view sits at the newest message, so a new one scrolls into view (but not while reading back).
  const atBottom = useRef(true);
  const lastId = useRef<string | undefined>(undefined);
  const heightBefore = useRef(0);

  // New messages at the bottom keep the view pinned there; older ones loaded above keep the reader's place.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const newest = messages[messages.length - 1]?.id;
    if (newest !== lastId.current) {
      if (atBottom.current) el.scrollTop = el.scrollHeight;
    } else if (heightBefore.current) {
      el.scrollTop += el.scrollHeight - heightBefore.current;
    }
    lastId.current = newest;
    heightBefore.current = 0;
  }, [messages]);

  useEffect(() => {
    if (!loading && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [loading]);

  if (loading) return <Loader />;

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-sm text-white/60">
        <Eye className="size-4" strokeWidth={1.5} />
        View only: fans&apos; public chat for this game, live. Private messages aren&apos;t shown.
      </p>
      {error ? (
        <p className="py-10 text-center text-sm text-white/50">{error}</p>
      ) : messages.length === 0 ? (
        <p className="py-10 text-center text-sm text-white/50">No messages yet. Fans&apos; messages will appear here as they post.</p>
      ) : (
        <div
          ref={listRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
          }}
          className="max-h-[560px] overflow-y-auto pr-2"
        >
          {hasMore && (
            <div className="flex justify-center pb-4">
              <Button
                label={loadingOlder ? "Loading…" : "Load older messages"}
                variant="secondary"
                disabled={loadingOlder}
                onClick={() => {
                  heightBefore.current = listRef.current?.scrollHeight ?? 0;
                  void loadOlder();
                }}
              />
            </div>
          )}
          <ul className="flex flex-col gap-4">
            {messages.map((m) => (
              <MessageRow key={m.id} message={m} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// "Chat" tab: the game's public Engage Live chat, read-only. Sample games have no chat.
export default function GameChat({ game }: { game: MediaGame }) {
  if (!game.fromApi) return <p className="py-10 text-center text-sm text-white/50">No chat for this game.</p>;
  return <ApiChat key={game.id} gameId={game.id} />;
}
