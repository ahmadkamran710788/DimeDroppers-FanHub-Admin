"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, Check, ChevronDown, Eye, Image as ImageIcon, Newspaper, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import Checkbox from "@/components/common/checkbox";
import RowActionsMenu from "@/components/common/row-actions-menu";
import SearchInput from "@/components/common/search-input";
import Tabs from "@/components/common/tabs";
import WizardFooter from "@/components/common/wizard-footer";
import { SAMPLE_LAYOUT, SAMPLE_PHOTOS, SAMPLE_PHOTO_TOTAL, type FanPhoto } from "@/components/recognition/data";
import PhotoTile from "@/components/recognition/photo-tile";
import RecognitionsTable from "@/components/recognition/recognitions-table";
import { cn } from "@/utils/cn";

const SECTIONS = [
  { label: "Recognition Posts", icon: <Newspaper className="size-5" strokeWidth={1.5} /> },
  { label: "Fan Wall Photos", icon: <ImageIcon className="size-5" strokeWidth={1.5} /> },
] as const;
export type RecognitionSection = (typeof SECTIONS)[number]["label"];

const TABS = ["All Photos", "Uploaded Photos", "Fan Wall Layout", "Settings"] as const;
type Tab = (typeof TABS)[number];

type FilterKey = "event" | "team" | "uploader";
const FILTERS: { key: FilterKey; all: string }[] = [
  { key: "event", all: "All Events" },
  { key: "team", all: "All Teams" },
  { key: "uploader", all: "All Uploaders" },
];

// Uploading, the fan app and saving need the fan wall API, which doesn't exist yet.
const comingSoon = () => toast("Coming soon.");

const CARD = "rounded-[10px] border border-white/10 bg-white/[0.04] p-4 lg:p-5 flex flex-col gap-4";
const FILTER_CHIP =
  "size-auto h-12 px-3.5 gap-2 rounded-[8px] outline-0 border border-white/15 bg-white/[0.06] hover:bg-white/10 text-sm text-white whitespace-nowrap";

