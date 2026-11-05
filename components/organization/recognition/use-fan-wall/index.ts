"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { backendFetch } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { FanWallDraftPage, FanWallItem, FanWallPage, PhotoboothReviewStatus } from "@/utils/types/fan-wall";

// Gallery images per page.
export const GALLERY_PAGE_SIZE = 24;
// The wall is loaded whole (the API caps a page, and a reorder answers, at 100).
const WALL_LIMIT = 100;

interface Result<T> {
  status: number;
  view?: T;
  message?: string;
}

// backendFetch (not apiCall) so the backend's own message (e.g. 409 "already been reviewed") reaches
// the toast, and nothing is cached: the wall changes with every action.
async function request<T>(method: "GET" | "POST" | "PATCH" | "DELETE", endpoint: string, body?: unknown): Promise<Result<T>> {
  try {
    const res = await backendFetch(endpoint, {
      method,
      headers: { Accept: "application/json", ...(body !== undefined && { "Content-Type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (res.ok) return { status: res.status, view: json?.data?.[0] as T };
    return { status: res.status, message: json?.message || "Something went wrong, please try again." };
  } catch {
    return { status: 0, message: "Please check your network and try again." };
  }
}

const query = (params: Record<string, string | number | undefined>) =>
  new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)])
  ).toString();

// Gallery review filter: the drafts API takes one review status at a time.
export type ReviewFilter = PhotoboothReviewStatus;

// The image and fan of a wall item, whichever source it came from (a photobooth image or a fan's upload).
export const wallImageOf = (item: FanWallItem) => {
  const upload = item.source === "UPLOAD" || (!item.photoboothJob && item.upload);
  return upload
    ? { src: item.upload?.imageUrl ?? null, fan: item.upload?.fan?.name ?? "A fan" }
    : { src: item.photoboothJob?.resultUrl ?? null, fan: item.photoboothJob?.fan.name ?? "A fan" };
};

// State and actions for Fan Wall Photos: the gallery of photos fans uploaded from the app (the review queue,
// by review status, paged; a tournament by event) and the wall. Accepting adds a photo to the wall,
// rejecting marks it rejected; removing an uploaded photo from the wall puts it back to pending. New
// photobooth images reach the wall without review. Everything is saved straight away; there is no Save step.
export function useFanWall(eventId?: string) {
  // Gallery (fan uploads)
  const [review, setReview] = useState<ReviewFilter>("PENDING");
  const [page, setPage] = useState(1);
  const [galleryVersion, setGalleryVersion] = useState(0);
  const [gallery, setGallery] = useState<{ key: string; view?: FanWallDraftPage; error?: string } | null>(null);
  // Wall
  const [wall, setWall] = useState<FanWallItem[] | null>(null);
  const [wallError, setWallError] = useState<string | null>(null);
  // Actions in flight, so the wall doesn't take two at once.
  const [busy, setBusy] = useState(false);

  const galleryKey = `${review}|${eventId ?? ""}|${page}|${galleryVersion}`;
  useEffect(() => {
    let cancelled = false;
    request<FanWallDraftPage>(
      "GET",
      `${routes.api.fanWallDrafts}?${query({ status: review, eventId, page, limit: GALLERY_PAGE_SIZE })}`
    ).then((r) => {
      if (!cancelled) setGallery({ key: galleryKey, view: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [galleryKey, review, eventId, page]);
  const reloadGallery = () => setGalleryVersion((v) => v + 1);

  const loadWall = useCallback(() => {
    request<FanWallPage>("GET", `${routes.api.fanWall}?${query({ page: 1, limit: WALL_LIMIT })}`).then((r) => {
      if (r.view) {
        setWall([...r.view.items].sort((a, b) => a.sortOrder - b.sortOrder));
        setWallError(null);
      } else setWallError(r.message ?? "Couldn't load the fan wall.");
    });
  }, []);
  useEffect(loadWall, [loadWall]);

  const items = wall ?? [];

  // Accepts or rejects one uploaded photo. A 409 means it was already reviewed: the list is reloaded.
  const reviewDraft = async (draftId: string, decision: "accept" | "reject") => {
    setBusy(true);
    const endpoint = decision === "accept" ? routes.api.fanWallDraftAccept(draftId) : routes.api.fanWallDraftReject(draftId);
    const r = await request<{ id: string }>("POST", endpoint);
    setBusy(false);
    if (r.status === 200) {
      toast.success(decision === "accept" ? "Added to the fan wall" : "Photo rejected");
      if (decision === "accept") loadWall();
    } else toast.error(r.message ?? (decision === "accept" ? "Couldn't accept the photo." : "Couldn't reject the photo."));
    reloadGallery();
  };

  // Sends the new order; shows it straight away and puts the old one back if the API refuses.
  const saveOrder = async (next: FanWallItem[], previous: FanWallItem[]) => {
    setWall(next);
    const r = await request<FanWallPage>("PATCH", routes.api.fanWallReorder, { orderedItemIds: next.map((i) => i.id) });
    if (r.view) setWall([...r.view.items].sort((a, b) => a.sortOrder - b.sortOrder));
    else {
      setWall(previous);
      toast.error(r.message ?? "Couldn't save the new order.");
    }
  };

  // Moves a wall item to `index`.
  const move = async (itemId: string, index: number) => {
    const from = items.findIndex((i) => i.id === itemId);
    if (from === -1) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(Math.min(index, next.length), 0, moved);
    if (next.every((i, k) => i.id === items[k].id)) return;
    setBusy(true);
    await saveOrder(next, items);
    setBusy(false);
  };

  const remove = async (itemIds: string[]) => {
    if (itemIds.length === 0) return;
    setBusy(true);
    const removed = new Set<string>();
    for (const id of itemIds) {
      const r = await request<null>("DELETE", routes.api.fanWallItem(id));
      // 404: already gone.
      if (r.status === 200 || r.status === 404) removed.add(id);
      else toast.error(r.message ?? "Couldn't remove the image.");
    }
    setWall((prev) => (prev ?? []).filter((i) => !removed.has(i.id)));
    setBusy(false);
    // An uploaded photo taken off the wall is back to pending in the gallery.
    if (items.some((i) => removed.has(i.id) && i.source === "UPLOAD")) reloadGallery();
  };

  const currentGallery = gallery?.key === galleryKey ? gallery : null;

  return {
    // Gallery
    review,
    setReview: (r: ReviewFilter) => {
      setReview(r);
      setPage(1);
    },
    page,
    setPage,
    galleryLoading: !currentGallery,
    gallery: currentGallery?.view ?? null,
    galleryError: currentGallery?.error ?? null,
    accept: (draftId: string) => reviewDraft(draftId, "accept"),
    reject: (draftId: string) => reviewDraft(draftId, "reject"),
    // Wall
    wall: items,
    wallLoading: wall === null && !wallError,
    wallError,
    busy,
    move,
    remove,
  };
}
