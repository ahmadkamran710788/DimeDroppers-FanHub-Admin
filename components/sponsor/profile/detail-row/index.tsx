import { cn } from "@/utils/cn";
import { SECTION_LABEL } from "@/components/sponsor/styles";

interface DetailRowProps {
  label: string;
  // While editing, the field carries its own (screen reader) label, so this one is hidden from them.
  hideLabel?: boolean;
  children: React.ReactNode;
}

// One row of a profile card: the label column and the value (or its field).
export default function DetailRow({ label, hideLabel, children }: DetailRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-5 border-t border-[#222]">
      <div aria-hidden={hideLabel || undefined} className={cn(SECTION_LABEL, "flex-[0_0_200px]")}>
        {label}
      </div>
      <div className="flex-[1_1_280px] min-w-0">{children}</div>
    </div>
  );
}
