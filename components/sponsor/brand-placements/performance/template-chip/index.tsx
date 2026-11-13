import { cn } from "@/utils/cn";
import { TEMPLATE_CHIP } from "@/components/sponsor/brand-placements/data";
import { TEMPLATE_NAME } from "@/components/sponsor/brand-placements/performance/use-performance";
import type { TemplateId } from "@/components/sponsor/brand-placements/purchased-inventory/data";

interface TemplateChipProps {
  template: TemplateId;
  className?: string;
}

// A setup's name as a colored pill ("Simple BPA", "Survey").
export default function TemplateChip({ template, className }: TemplateChipProps) {
  return (
    <span className={cn("text-[11px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap", TEMPLATE_CHIP[template], className)}>
      {TEMPLATE_NAME[template]}
    </span>
  );
}
