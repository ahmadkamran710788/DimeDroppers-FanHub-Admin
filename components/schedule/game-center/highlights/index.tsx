import type { ReactNode } from "react";
import { ArrowRight, Play } from "lucide-react";
import type { Highlight } from "@/components/schedule/game-center/data";
import Image from "next/image";
import { cn } from "@/utils/cn";

interface HighlightsSectionProps {
  highlights: Highlight[];
  onPlay: (h: Highlight) => void;
  onSeeAll: () => void;
  // Optional action under each clip, e.g. "Add to Store".
  renderAction?: (h: Highlight) => ReactNode;
  className?: string;
}

// "Video" tab: grid of the game's top highlight clips.
export default function HighlightsSection({ highlights, onPlay, onSeeAll, renderAction, className }: HighlightsSectionProps) {
  return (
    <div className={cn("px-6 py-8 flex flex-col gap-6", className)}>
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display font-extrabold text-[32px] lg:text-[40px] uppercase leading-none text-white">
          Top Highlights
        </h3>
        <button
          type="button"
          onClick={onSeeAll}
          className="flex items-center gap-2 text-sm font-medium text-white hover:opacity-80 transition-opacity"
        >
          See All
          <ArrowRight className="size-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {highlights.map((h) => (
          <div
            key={h.id}
            className="rounded-[8px] overflow-hidden border border-white/10 bg-[#111C2E] hover:border-white/30 transition-colors flex flex-col"
          >
            <button type="button" onClick={() => onPlay(h)} aria-label={`Play ${h.title}`} className="group text-left">
              <div className="relative aspect-[16/9]">
                <Image
                  src={h.thumbnail}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 text-sm font-medium text-white">
                  {`${h.duration}s`}
                </span>
                <span className="absolute inset-0 m-auto size-10 rounded-full bg-black/70 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="size-4 text-white fill-white ml-0.5" />
                </span>
              </div>
              <div className="px-6 py-5 flex flex-col gap-1">
                <span className="text-lg font-medium text-white">{h.title}</span>
                <span className="text-base text-white/50">{`By ${h.author}`}</span>
              </div>
            </button>
            {renderAction && <div className="px-6 pb-5 -mt-1">{renderAction(h)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
