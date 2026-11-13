import { cn } from "@/utils/cn";
import { CARD, SECTION_TITLE } from "@/components/sponsor/styles";

interface HighlightsProps {
  highlights: { kicker: string; tone: string; title: string; text: string }[];
}

// What's working: the slot and organization that reached the most fans, and the best at getting action.
export default function Highlights({ highlights }: HighlightsProps) {
  return (
    <section aria-labelledby="highlights-title" className="flex flex-col gap-[10px]">
      <h3 id="highlights-title" className={SECTION_TITLE}>
        What’s Working
      </h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[14px]">
        {highlights.map((h) => (
          <div key={h.kicker} className={cn(CARD, "rounded-[14px] p-[18px] flex flex-col gap-2")}>
            <span className={cn("text-xs font-bold tracking-[1px]", h.tone)}>{h.kicker}</span>
            <span className="text-[17px] font-semibold leading-[1.35]">{h.title}</span>
            <span className="text-sm leading-normal text-[#a8a8a8]">{h.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
