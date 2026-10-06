"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import SegmentedControl from "@/components/common/segmented-control";
import type { MediaGame } from "@/components/media/data";
import GameInsights from "@/components/media/game-insights";
import { SAMPLE_GAME } from "@/components/schedule/game-center/data";
import HighlightsSection from "@/components/schedule/game-center/highlights";
import ShopSection from "@/components/schedule/game-center/shop";

const SECTIONS = ["Recap", "Insights", "Videos", "Shop Items"] as const;
type Section = (typeof SECTIONS)[number];

// Clip playback and product pages aren't built yet.
const comingSoon = () => toast("Coming soon.");

// "Game Details" tab: recap, insights, highlight videos and game merch.
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

      {section === "Insights" ? (
        <GameInsights game={game} />
      ) : section === "Shop Items" && game.shop?.length ? (
        <ShopSection
          products={game.shop}
          sponsorName={SAMPLE_GAME.sponsor.name}
          sponsorLogo={SAMPLE_GAME.sponsor.presentedLogo}
          onSelectProduct={comingSoon}
          onSeeAll={comingSoon}
          featuredOnly
          className="p-0"
        />
      ) : section === "Videos" && game.videos?.length ? (
        <HighlightsSection highlights={game.videos} onPlay={comingSoon} onSeeAll={comingSoon} className="p-0" />
      ) : section === "Recap" && game.recap ? (
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
          {section === "Recap"
            ? "The recap will appear here after the game."
            : section === "Videos"
              ? "Videos will appear here after the game."
              : "No shop items for this game yet."}
        </p>
      )}
    </div>
  );
}
