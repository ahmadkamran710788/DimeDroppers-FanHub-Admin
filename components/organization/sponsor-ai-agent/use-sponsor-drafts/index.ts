"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { APPROVE_BATCH_MAX, APPROVE_SKIP_MESSAGE, DRAFTS_PER_PAGE, scopeKey, type AgentScope } from "@/components/organization/sponsor-ai-agent/data";
import { routes } from "@/utils/routes";
import type {
  DraftBatchResult,
  DraftStatusFilter,
  EditDraftBody,
  SponsorDraft,
  SponsorDraftList,
} from "@/utils/types/sponsor-ai";

interface Loaded {
  // The scope, filter and page the list is for, and the reload it answered.
  view: string;
  version: number;
  list: SponsorDraftList | null;
}

// Step 2's drafts (GET /drafts), one page of one status, with every status's count. Drafts are kept
// across searches, so this is the organisation's (or event's) whole review queue. `edit` saves a draft's
// subject / body; `reject` turns drafts down for good, then the list reloads (the counts change).
export function useSponsorDrafts(scope: AgentScope | null, status: DraftStatusFilter, page: number) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [version, setVersion] = useState(0);
  const scoped = scopeKey(scope);
  const eventId = scope?.eventId;
  const view = scoped ? `${scoped}:${status}:${page}` : "";

  useEffect(() => {
    if (!view) return;
    let cancelled = false;
    sponsorRequest<SponsorDraftList>("GET", routes.api.sponsorAiDrafts, {
      params: { status, eventId, page, limit: DRAFTS_PER_PAGE },
    }).then((r) => {
      if (cancelled) return;
      if (!r.view) toast.error(r.message ?? "Couldn't load the drafts. Try again");
      setLoaded({ view, version, list: r.view ?? null });
    });
    return () => {
      cancelled = true;
    };
  }, [view, version, status, eventId, page]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const edit = useCallback(
    async (id: string, body: EditDraftBody) => {
      const r = await sponsorRequest<SponsorDraft>("PATCH", routes.api.sponsorAiDraft(id), { body });
      if (r.view) {
        const saved = r.view;
        setLoaded((prev) =>
          prev?.list ? { ...prev, list: { ...prev.list, items: prev.list.items.map((d) => (d.id === id ? saved : d)) } } : prev
        );
        toast.success("Draft saved");
        return true;
      }
      toast.error(r.message ?? "Couldn't save the draft. Try again");
      // Sent, rejected or gone meanwhile: show it as it is now.
      if (r.status === 409 || r.status === 404) reload();
      return false;
    },
    [reload]
  );

  const reject = useCallback(
    async (ids: string[]) => {
      const r = await sponsorRequest<DraftBatchResult>("POST", routes.api.sponsorAiRejectDrafts, { body: { ids } });
      if (!r.view) {
        toast.error(r.message ?? "Couldn't reject the draft. Try again");
        return false;
      }
      const { done, skipped } = r.view;
      if (skipped.length) {
        toast.error(ids.length === 1 ? "This draft was already sent or rejected" : `${skipped.length} drafts were already sent or rejected`);
      } else {
        toast.success(done.length === 1 ? "Draft rejected" : `${done.length} drafts rejected`);
      }
      reload();
      return true;
    },
    [reload]
  );

  // Approving sends real emails (about 20 a minute, in the background). Up to 100 ids a call; a draft the
  // backend leaves out is explained, then the list reloads (every queued draft is now on the Approved tab).
  const approve = useCallback(
    async (ids: string[]) => {
      let queued = 0;
      const notes = new Set<string>();
      for (let i = 0; i < ids.length; i += APPROVE_BATCH_MAX) {
        const r = await sponsorRequest<DraftBatchResult>("POST", routes.api.sponsorAiApproveDrafts, {
          body: { ids: ids.slice(i, i + APPROVE_BATCH_MAX) },
        });
        if (!r.view) {
          // 503: sending is off or the queue is down; nothing was changed for this batch.
          toast.error(r.message ?? "Couldn't send the emails. Try again");
          break;
        }
        queued += r.view.done.length;
        for (const s of r.view.skipped) {
          const note = APPROVE_SKIP_MESSAGE[s.reason];
          if (note) notes.add(note);
        }
      }
      if (queued) toast.success(queued === 1 ? "1 email queued" : `${queued} emails queued`);
      notes.forEach((note) => toast.error(note));
      reload();
      return queued > 0 || notes.size > 0;
    },
    [reload]
  );

  // The last list for this scope, filter and page stays on screen while a reload is on its way.
  const current = loaded?.view === view ? loaded : null;
  return {
    list: current?.list ?? null,
    loading: !!view && (!current || current.version !== version),
    reload,
    edit,
    reject,
    approve,
  };
}
