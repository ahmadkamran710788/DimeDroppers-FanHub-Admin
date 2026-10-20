"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import Tabs from "@/components/common/tabs";
import { routes } from "@/utils/routes";

const TABS = ["Insights", "Recap", "Shop Items", "Highlights"] as const;
type Tab = (typeof TABS)[number];

const TAB_COPY: Record<Tab, { title: string; description: string; action: string }> = {
  Insights: {
    title: "Game Insights",
    description: "Key stats, trends and takeaways from this game.",
    action: "View Insights",
  },
  Recap: {
    title: "Game Recap",
    description: "Write up and share the story of this game with your fans.",
    action: "View Recap",
  },
  "Shop Items": {
    title: "Game Shop Items",
    description: "Merchandise and items fans can buy for this game.",
    action: "View Shop Items",
  },
  Highlights: {
    title: "Game Highlights",
    description: "Photos and video clips from this game.",
    action: "View Highlights",
  },
};

// Game center screen each tab opens; the insights page doesn't exist yet.
const TAB_ROUTE: Partial<Record<Tab, (gameId: string) => string>> = {
  Recap: routes.ui.gameRecap,
  Highlights: routes.ui.gameHighlights,
  "Shop Items": routes.ui.gameShop,
};

// Expanded area under a schedule row. Recap, Shop Items and Highlights open the game center
// screen; Insights shows a "coming soon" toast for now.
export default function GameDetailsPanel({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Insights");
  const copy = TAB_COPY[tab];

  return (
    <div className="px-4 pb-4 pt-2 flex flex-col gap-4 bg-white/5">
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="rounded-[8px] p-4 flex flex-col sm:flex-row sm:items-center gap-4 bg-white/5 border border-white/10">
        <div className="size-14 shrink-0 rounded-[8px] flex items-center justify-center bg-[linear-gradient(200deg,#FF34BF_12%,#638BFE_100%)]">
          <Sparkles className="size-7 text-white" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <span className="text-sm font-semibold text-white">{copy.title}</span>
          <span className="text-xs text-white/60">{copy.description}</span>
        </div>
        <Button
          variant="outline"
          label={copy.action}
          icon={<ArrowRight className="size-4" />}
          iconPosition="end"
          className="shrink-0 whitespace-nowrap border-[#FF34BF]/80"
          onClick={() => {
            const route = TAB_ROUTE[tab];
            if (route) router.push(route(gameId));
            else toast(`${tab} are coming soon.`);
          }}
        />
      </div>
    </div>
  );
}
