import type { RecognitionCategory, RecognitionTemplate } from "@/components/recognition/recognitions-data";
import { CATEGORIES, TEMPLATES } from "@/components/recognition/templates";
import { cn } from "@/utils/cn";

const PILL = "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[6px] text-xs font-medium text-white whitespace-nowrap";

export function CategoryBadge({ category }: { category: RecognitionCategory }) {
  const { icon, pill } = CATEGORIES[category];
  return (
    <span className={cn(PILL, pill)}>
      {icon()}
      {category}
    </span>
  );
}

export function TemplateBadge({ template, className }: { template: RecognitionTemplate; className?: string }) {
  const { icon, pill } = TEMPLATES[template];
  return (
    <span className={cn(PILL, pill, className)}>
      {icon()}
      {template}
    </span>
  );
}
