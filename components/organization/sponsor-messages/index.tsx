"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/common/button";
import FilterChips from "@/components/common/filter-chips";
import Loader from "@/components/common/loader";
import Pagination from "@/components/common/pagination";
import SearchInput from "@/components/common/search-input";
import SectionCard from "@/components/common/section-card";
import InventoryEventPicker from "@/components/organization/inventory/event-picker";
import ThreadRow from "@/components/organization/sponsor-messages/thread-row";
import ThreadPane from "@/components/organization/sponsor-messages/thread-pane";
import { STATUS_FILTERS } from "@/components/organization/sponsor-messages/data";
import { useSponsorThreads } from "@/components/organization/sponsor-messages/use-sponsor-threads";
import { orgKindOf, useAuth } from "@/context/auth";
import { useSelectedEvent } from "@/context/selected-event";
import { routes } from "@/utils/routes";
import type { ConversationStatusFilter } from "@/utils/types/sponsor-ai";

interface SponsorMessagesPageProps {
  // The conversation to open first, from "Open in Sponsor Messages" on an approved draft.
  threadId?: string;
}

// Sponsor Messages (FANHUB_SPONSOR_AI_FRONTEND_SPONSOR_MESSAGES.md): one conversation per approved
// email once it has gone out, with its follow-ups and the sponsor's replies. A tournament sees one
// event's conversations at a time.
export default function SponsorMessagesPage({ threadId }: SponsorMessagesPageProps) {
  const router = useRouter();
  const kind = orgKindOf(useAuth().org);
  const isTournament = kind === "tournament";
  const { event, setEvent, noEvents } = useSelectedEvent();
  const [status, setStatus] = useState<ConversationStatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(threadId);

  // Nothing loads until the org type is known, and a tournament until its event is picked.
  const ready = kind !== null && (!isTournament || !!event || noEvents);
  const { list, loading, error, refresh } = useSponsorThreads(ready, {
    eventId: isTournament ? event?.id : undefined,
    status,
    search,
    page,
  });
  const items = list?.items ?? [];
  const activeId = selectedId ?? items[0]?.id;
  const counts = list?.counts;
  const none = !!list && list.counts.ALL === 0 && !search;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2 text-white max-w-[720px]">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          Sponsor Messages
        </h2>
        <p className="text-base leading-[26px]">
          Every email the Sponsor AI Agent sent lives here as a conversation, with its follow-ups, the sponsor’s replies and
          whether each email was opened.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {isTournament && (
          <div className="max-w-[420px]">
            <InventoryEventPicker
              value={event?.id ?? ""}
              selectedName={event?.name}
              onChange={(id, name) => {
                setEvent({ id, name });
                setPage(1);
                setSelectedId(undefined);
              }}
              refreshKey={0}
            />
          </div>
        )}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <FilterChips
            ariaLabel="Filter by status"
            options={STATUS_FILTERS.map((f) => ({ value: f.value, label: counts ? `${f.label} (${counts[f.value]})` : f.label }))}
            value={status}
            onChange={(next) => {
              setStatus(next);
              setPage(1);
            }}
          />
          <SearchInput
            variant="dark"
            aria-label="Search conversations"
            placeholder="Search business, contact or subject"
            value={search}
            maxLength={100}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="lg:max-w-[360px]"
          />
        </div>
      </div>

      {!list ? (
        loading || !ready ? (
          <Loader />
        ) : (
          <p className="py-8 text-center text-sm text-white/60">{error ?? "Couldn’t load the conversations."}</p>
        )
      ) : none && !activeId ? (
        <SectionCard
          title="No conversations yet"
          description="Approve a follow-up in the Sponsor AI Agent. Its conversation appears here once the email goes out."
          className="items-center text-center py-12"
        >
          <Button variant="cta" label="Go to Sponsor AI Agent" onClick={() => router.push(routes.ui.sponsorAiAgent)} className="px-6" />
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)] gap-6 items-start">
          <section aria-label="Conversations" className="rounded-[8px] p-3 flex flex-col gap-2 backdrop-blur-[48px] bg-surface-06">
            <h3 className="px-3 pt-2 pb-1 text-xs font-bold tracking-[1.2px] text-white/60">{`CONVERSATIONS · ${list.pagination.total}`}</h3>
            {items.map((t) => (
              <ThreadRow key={t.id} thread={t} selected={t.id === activeId} onSelect={() => setSelectedId(t.id)} />
            ))}
            {items.length === 0 && <p className="px-3 py-6 text-center text-sm text-white/60">No conversations match.</p>}
            <Pagination page={page} pageCount={list.pagination.totalPages} onChange={setPage} className="self-center" />
          </section>
          {activeId && (
            <ThreadPane
              key={activeId}
              id={activeId}
              summary={items.find((t) => t.id === activeId) ?? null}
              onStopped={refresh}
            />
          )}
        </div>
      )}
    </div>
  );
}
