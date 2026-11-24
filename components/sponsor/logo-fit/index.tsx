"use client";

import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import toast from "react-hot-toast";
import { Lock, LockOpen, Scan } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import Modal from "@/components/common/modal";
import RangeSlider from "@/components/common/range-slider";
import { isSquareLogo } from "@/components/sponsor/data";
import type { BrandLogos, LogoFitting } from "@/components/sponsor/use-brand-logos";
import FramedLogo from "@/components/sponsor/logo-fit/framed-logo";
import SlotPreviews from "@/components/sponsor/logo-fit/slot-previews";
import StandardSize from "@/components/sponsor/logo-fit/standard-size";
import {
  FRAME_BACKGROUND,
  ICON_BACKGROUNDS,
  ICON_BACKGROUND_OPTIONS,
  MAX_ZOOM,
  MIN_ZOOM,
  SNAP_RANGE,
  type IconBackground,
} from "@/components/sponsor/logo-fit/data";
import {
  ICON_SAFE_ZONE,
  clampView,
  looksBlurry,
  presetView,
  renderFittedLogo,
  scaleView,
  standardCheck,
  type LogoView,
} from "@/components/sponsor/logo-fit/render";

// Arrow keys move the logo by this share of the frame (Shift: SHIFT_STEP).
const STEP = 0.01;
const SHIFT_STEP = 0.05;
const MOVES: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

interface LogoFitModalProps {
  logos: BrandLogos;
}

// The fit editor for the logo being uploaded or replaced: useBrandLogos opens it and uploads what it saves.
// Rendered once on each page that uses the logos.
export default function LogoFitModal({ logos }: LogoFitModalProps) {
  const { fitting } = logos;
  if (!fitting) return null;
  // Keyed per file, so each one starts from its own fit.
  return <LogoFitEditor key={fitting.id} fitting={fitting} onDone={logos.finishFit} />;
}

interface LogoFitEditorProps {
  fitting: LogoFitting;
  // The fitted file to upload, or null when the sponsor cancels.
  onDone: (file: File | null) => void;
}

