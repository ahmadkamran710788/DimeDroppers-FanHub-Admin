import { type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { logoRect, type LogoImage, type LogoView, type Size } from "@/components/sponsor/logo-fit/render";

interface FramedLogoProps {
  image: Pick<LogoImage, "url" | "width" | "height">;
  // The saved file's size; only its shape is used here.
  frame: Size;
  view: LogoView;
  // A colour filled around the logo, as in the saved file (a landscape logo's own flat background).
  fill?: string | null;
  // The box's size, background, radius and border; its other side follows the frame's shape.
  className?: string;
  // Drawn over the logo, e.g. the icon's safe-zone guide.
  children?: ReactNode;
}

// The logo inside its frame exactly as the saved file will have it (the same `logoRect` as the canvas export).
export default function FramedLogo({ image, frame, view, fill, className, children }: FramedLogoProps) {
  const r = logoRect(image, frame, view);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ aspectRatio: `${frame.width} / ${frame.height}`, backgroundColor: fill ?? undefined }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a local preview of the picked file, placed at computed percentages */}
      <img
        src={image.url}
        alt=""
        draggable={false}
        className="absolute max-w-none select-none pointer-events-none"
        style={{ left: `${r.left * 100}%`, top: `${r.top * 100}%`, width: `${r.width * 100}%`, height: `${r.height * 100}%` }}
      />
      {children}
    </div>
  );
}
