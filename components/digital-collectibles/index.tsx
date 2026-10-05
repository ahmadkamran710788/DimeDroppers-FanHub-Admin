import { Gem } from "lucide-react";

// No design or collectibles API yet — page shell with an empty state until both land.
export default function DigitalCollectiblesPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col text-white">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          Digital Collectibles
        </h2>
        <p className="text-base leading-[26px]">Create and manage digital collectibles for your games and fans.</p>
      </div>

      <div className="rounded-[8px] p-6 py-16 flex flex-col items-center gap-4 text-center backdrop-blur-[24px] bg-surface-06">
        <div className="size-16 rounded-full flex items-center justify-center bg-[linear-gradient(200deg,#FF34BF_12%,#638BFE_100%)]">
          <Gem className="size-8 text-white" strokeWidth={1.5} />
        </div>
        <h3 className="font-display font-extrabold text-[28px] uppercase leading-none text-white">Coming Soon</h3>
        <p className="max-w-md text-sm text-white/60">
          Digital collectibles for each game will show up here once this feature is ready.
        </p>
      </div>
    </div>
  );
}
