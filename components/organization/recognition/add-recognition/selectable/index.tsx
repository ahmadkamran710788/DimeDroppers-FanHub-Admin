import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

interface SelectableProps {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
}

// A pickable tile of the Add Recognition wizard: blue ring and check mark when selected.
export default function Selectable({ selected, onSelect, children, className }: SelectableProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative text-left rounded-[16px] border-2 transition-colors",
        selected ? "border-[#3B82F6]" : "border-transparent hover:border-white/25",
        className
      )}
    >
      {selected && (
        <span className="absolute top-3 right-3 z-10 size-6 rounded-full bg-[#3B82F6] flex items-center justify-center">
          <Check className="size-4 text-white" strokeWidth={3} />
        </span>
      )}
      {children}
    </button>
  );
}
