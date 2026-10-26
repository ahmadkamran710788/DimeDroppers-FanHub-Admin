"use client";

import { useState, type ReactNode } from "react";
import { CalendarDays, ChevronDown, Eye, Image as ImageIcon, Newspaper, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import Checkbox from "@/components/common/checkbox";
import ConfirmModal from "@/components/common/confirm-modal";
import FilterChipMenu, { FILTER_CHIP } from "@/components/common/filter-chip-menu";
import Loader from "@/components/common/loader";
import Pagination from "@/components/common/pagination";
import SearchInput from "@/components/common/search-input";
import Tabs from "@/components/common/tabs";
import PhotoTemplates from "@/components/organization/recognition/photo-templates";
import PhotoTile from "@/components/organization/recognition/photo-tile";
import RecognitionsTable from "@/components/organization/recognition/recognitions-table";
import { useFanWall, type GalleryStatus } from "@/components/organization/recognition/use-fan-wall";
import { cn } from "@/utils/cn";
import type { PhotoboothJob } from "@/utils/types/fan-wall";

const SECTIONS = [
  { label: "Recognition Posts", icon: <Newspaper className="size-5" strokeWidth={1.5} /> },
  { label: "Fan Wall Photos", icon: <ImageIcon className="size-5" strokeWidth={1.5} /> },
] as const;
export type RecognitionSection = (typeof SECTIONS)[number]["label"];

const TABS = ["All Photos", "Uploaded Photos", "Templates"] as const;
type Tab = (typeof TABS)[number];

// Filters the photobooth API doesn't offer yet; they stay visible and say so.
const UPCOMING_FILTERS = ["All Events", "All Teams", "All Uploaders", "Date Range"];

// Uploading, the fan app preview and the filters above have no API yet.
const comingSoon = () => toast("Coming soon.");

const CARD = "rounded-[10px] border border-white/10 bg-white/[0.04] p-4 lg:p-5 flex flex-col gap-4";

// Drag payload: where the photo came from and its id (a photobooth job id from the gallery, a wall item
// id from the wall).
type DragSource = { from: "grid" | "layout"; id: string } | null;

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

const imageAlt = (fan: string) => `Photobooth image by ${fan}`;

function CardHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
      <div className="flex flex-col gap-1 text-white">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-white/75">{description}</p>
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

export default function RecognitionPage({ initialSection = "Fan Wall Photos" }: { initialSection?: RecognitionSection }) {
  const [section, setSection] = useState<RecognitionSection>(initialSection);
  const [tab, setTab] = useState<Tab>("All Photos");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drag, setDrag] = useState<DragSource>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const fw = useFanWall();

  const jobs = fw.gallery?.items ?? [];
  // Only finished images (with a picture) can go on the wall.
  const addable = (j: PhotoboothJob) => j.status === "COMPLETED" && !!j.resultUrl && !fw.onWall.has(j.id);
  const selectable = jobs.filter(addable);
  const allSelected = selectable.length > 0 && selectable.every((j) => selected.has(j.id));
  const someSelected = selectable.some((j) => selected.has(j.id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(selectable.map((j) => j.id)));

  const addSelected = async () => {
    await fw.add(selectable.filter((j) => selected.has(j.id)).map((j) => j.id));
    setSelected(new Set());
  };

  // A drop on the wall: a gallery image is added there, a wall image moves there.
  const dropAt = (index: number | null) => {
    const source = drag;
    setDrag(null);
    setOverIndex(null);
    if (!source || fw.busy) return;
    if (source.from === "grid") void fw.add([source.id], index ?? undefined);
    else void fw.move(source.id, index ?? fw.wall.length);
  };

  const summary = fw.gallery?.summary;
  const STATUS_OPTIONS: { label: string; value: GalleryStatus; count?: number }[] = [
    { label: "Completed", value: "COMPLETED", count: summary?.completedCount },
    { label: "All statuses", value: "", count: summary?.totalJobs },
    { label: "Queued", value: "QUEUED", count: summary?.queuedCount },
    { label: "Failed", value: "FAILED", count: summary?.failedCount },
  ];
  const statusLabel = (o: (typeof STATUS_OPTIONS)[number]) => (o.count === undefined ? o.label : `${o.label} (${o.count})`);
  const currentStatus = STATUS_OPTIONS.find((o) => o.value === fw.status) ?? STATUS_OPTIONS[0];

  const pagination = fw.gallery?.pagination;
  const showLayout = tab === "All Photos";

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Title, section switch, fan app */}
      <div className="flex flex-col xl:flex-row xl:items-center gap-4 xl:gap-8">
        <div className="flex flex-col gap-1 text-white xl:flex-1">
          <h2 className="text-[28px] lg:text-[32px] font-bold leading-tight">Recognition &amp; Fan Wall</h2>
          <p className="text-base text-white/85">Manage recognition posts and fan photos to celebrate your community.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div role="tablist" aria-label="Recognition sections" className="flex rounded-[8px] border border-white/15 bg-white/[0.04] p-0.5">
            {SECTIONS.map(({ label, icon }) => {
              const active = label === section;
              return (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSection(label)}
                  className={cn(
                    "h-11 px-4 rounded-[6px] flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors",
                    active ? "text-white" : "text-white/85 hover:text-white"
                  )}
                  style={active ? { background: "var(--gradient-cta)" } : undefined}
                >
                  {icon}
                  {label}
                </button>
              );
            })}
          </div>
          <Button
            label="View Fan App"
            icon={<Eye className="size-5" strokeWidth={1.5} />}
            className="shrink-0 h-12 border border-white/15 bg-white/[0.04]"
            onClick={comingSoon}
          />
        </div>
      </div>

      {section === "Recognition Posts" ? (
        <RecognitionsTable />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <Tabs tabs={TABS} active={tab} onChange={setTab} className="flex-1 overflow-x-auto overflow-y-hidden pb-px" />
            <Button
              variant="cta"
              label="Upload Photos"
              icon={<Upload className="size-5" strokeWidth={1.5} />}
              className="self-start sm:self-auto shrink-0 h-11"
              onClick={comingSoon}
            />
          </div>

          {tab === "Templates" ? (
            <div className={CARD}>
              <PhotoTemplates />
            </div>
          ) : tab === "Uploaded Photos" ? (
            <div className={CARD}>
              <p className="py-10 text-center text-sm text-white/60">Photos uploaded by your team are coming soon.</p>
            </div>
          ) : (
            <>
              {/* Search (fan name or email), status, and the filters that are coming */}
              <div className="flex flex-wrap gap-3">
                <SearchInput
                  variant="dark"
                  placeholder="Search by fan name or email..."
                  value={fw.query}
                  onChange={(e) => fw.setQuery(e.target.value)}
                  aria-label="Search photos"
                  className="w-full sm:w-72"
                />
                <FilterChipMenu
                  label={statusLabel(currentStatus)}
                  ariaLabel="Filter by status"
                  items={STATUS_OPTIONS.map((o) => ({ label: statusLabel(o), onSelect: () => fw.setStatus(o.value) }))}
                />
                {UPCOMING_FILTERS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={comingSoon}
                    title="Coming soon"
                    className={cn(FILTER_CHIP, "flex items-center opacity-70")}
                  >
                    {label === "Date Range" && <CalendarDays className="size-5" strokeWidth={1.5} />}
                    {label}
                    <ChevronDown className="size-4" strokeWidth={2} />
                  </button>
                ))}
              </div>

              {/* Photobooth gallery */}
              <section className={CARD}>
                <CardHeader
                  title={`Photobooth Gallery (${pagination?.total ?? 0})`}
                  description="Photos fans made with the photobooth at your games. Drag them onto the Fan Wall, or select them and add."
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={toggleAll}
                        disabled={selectable.length === 0}
                        className="flex items-center gap-2 text-sm text-white disabled:opacity-50"
                        aria-pressed={allSelected}
                      >
                        <Checkbox checked={allSelected} indeterminate={!allSelected && someSelected} variant="white" />
                        Select All
                      </button>
                      <Button
                        label={fw.busy ? "Adding…" : "Add to Fan Wall"}
                        className="h-10 min-w-0 px-4 text-sm border border-white/15 bg-white/[0.06]"
                        disabled={!someSelected || fw.busy}
                        onClick={addSelected}
                      />
                    </>
                  }
                />
                {fw.galleryLoading ? (
                  <Loader />
                ) : fw.galleryError ? (
                  <p className="py-10 text-center text-sm text-error">{fw.galleryError}</p>
                ) : jobs.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {jobs.map((j) =>
                        j.resultUrl ? (
                          <PhotoTile
                            key={j.id}
                            src={j.resultUrl}
                            alt={imageAlt(j.fan.name)}
                            caption={j.fan.name}
                            subcaption={[j.template.name, j.game.title, fmtDate(j.game.utcTime)].filter(Boolean).join(" · ")}
                            added={fw.onWall.has(j.id)}
                            selected={selected.has(j.id)}
                            onToggle={addable(j) ? () => toggle(j.id) : undefined}
                            className="aspect-square"
                            dragProps={
                              addable(j)
                                ? {
                                    draggable: true,
                                    onDragStart: () => setDrag({ from: "grid", id: j.id }),
                                    onDragEnd: () => setDrag(null),
                                  }
                                : undefined
                            }
                          />
                        ) : (
                          // Not finished yet (queued, failed): no picture to show.
                          <div
                            key={j.id}
                            className="aspect-square rounded-[6px] border-2 border-white/15 bg-black/40 flex flex-col items-center justify-center gap-1 p-2 text-center text-white"
                          >
                            <span className="text-xs font-semibold capitalize">{j.status.toLowerCase()}</span>
                            <span className="text-[11px] text-white/60 truncate max-w-full">{j.fan.name}</span>
                          </div>
                        )
                      )}
                    </div>
                    {pagination && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-xs text-white/70">
                          {`Showing ${(pagination.page - 1) * pagination.limit + 1} to ${Math.min(
                            pagination.page * pagination.limit,
                            pagination.total
                          )} of ${pagination.total}`}
                        </span>
                        <Pagination page={pagination.page} pageCount={pagination.totalPages} onChange={fw.setPage} />
                      </div>
                    )}
                  </>
                ) : (
                  <p className="py-10 text-center text-sm text-white/50">
                    {fw.query.trim() ? "No photos match your search." : "No photobooth photos yet."}
                  </p>
                )}
              </section>

              {/* The wall */}
              {showLayout && (
                <section className={CARD}>
                  <CardHeader
                    title={`Fan Wall Layout (${fw.wall.length})`}
                    description="Drag photos to arrange the order they appear on the Fan Wall. Changes are saved as you make them."
                    actions={
                      <>
                        <Button
                          label="Preview on Fan App"
                          icon={<Eye className="size-4" strokeWidth={1.5} />}
                          className="h-10 min-w-0 px-4 text-sm border border-white/15 bg-white/[0.06]"
                          onClick={comingSoon}
                        />
                        <Button
                          label="Clear All"
                          icon={<Trash2 className="size-4" strokeWidth={1.5} />}
                          className="h-10 min-w-0 px-4 text-sm border border-white/15 bg-white/[0.06]"
                          disabled={fw.wall.length === 0 || fw.busy}
                          onClick={() => setConfirmClear(true)}
                        />
                      </>
                    }
                  />
                  <div
                    className={cn(
                      "min-h-32 rounded-[8px] border border-dashed p-2 flex gap-2 overflow-x-auto transition-colors",
                      drag ? "border-white/40 bg-white/[0.04]" : "border-white/10",
                      fw.busy && "opacity-70"
                    )}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => dropAt(overIndex)}
                  >
                    {fw.wallLoading ? (
                      <Loader className="m-auto" />
                    ) : fw.wallError ? (
                      <p className="m-auto text-sm text-error">{fw.wallError}</p>
                    ) : (
                      <>
                        {fw.wall.map((item, i) =>
                          item.photoboothJob.resultUrl ? (
                            <PhotoTile
                              key={item.id}
                              src={item.photoboothJob.resultUrl}
                              alt={imageAlt(item.photoboothJob.fan.name)}
                              caption={item.photoboothJob.fan.name}
                              onRemove={fw.busy ? undefined : () => void fw.remove([item.id])}
                              dropTarget={drag !== null && overIndex === i}
                              className="w-32 h-28 shrink-0"
                              dragProps={{
                                draggable: !fw.busy,
                                onDragStart: () => setDrag({ from: "layout", id: item.id }),
                                onDragEnd: () => {
                                  setDrag(null);
                                  setOverIndex(null);
                                },
                                onDragOver: (e) => {
                                  e.preventDefault();
                                  setOverIndex(i);
                                },
                              }}
                            />
                          ) : null
                        )}
                        {fw.wall.length === 0 && (
                          <p className="m-auto text-sm text-white/50">Drag photos here, or select them and press Add to Fan Wall.</p>
                        )}
                      </>
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear the fan wall?"
        message={`All ${fw.wall.length} photos will be removed from the Fan Wall. They stay in the gallery, so you can add them again.`}
        confirmLabel="Clear All"
        busyLabel="Clearing…"
        destructive
        onConfirm={async () => {
          await fw.remove(fw.wall.map((i) => i.id));
          return true;
        }}
      />
    </div>
  );
}
