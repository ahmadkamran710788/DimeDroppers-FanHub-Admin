import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { Check, Volleyball } from "lucide-react";
import SectionHeading from "@/components/recognition/add-recognition/section-heading";
import { MUSTANGS, type RecognitionCategory, type RecognitionTemplate } from "@/components/recognition/recognitions-data";
import { CATEGORIES, TEMPLATES } from "@/components/recognition/templates";
import { cn } from "@/utils/cn";

interface ChooseStepProps {
  category: RecognitionCategory;
  template: RecognitionTemplate;
  onCategory: (c: RecognitionCategory) => void;
  onTemplate: (t: RecognitionTemplate) => void;
}

function Selectable({
  selected,
  onSelect,
  children,
  className,
  style,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={style}
      className={cn(
        "relative text-left rounded-[10px] border-2 transition-colors",
        selected ? "border-[#3B82F6]" : "border-white/10 hover:border-white/25",
        className
      )}
    >
      {selected && (
        <span className="absolute top-2 right-2 z-10 size-6 rounded-full bg-[#3B82F6] flex items-center justify-center">
          <Check className="size-4 text-white" strokeWidth={3} />
        </span>
      )}
      {children}
    </button>
  );
}

function TemplateCard({ name }: { name: RecognitionTemplate }) {
  const t = TEMPLATES[name];
  return (
    <div className="flex flex-col h-full">
      {/* Mini fan-app banner */}
      <div
        className="m-2 rounded-[8px] px-3 py-3 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2"
        style={{ background: t.gradient }}
      >
        <div className="flex flex-col items-start gap-1 min-w-0">
          <span className="size-10 rounded-full bg-white/15 flex items-center justify-center">{t.icon("size-6")}</span>
          <span className="font-display font-extrabold text-lg leading-tight text-white truncate max-w-full">{name}</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-white">
          <Volleyball className="size-4" strokeWidth={1.75} />
          <span className="px-1.5 py-0.5 rounded-full bg-white/15 text-[10px] font-medium uppercase">June 30</span>
          <span className="text-sm font-semibold whitespace-nowrap">10:00 PM</span>
        </div>
        <div className="flex flex-col items-center gap-1 w-16 text-center">
          <Image src={MUSTANGS.logo} alt="" width={36} height={36} className="size-9 rounded-full object-cover" />
          <span className="text-[10px] font-semibold leading-tight text-white">{MUSTANGS.name}</span>
        </div>
      </div>
      <div className="px-4 pb-4 pt-1 flex flex-col gap-1 text-white">
        <span className="text-base font-semibold">{name}</span>
        <span className="text-sm text-white/75 leading-snug">{t.description}</span>
      </div>
    </div>
  );
}

// Steps 1–2 of Add Recognition: who to recognize, then which template.
export default function ChooseStep({ category, template, onCategory, onTemplate }: ChooseStepProps) {
  return (
    <div className="flex flex-col gap-8 min-w-0">
      <section className="flex flex-col gap-4">
        <SectionHeading
          step={1}
          title="Select Recognition Category"
          description="Choose who you want to recognize. Templates will be shown based on your selection."
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {(Object.keys(CATEGORIES) as RecognitionCategory[]).map((c) => {
            const info = CATEGORIES[c];
            const selected = c === category;
            return (
              <Selectable
                key={c}
                selected={selected}
                onSelect={() => onCategory(c)}
                className={cn("p-4 flex flex-col items-center gap-2 text-center", selected ? "bg-[#1E3A8A]/60" : "bg-white/[0.04]")}
              >
                <span className={info.tint}>{info.icon("size-9")}</span>
                <span className="text-base font-semibold text-white">{c}</span>
                <span className="text-xs leading-relaxed text-white/70">{info.description}</span>
              </Selectable>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading
          step={2}
          title={`Select a Template (${category})`}
          description={`Choose a template for ${category.toLowerCase()} recognition. You can customize the content in the next step.`}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {CATEGORIES[category].templates.map((name) => (
            <Selectable
              key={name}
              selected={name === template}
              onSelect={() => onTemplate(name)}
              className="overflow-hidden bg-white/[0.04]"
            >
              <TemplateCard name={name} />
            </Selectable>
          ))}
        </div>
      </section>
    </div>
  );
}
