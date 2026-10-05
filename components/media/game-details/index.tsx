"use client";

import { useState } from "react";
import SegmentedControl from "@/components/common/segmented-control";
import type { MediaGame } from "@/components/media/data";

const SECTIONS = ["Recap", "Insights", "Stats", "Plays"] as const;
type Section = (typeof SECTIONS)[number];

// "Game Details" tab: written recap now; insights, stats and plays land with their own designs.
export default function GameDetails({ game }: { game: MediaGame }) {
  const [section, setSection] = useState<Section>("Recap");

  return (
    <div className="flex flex-col gap-8">
      <SegmentedControl
        options={SECTIONS}
        active={section}
        onChange={setSection}
        ariaLabel="Game details"
        variant="light"
        fullWidth
      />

      {section === "Recap" && game.recap ? (
        <article className="flex flex-col gap-6 text-white">
          <h3 className="font-display font-extrabold text-[30px] leading-tight">{game.recap.headline}</h3>
          {game.recap.paragraphs.map((p) => (
            <p key={p.slice(0, 32)} className="text-[17px] leading-[26px] text-white/85">
              {p}
            </p>
          ))}
        </article>
      ) : (
        <p className="py-10 text-center text-sm text-white/50">
          {section === "Recap" ? "The recap will appear here after the game." : `${section} — coming soon.`}
        </p>
      )}
    </div>
  );
}
