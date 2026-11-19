"use client";

import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import Checkbox from "@/components/common/checkbox";
import Modal from "@/components/common/modal";
import RangeSlider from "@/components/common/range-slider";
import type { BrandLogos, LogoFitting } from "@/components/sponsor/use-brand-logos";
import FramedLogo from "@/components/sponsor/logo-fit/framed-logo";
import SlotPreviews from "@/components/sponsor/logo-fit/slot-previews";
import {
  FRAME_BACKGROUND,
  ICON_BACKGROUNDS,
  ICON_BACKGROUND_OPTIONS,
  MAX_ZOOM,
  MIN_ZOOM,
  type IconBackground,
} from "@/components/sponsor/logo-fit/data";
import {
  ICON_SAFE_ZONE,
  clampView,
  looksBlurry,
  presetView,
  renderFittedLogo,
  scaleView,
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

// The logo in a frame the shape of its slot in the app: drag it, zoom it (or stretch it with "Keep proportions"
// off), see it at app size, and save the frame as the file that's uploaded.
function LogoFitEditor({ fitting, onDone }: LogoFitEditorProps) {
  const { image, spec, file, maxBytes } = fitting;
  const frame = spec.recommended;
  const icon = spec.variant === "ICON";
  // 100% on the sliders: the logo (margins left out) just fitting the frame, or the icon's safe zone.
  const fitView = useMemo(() => presetView(image, frame, "fit", icon ? ICON_SAFE_ZONE : 1), [image, frame, icon]);
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
  const fromPercent = (value: number) => (value / 100) * base;
  // Room for Fill when it's beyond MAX_ZOOM (a wide logo in the square icon).
  const maxZoom = Math.max(MAX_ZOOM, Math.ceil(percent(fillView.sx) / 50) * 50);
  const frameBackground = icon ? ICON_BACKGROUNDS[iconBackground].className : FRAME_BACKGROUND[spec.variant];

  const scaleTo = (sx: number, sy: number) => setView((v) => clampView(scaleView(v, sx, sy), image, frame));

  function toggleShape() {
    // Back on: the height follows the width, so the logo has its own proportions again.
    if (!keepShape) scaleTo(view.sx, view.sx);
    setKeepShape(!keepShape);
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
    const background = icon ? ICON_BACKGROUNDS[iconBackground].color : null;
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
          The box is the shape of your logo&apos;s space in the app. Drag the logo to move it and use the slider to
          resize it. Fans see exactly what&apos;s inside the box.
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
            <FramedLogo image={image} frame={frame} view={view} className={cn("w-full rounded-[4px]", frameBackground)}>
              {icon && (
                <div
                  aria-hidden="true"
                  className="absolute inset-[10%] rounded-full border border-dashed border-[#8b6dff]/70 pointer-events-none"
                />
              )}
            </FramedLogo>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {keepShape ? (
            <RangeSlider
              label="Zoom"
              value={percent(view.sx)}
              min={MIN_ZOOM}
              max={maxZoom}
              onChange={(value) => scaleTo(fromPercent(value), fromPercent(value))}
              valueText={`${percent(view.sx)}%`}
              labelClassName="text-midnight-navy"
            />
          ) : (
            <>
              <RangeSlider
                label="Width"
                value={percent(view.sx)}
                min={MIN_ZOOM}
                max={maxZoom}
                onChange={(value) => scaleTo(fromPercent(value), view.sy)}
                valueText={`${percent(view.sx)}%`}
                labelClassName="text-midnight-navy"
              />
              <RangeSlider
                label="Height"
                value={percent(view.sy)}
                min={MIN_ZOOM}
                max={maxZoom}
                onChange={(value) => scaleTo(view.sx, fromPercent(value))}
                valueText={`${percent(view.sy)}%`}
                labelClassName="text-midnight-navy"
              />
            </>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button
              variant="text"
              size="sm"
              label="Keep proportions"
              role="checkbox"
              aria-checked={keepShape}
              icon={<Checkbox checked={keepShape} variant="violet" className="size-5" />}
              onClick={toggleShape}
              className="text-sm text-midnight-navy hover:text-midnight-navy"
            />
            <div className="flex gap-2 ml-auto">
              <Button size="sm" variant="secondary" label="Fit" onClick={() => setView(fitView)} />
              <Button size="sm" variant="secondary" label="Fill" onClick={() => setView(fillView)} />
            </div>
          </div>

          {icon && (
            <div role="radiogroup" aria-label="Icon background" className="flex flex-wrap items-center gap-2">
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

        <SlotPreviews image={image} spec={spec} view={view} iconBackground={ICON_BACKGROUNDS[iconBackground].className} />

        <div className="flex gap-3">
          <Button label="Cancel" variant="secondary" onClick={cancel} disabled={saving} fullWidth />
          <Button label={saving ? "Saving…" : "Save logo"} variant="cta" onClick={save} disabled={saving} fullWidth />
        </div>
      </div>
    </Modal>
  );
}
