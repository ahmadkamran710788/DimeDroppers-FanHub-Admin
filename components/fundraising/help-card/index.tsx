import { ShieldQuestionMark } from "lucide-react";
import Button from "@/components/common/button";
import SectionCard from "@/components/common/section-card";

export default function HelpCard({ onLearnMore }: { onLearnMore: () => void }) {
  return (
    <SectionCard className="lg:p-6">
      <div className="flex items-start gap-2 text-white">
        <ShieldQuestionMark className="size-10 shrink-0" strokeWidth={1.5} />
        <div className="flex flex-col gap-2">
          <p className="text-2xl leading-8 font-bold">Need help with Fundraising?</p>
          <p className="text-base leading-6">Visit our Help Center to learn more.</p>
        </div>
      </div>
      <hr className="border-white/10" />
      <Button label="Learn More" fullWidth onClick={onLearnMore} />
    </SectionCard>
  );
}