// Drag payload: where the photo came from and its id.
type DragSource = { from: "grid" | "layout"; id: string } | null;

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
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Partial<Record<FilterKey, string>>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [layout, setLayout] = useState<string[]>(SAMPLE_LAYOUT);
  const [drag, setDrag] = useState<DragSource>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const byId = useMemo(() => new Map(SAMPLE_PHOTOS.map((p) => [p.id, p])), []);
  const photos = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SAMPLE_PHOTOS.filter(
      (p) =>
        FILTERS.every(({ key }) => !filters[key] || p[key] === filters[key]) &&
        (!q || [p.event, p.team, p.uploader].some((v) => v.toLowerCase().includes(q)))
    );
  }, [query, filters]);

  const options = (key: FilterKey) => [...new Set(SAMPLE_PHOTOS.map((p) => p[key]))].sort();
  const allSelected = photos.length > 0 && photos.every((p) => selected.has(p.id));
  const someSelected = photos.some((p) => selected.has(p.id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(photos.map((p) => p.id)));

  const addToWall = () => {
    const added = photos.filter((p) => selected.has(p.id) && !layout.includes(p.id)).map((p) => p.id);
    setLayout((prev) => [...prev, ...added]);
    setSelected(new Set());
    toast.success(added.length ? `Added ${added.length} photo${added.length > 1 ? "s" : ""} to the fan wall` : "Already on the fan wall");
  };

  // Drop a dragged photo at `index` in the layout (or at the end when index is null).
  const dropAt = (index: number | null) => {
    if (!drag) return;
    setLayout((prev) => {
      const next = prev.filter((id) => id !== drag.id);
      const at = index === null ? next.length : Math.min(index, next.length);
      next.splice(at, 0, drag.id);
      return next;
    });
    setDrag(null);
    setOverIndex(null);
  };

  const layoutPhotos = layout.map((id) => byId.get(id)).filter((p): p is FanPhoto => !!p);
  const showGrid = tab === "All Photos" || tab === "Uploaded Photos";
  const showLayout = tab === "All Photos" || tab === "Fan Wall Layout";

  return (
    <div className="flex flex-col gap-6 pb-24">
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

          {tab === "Settings" ? (
            <div className={cn(CARD, "py-16 items-center text-center")}>
              <p className="text-sm text-white/60">Fan wall settings are coming soon.</p>
            </div>
          ) : (
            <>
              {/* Search + filters */}
              <div className="flex flex-wrap gap-3">
                <SearchInput
                  variant="dark"
                  placeholder="Search photos..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search photos"
                  className="w-full sm:w-60"
                />
                {FILTERS.map(({ key, all }) => (
                  <RowActionsMenu
                    key={key}
                    ariaLabel={`Filter by ${all.replace("All ", "").toLowerCase()}`}
                    className={FILTER_CHIP}
                    trigger={
                      <>
                        {filters[key] ?? all}
                        <ChevronDown className="size-4" strokeWidth={2} />
                      </>
                    }
                    items={[
                      { label: all, onSelect: () => setFilters((f) => ({ ...f, [key]: undefined })) },
                      ...options(key).map((v) => ({ label: v, onSelect: () => setFilters((f) => ({ ...f, [key]: v })) })),
                    ]}
                  />
                ))}
                <button type="button" onClick={comingSoon} className={cn(FILTER_CHIP, "flex items-center")}>
                  <CalendarDays className="size-5" strokeWidth={1.5} />
                  Date Range
                  <ChevronDown className="size-4" strokeWidth={2} />
                </button>
              </div>

              {showGrid && (
                <section className={CARD}>
                  <CardHeader
                    title={`Uploaded Photos (${SAMPLE_PHOTO_TOTAL})`}
                    description="Photos captured by fans using the mobile app. Drag and drop to add them to the Fan Wall."
                    actions={
                      <>
                        <button
                          type="button"
                          onClick={toggleAll}
                          className="flex items-center gap-2 text-sm text-white"
                          aria-pressed={allSelected}
                        >
                          <Checkbox checked={allSelected} indeterminate={!allSelected && someSelected} variant="white" />
                          Select All
                        </button>
                        <Button
                          label="Add to Fan Wall"
                          className="h-10 min-w-0 px-4 text-sm border border-white/15 bg-white/[0.06]"
                          disabled={!someSelected}
                          onClick={addToWall}
                        />
                      </>
                    }
                  />
                  {photos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {photos.map((p) => (
                        <PhotoTile
                          key={p.id}
                          src={p.src}
                          alt={`Fan photo by ${p.uploader}`}
                          selected={selected.has(p.id)}
                          onToggle={() => toggle(p.id)}
                          className="aspect-square"
                          dragProps={{
                            draggable: true,
                            onDragStart: () => setDrag({ from: "grid", id: p.id }),
                            onDragEnd: () => setDrag(null),
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="py-10 text-center text-sm text-white/50">No photos match these filters.</p>
                  )}
                </section>
              )}

              {showLayout && (
                <section className={CARD}>
                  <CardHeader
                    title="Fan Wall Layout"
                    description="Drag and drop photos to arrange the order in which they will appear on the Fan Wall."
                    actions={
                      <Button
                        label="Clear All"
                        icon={<Trash2 className="size-4" strokeWidth={1.5} />}
                        className="h-10 min-w-0 px-4 text-sm border border-white/15 bg-white/[0.06]"
                        disabled={layout.length === 0}
                        onClick={() => setLayout([])}
                      />
                    }
                  />
                  <div
                    className={cn(
                      "min-h-32 rounded-[8px] border border-dashed p-2 flex gap-2 overflow-x-auto transition-colors",
                      drag ? "border-white/40 bg-white/[0.04]" : "border-white/10"
                    )}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => dropAt(overIndex)}
                  >
                    {layoutPhotos.map((p, i) => (
                      <PhotoTile
                        key={p.id}
                        src={p.src}
                        alt={`Fan photo by ${p.uploader}`}
                        onRemove={() => setLayout((prev) => prev.filter((id) => id !== p.id))}
                        dropTarget={drag !== null && overIndex === i}
                        className="w-32 h-28 shrink-0"
                        dragProps={{
                          draggable: true,
                          onDragStart: () => setDrag({ from: "layout", id: p.id }),
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
                    ))}
                    {layoutPhotos.length === 0 && (
                      <p className="m-auto text-sm text-white/50">Drag photos here, or select them and press Add to Fan Wall.</p>
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}

      {section === "Fan Wall Photos" && (
        <WizardFooter
          onBack={() => {
            setLayout(SAMPLE_LAYOUT);
            setSelected(new Set());
          }}
          backLabel="Cancel"
          secondaryLabel="Preview on Fan App"
          secondaryIcon={<Eye className="size-5" strokeWidth={1.5} />}
          onSecondary={comingSoon}
          primaryLabel="Save Fan Wall"
          primaryIcon={<Check className="size-5" strokeWidth={2} />}
          onPrimary={() => toast("Saving the fan wall is coming soon.")}
        />
      )}
    </div>
  );
}