// The logo in a frame the size of the standard logo (the logo sizes doc's, from GET /brand-assets/options), shaped
// like its slot in the app: drag it, resize it with Width and Height (locked together, or one at a time to stretch
// it), and see it at app size. The standard size is shown as a guide; any size can be saved. The frame is the file.
function LogoFitEditor({ fitting, onDone }: LogoFitEditorProps) {
  const { image, spec, file, maxBytes } = fitting;
  const frame = spec.recommended;
  // The icon and the circular logo: a square frame with a safe zone and a background of the sponsor's pick.
  const icon = isSquareLogo(spec.variant);
  // Shown in a circle in the app: the frame's corners are cut off.
  const round = spec.variant === "CIRCULAR";
  // The share of the frame the logo fills at the standard size: all of it, or the safe zone.
  const inset = icon ? ICON_SAFE_ZONE : 1;
  // The standard size, and 100% on the sliders: the logo (margins left out) just fitting that box, centred.
  const fitView = useMemo(() => presetView(image, frame, "fit", inset), [image, frame, inset]);
  const fillView = useMemo(() => presetView(image, frame, "fill"), [image, frame]);
  const base = fitView.sx;

  const [view, setView] = useState<LogoView>(fitView);
  const [keepShape, setKeepShape] = useState(true);
  const [iconBackground, setIconBackground] = useState<IconBackground>("White");
  const [saving, setSaving] = useState(false);
  // The drag in progress: where it started and the frame's size on screen then.
  const drag = useRef<{ pointerId: number; x: number; y: number; view: LogoView; width: number; height: number } | null>(
    null
  );

  const percent = (scale: number) => Math.round((scale / base) * 100);
  // A slider value as a scale; close to 100% snaps to it, the standard size.
  const fromPercent = (value: number) => ((Math.abs(value - 100) <= SNAP_RANGE ? 100 : value) / 100) * base;
  // Room for Fill when it's beyond MAX_ZOOM (a wide logo in the square icon).
  const maxZoom = Math.max(MAX_ZOOM, Math.ceil(percent(Math.max(fillView.sx, view.sx, view.sy)) / 50) * 50);
  const frameBackground = icon ? ICON_BACKGROUNDS[iconBackground].className : FRAME_BACKGROUND[spec.variant];
  // A landscape logo on a flat colour keeps it around the logo, so the backend can still remove it when it makes the
  // white logo and icon. A white logo stays transparent; the icon and circular logo have their own background.
  const fill = spec.variant === "FULL_COLOR" ? image.background : null;
  const standard = standardCheck(image, frame, view, inset);

  const scaleTo = (sx: number, sy: number) => setView((v) => clampView(scaleView(v, sx, sy), image, frame));

  // One slider moved: with "Keep proportions" on, the other follows so the shape stays as it is now (even after a
  // stretch); off, only that side changes.
  function setWidth(value: number) {
    const sx = fromPercent(value);
    scaleTo(sx, keepShape ? (view.sy * sx) / view.sx : view.sy);
  }

  function setHeight(value: number) {
    const sy = fromPercent(value);
    scaleTo(keepShape ? (view.sx * sy) / view.sy : view.sx, sy);
  }

  function startDrag(e: PointerEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, view, width: box.width, height: box.height };
  }

  function moveDrag(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const moved = { ...d.view, x: d.view.x + (e.clientX - d.x) / d.width, y: d.view.y + (e.clientY - d.y) / d.height };
    setView(clampView(moved, image, frame));
  }

  function nudge(e: KeyboardEvent<HTMLDivElement>) {
    const move = MOVES[e.key];
    if (!move) return;
    e.preventDefault();
    const step = e.shiftKey ? SHIFT_STEP : STEP;
    setView((v) => clampView({ ...v, x: v.x + move[0] * step, y: v.y + move[1] * step }, image, frame));
  }

  async function save() {
    setSaving(true);
    const background = icon ? ICON_BACKGROUNDS[iconBackground].color : fill;
    const fitted = await renderFittedLogo(image, file.name, spec, view, background, maxBytes);
    if (!fitted) {
      setSaving(false);
      toast.error("Couldn't prepare this logo. Try it as a PNG.");
      return;
    }
    onDone(fitted);
  }

  const cancel = () => {
    if (!saving) onDone(null);
  };

  return (
    <Modal
      isOpen
      onClose={cancel}
      title={`Fit your ${spec.label.toLowerCase()}`}
      className="max-w-[min(640px,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto"
    >
      <div className="w-full flex flex-col gap-5">
        <p className="text-sm leading-6 text-midnight-navy/80">
          {/* One string: the compiler drops a space between {…} and text that wraps to the next line. */}
          {`The box is your logo's space in the app, at the standard size of ${frame.width} × ${frame.height} px. ${
            round
              ? "Fans see it in a circle, so the corners are cut off. Keep the important part inside the dashed circle. "
              : icon
                ? "Keep the important part inside the dashed square in the middle. "
                : ""
          }Drag the logo to move it, and use Width and Height to resize it. Turn off Keep proportions to stretch it one way only. ${
            round ? "The file is saved square, as the app expects." : "Fans see exactly what's inside the box."
          }`}
        </p>

        <div className="rounded-[16px] bg-[#08090c] p-4 sm:p-6 flex justify-center">
          <div
            tabIndex={0}
            role="group"
            aria-label={`${spec.label} in its frame. Drag it, or use the arrow keys, to move it.`}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            onKeyDown={nudge}
            className={cn(
              "w-full rounded-[4px] touch-none cursor-grab active:cursor-grabbing outline-none focus-visible:ring-2 focus-visible:ring-[#8b6dff]",
              icon && "max-w-[280px]"
            )}
          >
            <FramedLogo
              image={image}
              frame={frame}
              view={view}
              fill={fill}
              className={cn("w-full rounded-[4px]", frameBackground)}
            >
              {/* The circle the app cuts it to, with the corners dimmed (the shadow fills the frame outside it). */}
              {round && (
                <div aria-hidden="true" className="absolute inset-0 rounded-full shadow-[0_0_0_999px_rgba(8,9,12,0.6)] pointer-events-none" />
              )}
              {/* The safe zone: where the important part goes. */}
              {icon && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-[10%] border border-dashed border-[#8b6dff] pointer-events-none",
                    round && "rounded-full"
                  )}
                />
              )}
            </FramedLogo>
          </div>
        </div>

        <StandardSize canvas={frame} target={standard.target} size={standard.size} matched={standard.matched} />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <RangeSlider
              label="Width"
              value={percent(view.sx)}
              min={MIN_ZOOM}
              max={maxZoom}
              onChange={setWidth}
              valueText={`${percent(view.sx)}%`}
              labelClassName="text-midnight-navy"
            />
            {/* The lock between the two sliders: on, they move together; off, each stretches one way only. */}
            <Button
              variant="text"
              size="sm"
              label="Keep proportions"
              role="checkbox"
              aria-checked={keepShape}
              icon={keepShape ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
              onClick={() => setKeepShape(!keepShape)}
              className={cn(
                "self-start text-sm hover:text-midnight-navy",
                keepShape ? "text-[#6a4be6] font-semibold" : "text-midnight-navy/70"
              )}
            />
            <RangeSlider
              label="Height"
              value={percent(view.sy)}
              min={MIN_ZOOM}
              max={maxZoom}
              onChange={setHeight}
              valueText={`${percent(view.sy)}%`}
              labelClassName="text-midnight-navy"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              label="Snap to standard size"
              icon={<Scan className="size-4" />}
              onClick={() => setView(fitView)}
            />
            <Button size="sm" variant="secondary" label="Fill the box" onClick={() => setView(fillView)} />
          </div>

          {icon && (
            <div role="radiogroup" aria-label={`${spec.label} background`} className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-midnight-navy mr-1">Background</span>
              {ICON_BACKGROUND_OPTIONS.map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant="secondary"
                  role="radio"
                  aria-checked={iconBackground === option}
                  label={option}
                  icon={<span className={cn("size-3 rounded-full border border-black/20", ICON_BACKGROUNDS[option].className)} />}
                  onClick={() => setIconBackground(option)}
                  className={cn(iconBackground === option && "border-[#6a4be6] ring-1 ring-[#6a4be6]")}
                />
              ))}
            </div>
          )}

          {looksBlurry(image, spec, view) && (
            <p role="status" className="text-[13px] leading-normal text-[#b45309]">
              This file is small for this size, so it may look a little blurry. A bigger file or an SVG stays sharp.
            </p>
          )}
        </div>

        <SlotPreviews
          image={image}
          spec={spec}
          view={view}
          fill={fill}
          iconBackground={ICON_BACKGROUNDS[iconBackground].className}
        />

        <div className="flex gap-3">
          <Button label="Cancel" variant="secondary" onClick={cancel} disabled={saving} fullWidth />
          <Button label={saving ? "Saving…" : "Save logo"} variant="cta" onClick={save} disabled={saving} fullWidth />
        </div>
      </div>
    </Modal>
  );
}
