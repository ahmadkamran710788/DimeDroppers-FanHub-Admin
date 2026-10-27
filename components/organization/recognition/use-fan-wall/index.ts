"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { backendFetch } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { FanWallItem, FanWallPage, PhotoboothGallery } from "@/utils/types/fan-wall";

// Gallery images per page.
export const GALLERY_PAGE_SIZE = 24;
// The wall is loaded whole (the API caps a page, and a reorder answers, at 100).
const WALL_LIMIT = 100;
const SEARCH_DELAY_MS = 300;

interface Result<T> {
  status: number;
  view?: T;
  message?: string;
}

// backendFetch (not apiCall) so the backend's own message (e.g. 409 "already on the fan wall") reaches
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

// Gallery status filter: a job status, or "" for every status.
export type GalleryStatus = "COMPLETED" | "FAILED" | "QUEUED" | "";

// State and actions for Fan Wall Photos: the photobooth gallery (searchable, by status, paged) and the
// wall built from it. Every add, remove and reorder is saved straight away; there is no Save step.
export function useFanWall() {
  // Gallery
  const [query_, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<GalleryStatus>("COMPLETED");
  const [page, setPage] = useState(1);
  const [gallery, setGallery] = useState<{ key: string; view?: PhotoboothGallery; error?: string } | null>(null);
  // Wall
  const [wall, setWall] = useState<FanWallItem[] | null>(null);
  const [wallError, setWallError] = useState<string | null>(null);
  // Actions in flight, so the wall doesn't take two at once.
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(query_.trim());
      setPage(1);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [query_]);

  const galleryKey = `${status}|${search}|${page}`;
  useEffect(() => {
    let cancelled = false;
    request<PhotoboothGallery>(
      "GET",
      `${routes.api.photoboothJobs}?${query({ page, limit: GALLERY_PAGE_SIZE, status, search })}`
    ).then((r) => {
      if (!cancelled) setGallery({ key: galleryKey, view: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [galleryKey, page, status, search]);

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
  // Images already on the wall, by photobooth job id.
  const onWall = new Set(items.map((i) => i.photoboothJob.id));

  // Adds images to the end of the wall, one request each (the API takes one at a time), then puts them
  // at `index` when the drop landed inside the wall.
  const add = async (jobIds: string[], index?: number) => {
    const fresh = jobIds.filter((id) => !onWall.has(id));
    if (fresh.length === 0) {
      toast("This image is already on the fan wall.");
      return;
    }
    setBusy(true);
    const added: FanWallItem[] = [];
    for (const photoboothJobId of fresh) {
      const r = await request<FanWallItem>("POST", routes.api.fanWallItems, { photoboothJobId });
      if (r.view) added.push(r.view);
      else toast.error(r.status === 409 ? "This image is already on the fan wall." : (r.message ?? "Couldn't add the image."));
    }
    let next = [...items, ...added];
    setWall(next);
    if (added.length && index !== undefined && index < items.length) {
      // Move the new ones from the end to where they were dropped.
      next = [...items.slice(0, index), ...added, ...items.slice(index)];
      await saveOrder(next, [...items, ...added]);
    }
    setBusy(false);
    if (added.length) toast.success(added.length === 1 ? "Added to the fan wall" : `Added ${added.length} images to the fan wall`);
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
  };

  const currentGallery = gallery?.key === galleryKey ? gallery : null;

  return {
    // Gallery
    query: query_,
    setQuery,
    status,
    setStatus: (s: GalleryStatus) => {
      setStatus(s);
      setPage(1);
    },
    page,
    setPage,
    galleryLoading: !currentGallery,
    gallery: currentGallery?.view ?? null,
    galleryError: currentGallery?.error ?? null,
    // Wall
    wall: items,
    wallLoading: wall === null && !wallError,
    wallError,
    onWall,
    busy,
    add,
    move,
    remove,
  };
}
