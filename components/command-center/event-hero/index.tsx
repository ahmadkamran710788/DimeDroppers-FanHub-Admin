"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import { EVENT } from "@/components/command-center/data";
import { routes } from "@/utils/routes";

// Live operations and sponsor activation screens aren't built yet.
const comingSoon = () => toast("Coming soon.");

// Headline card: is the event ready, plus shortcuts into the live tools.
export default function EventHero() {
  const router = useRouter();
  return (
    <section
      className="relative overflow-hidden rounded-[8px] p-6 lg:p-8 flex flex-col justify-center gap-5 bg-surface-07 backdrop-blur-[24px] outline outline-1 outline-white/10"
      style={{ backgroundImage: "radial-gradient(circle at 85% 20%, rgba(157,98,193,0.45), transparent 55%)" }}
    >
      <span className="self-start inline-flex items-center gap-2 h-7 px-3 rounded-full bg-success/20 text-success text-xs font-semibold">
        <span className="size-2 rounded-full bg-success animate-pulse" />
        {`${EVENT.liveGames} games live or starting soon`}
      </span>
      <h3 className="font-display font-extrabold text-[28px] lg:text-[40px] uppercase text-white leading-none">
        {`${EVENT.name} is operationally ready`}
      </h3>
      <p className="max-w-2xl text-base leading-[26px] text-white/80">
        {`${EVENT.teams} teams across ${EVENT.divisions} divisions. Monitor court status, Dime Vision streams, score feeds, sponsor activations and fan engagement without leaving the tournament workspace.`}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button variant="cta" label="Open Live Operations Board" onClick={comingSoon} />
        <Button variant="ghost" label="View Schedule" onClick={() => router.push(routes.ui.schedule)} />
        <Button variant="ghost" label="Sponsor Activations" onClick={comingSoon} />
      </div>
    </section>
  );
}
