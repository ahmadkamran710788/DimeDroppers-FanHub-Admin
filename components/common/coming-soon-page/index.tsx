import type { ReactNode } from "react";

interface ComingSoonPageProps {
  title: string;
  description: string;
  icon: ReactNode;
}

// Title and a "coming soon" card for a sidebar page whose design hasn't landed yet.
export default function ComingSoonPage({ title, description, icon }: ComingSoonPageProps) {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col text-white">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          {title}
        </h2>
        <p className="text-base leading-[26px]">{description}</p>
      </div>
      <div className="rounded-[8px] p-10 flex flex-col items-center gap-4 text-center backdrop-blur-[24px] bg-surface-06">
        <span className="size-16 rounded-full bg-white/10 flex items-center justify-center text-white">{icon}</span>
        <p className="font-display font-extrabold text-[28px] uppercase text-white leading-none">Coming Soon</p>
        <p className="text-sm text-white/60 max-w-md">This section is being built and will be available here shortly.</p>
      </div>
    </div>
  );
}
