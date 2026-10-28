"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/common/button";
import SectionCard from "@/components/common/section-card";
import ThreadRow from "@/components/organization/sponsor-messages/thread-row";
import ThreadPane from "@/components/organization/sponsor-messages/thread-pane";
import { useSponsorAgent } from "@/context/sponsor-agent";
import { routes } from "@/utils/routes";

interface SponsorMessagesPageProps {
  // The thread to open first (a sponsor id), from "Open in Sponsor Messages".
  threadId?: string;
}

// Sponsor Messages: one thread per approved follow-up. The agent answers sponsor replies until the
// organiser takes a thread over.
export default function SponsorMessagesPage({ threadId }: SponsorMessagesPageProps) {
  const router = useRouter();
  const { sentSponsors } = useSponsorAgent();
  const [activeId, setActiveId] = useState(threadId);
  const active = sentSponsors.find((s) => s.id === activeId) ?? sentSponsors[0];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2 text-white max-w-[720px]">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          Sponsor Messages
        </h2>
        <p className="text-base leading-[26px]">
          Every approved outreach lives here as a thread. The Sponsor AI Agent answers sponsor replies for you.
          Take over any thread whenever you want.
        </p>
      </div>

      {active ? (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)] gap-6 items-start">
          <section aria-label="Threads" className="rounded-[8px] p-3 flex flex-col gap-2 backdrop-blur-[48px] bg-surface-06">
            <h3 className="px-3 pt-2 pb-1 text-xs font-bold tracking-[1.2px] text-white/60">{`THREADS · ${sentSponsors.length}`}</h3>
            {sentSponsors.map((s) => (
              <ThreadRow key={s.id} sponsor={s} selected={s.id === active.id} onSelect={() => setActiveId(s.id)} />
            ))}
          </section>
          <ThreadPane key={active.id} sponsor={active} />
        </div>
      ) : (
        <SectionCard
          title="No threads yet"
          description="Approve a follow-up in the Sponsor AI Agent and the thread appears here."
          className="items-center text-center py-12"
        >
          <Button variant="cta" label="Go to Sponsor AI Agent" onClick={() => router.push(routes.ui.sponsorAiAgent)} className="px-6" />
        </SectionCard>
      )}
    </div>
  );
}
