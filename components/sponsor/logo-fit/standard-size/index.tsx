import { Check } from "lucide-react";
import type { Size } from "@/components/sponsor/logo-fit/render";

interface StandardSizeProps {
  // The saved file's size (the logo sizes doc's standard, e.g. 1000×200).
  canvas: Size;
  // The box the logo fills at the standard size: the canvas, or the icon's central 80%.
  target: Size;
  // The logo's size now, in the saved file's pixels.
  size: Size;
  // The logo is at the standard size now.
  matched: boolean;
}

const px = (s: Size) => `${s.width} × ${s.height} px`;

// The standard size as a guide, the logo's size now, and a tick when it's there. Any size can still be saved.
export default function StandardSize({ canvas, target, size, matched }: StandardSizeProps) {
  const safeZone = target.width !== canvas.width || target.height !== canvas.height;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[13px] text-midnight-navy/80">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span>
          Standard: <strong className="font-semibold text-midnight-navy tabular-nums">{px(canvas)}</strong>
          {safeZone && <> · logo up to <span className="tabular-nums">{px(target)}</span></>}
        </span>
        <span>
          Your logo: <strong className="font-semibold text-midnight-navy tabular-nums">{px(size)}</strong>
        </span>
      </div>
      {matched && (
        <span
          role="status"
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-[#dcfce7] text-[#166534]"
        >
          <Check className="size-3.5" strokeWidth={3} />
          Standard size
        </span>
      )}
    </div>
  );
}
