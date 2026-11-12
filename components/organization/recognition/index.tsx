"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Eye, Image as ImageIcon, Newspaper, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import Loader from "@/components/common/loader";
import Pagination from "@/components/common/pagination";
import PhotoPreview, { type PhotoPreviewItem } from "@/components/organization/recognition/photo-preview";
import PhotoTile from "@/components/organization/recognition/photo-tile";
import RecognitionPosts from "@/components/organization/recognition/recognition-posts";
import EventSelect from "@/components/organization/event-select";
import { useFanWall, wallImageOf } from "@/components/organization/recognition/use-fan-wall";
import { orgKindOf, useAuth } from "@/context/auth";
import { useSelectedEvent } from "@/context/selected-event";
import { cn } from "@/utils/cn";
import { registerPhotoboothImageCache } from "@/utils/photobooth-image-cache";

const SECTIONS = [
  { label: "Recognition Posts", icon: <Newspaper className="size-5" strokeWidth={1.5} /> },
  { label: "Fan Wall Photos", icon: <ImageIcon className="size-5" strokeWidth={1.5} /> },
] as const;
export type RecognitionSection = (typeof SECTIONS)[number]["label"];

// Uploading and the fan app preview have no API yet.
const comingSoon = () => toast("Coming soon.");

const CARD = "rounded-[10px] border border-white/10 bg-white/[0.04] p-4 lg:p-5 flex flex-col gap-4";

// Drag payload: where the photo came from and its id (a photobooth job id from the gallery, a wall item
// id from the wall).

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

const imageAlt = (fan: string) => `Fan photo by ${fan}`;

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
  // A wall photo being dragged to a new place in the wall.
  const [drag, setDrag] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  // The photo shown at full size, from a click on a gallery or wall tile.
  const [preview, setPreview] = useState<PhotoPreviewItem | null>(null);
  const { org } = useAuth();
  const isTournament = orgKindOf(org) === "tournament";
  // A tournament reviews one event's uploads at a time (the shared event picker).
  const { event, setEvent } = useSelectedEvent();
  const fw = useFanWall(isTournament ? event?.id : undefined);

  // Each fan image is downloaded once per browser instead of on every load (see utils/photobooth-image-cache).
  useEffect(registerPhotoboothImageCache, []);

  const drafts = fw.gallery?.items ?? [];

  // A drop on the wall moves the dragged wall photo there.
  const dropAt = (index: number | null) => {
    const id = drag;
    setDrag(null);
    setOverIndex(null);
    if (!id || fw.busy) return;
    void fw.move(id, index ?? fw.wall.length);
  };

  const pagination = fw.gallery?.pagination;

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
        <RecognitionPosts />
      ) : (
        <>
          {/* A tournament reviews one event's uploads at a time; Upload on the right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {isTournament ? (
              <EventSelect
                value={event?.id ?? ""}
                onChange={(id, name) => setEvent(id ? { id, name } : null)}
                allowAll={false}
                selectedName={event?.name}
              />
            ) : (
              <span />
            )}
            <Button
              variant="cta"
              label="Upload Photos"
              icon={<Upload className="size-5" strokeWidth={1.5} />}
              className="self-start sm:self-auto shrink-0 h-11"
              onClick={comingSoon}
            />
          </div>

          {/* Fan uploads: photos fans upload from the app, to accept or reject */}
          <section className={CARD}>
            <CardHeader
              title={`Fan Uploads (${pagination?.total ?? 0})`}
              description="Photos fans uploaded from the app. Accept a photo to add it to the Fan Wall. New photobooth photos go to the Fan Wall on their own."
            />
            {isTournament && !event ? (
              <p className="py-10 text-center text-sm text-white/60">Pick an event to see its fan uploads.</p>
            ) : fw.galleryLoading ? (
              <Loader />
            ) : fw.galleryError ? (
              <p className="py-10 text-center text-sm text-error">{fw.galleryError}</p>
            ) : drafts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 min-[1800px]:grid-cols-6 gap-3">
                  {drafts.map((d) => {
                    const fan = d.fan?.name ?? "A fan";
                    const subcaption = fmtDate(d.createdAt) ?? undefined;
                    const pending = d.status === "PENDING" && !fw.busy;
                    return (
                      <PhotoTile
                        key={d.id}
                        src={d.imageUrl}
                        alt={imageAlt(fan)}
                        caption={fan}
                        subcaption={subcaption}
                        added={d.status === "ACCEPTED"}
                        onAccept={pending ? () => void fw.accept(d.id) : undefined}
                        rejected={d.status === "REJECTED"}
                        onReject={pending ? () => void fw.reject(d.id) : undefined}
                        onOpen={() => setPreview({ src: d.imageUrl, alt: imageAlt(fan), caption: fan, subcaption })}
                        className="aspect-square"
                      />
                    );
                  })}
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
                No fan uploads waiting for review.
              </p>
            )}
          </section>

          {/* The wall */}
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
                  {fw.wall.map((item, i) => {
                    const { src, fan } = wallImageOf(item);
                    return src ? (
                      <PhotoTile
                        key={item.id}
                        src={src}
                        alt={imageAlt(fan)}
                        caption={fan}
                        onRemove={fw.busy ? undefined : () => void fw.remove([item.id])}
                        onOpen={() => setPreview({ src, alt: imageAlt(fan), caption: fan })}
                        dropTarget={drag !== null && overIndex === i}
                        className="w-32 h-28 shrink-0"
                        dragProps={{
                          draggable: !fw.busy,
                          onDragStart: () => setDrag(item.id),
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
                    ) : null;
                  })}
                  {fw.wall.length === 0 && (
                    <p className="m-auto text-sm text-white/50">Accept fan uploads to add them here; new photobooth photos appear on their own.</p>
                  )}
                </>
              )}
            </div>
          </section>
        </>
      )}

      <ConfirmModal
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear the fan wall?"
        message={`All ${fw.wall.length} photos will be removed from the Fan Wall. Fan uploads go back to Pending, so you can accept them again.`}
        confirmLabel="Clear All"
        busyLabel="Clearing…"
        destructive
        onConfirm={async () => {
          await fw.remove(fw.wall.map((i) => i.id));
          return true;
        }}
      />

      <PhotoPreview photo={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
