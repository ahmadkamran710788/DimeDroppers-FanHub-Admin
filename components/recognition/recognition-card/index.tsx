import { Volleyball } from "lucide-react";
import Image from "next/image";
import { HOME_TEAM, type Recognition } from "@/components/recognition/recognitions-data";
import { TEMPLATES } from "@/components/recognition/templates";
import { cn } from "@/utils/cn";

export type RecognitionCardData = Pick<
  Recognition,
  "template" | "message" | "postedBy" | "postedByRole" | "number" | "recipient" | "date" | "event" | "opponent"
>;

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function Crest({ name, logo }: { name: string; logo: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-24 text-center">
      <Image src={logo} alt="" width={48} height={48} className="size-12 rounded-full object-cover ring-2 ring-white/30" />
      <span className="text-sm font-semibold leading-tight text-white">{name}</span>
    </div>
  );
}

// A recognition as it appears on the fan app, tinted with its template's colours.
interface RecognitionCardProps {
  data: RecognitionCardData;
  // Show "· 2h" (time since posted) after the role.
  showTimestamp?: boolean;
  className?: string;
}

export default function RecognitionCard({ data, showTimestamp = true, className }: RecognitionCardProps) {
  const template = TEMPLATES[data.template];
  return (
    <div className={cn("rounded-[14px] p-5 flex flex-col gap-4 text-white", className)} style={{ background: template.gradient }}>
      {data.opponent ? (
        <div className="flex items-start justify-between gap-2 pb-4 border-b border-white/20">
          <Crest name={HOME_TEAM.name} logo={HOME_TEAM.logo} />
          <div className="flex flex-col items-center gap-1.5">
            <Volleyball className="size-5" strokeWidth={1.75} />
            <span className="px-2 py-0.5 rounded-full bg-white/15 text-xs font-medium uppercase">
              {new Date(data.date).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            </span>
            <span className="text-xl font-bold whitespace-nowrap">
              {new Date(data.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
          <Crest name={data.opponent.name} logo={data.opponent.logo} />
        </div>
      ) : (
        <span className="pb-4 border-b border-white/20 text-sm font-semibold">{data.event}</span>
      )}

      <span className="self-start h-9 px-3 rounded-full flex items-center gap-1.5 bg-white/15 text-sm font-semibold">
        {template.icon("size-4 shrink-0")}
        {data.template}
      </span>
      <p className="text-[15px] font-semibold leading-snug">{data.message}</p>

      <div className="flex items-center gap-3 pb-4 border-b border-white/20">
        <span className="size-10 rounded-full bg-white/15 flex items-center justify-center text-sm font-semibold">
          {initials(data.postedBy)}
        </span>
        <div className="flex flex-col text-sm">
          <span className="font-medium">{data.postedBy}</span>
          <span className="text-white/70">{showTimestamp ? `${data.postedByRole} · 2h` : data.postedByRole}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm font-semibold">
        {data.number !== undefined && <span className="px-2 py-1 rounded-[6px] bg-white/15">{`#${data.number}`}</span>}
        {data.recipient}
      </div>
    </div>
  );
}
