import { ChevronDown } from "lucide-react";
import RowActionsMenu, { type RowAction } from "@/components/common/row-actions-menu";

// The grey filter chip (48px tall, 8px radius, faint border). Also used on plain buttons such as "Date Range".
export const FILTER_CHIP =
  "size-auto h-12 px-3.5 gap-2 rounded-[8px] outline-0 border border-white/15 bg-white/[0.06] hover:bg-white/10 text-sm text-white whitespace-nowrap";

interface FilterChipMenuProps {
  // What the chip shows: the picked option, or the "All …" label.
  label: string;
  ariaLabel: string;
  items: readonly RowAction[];
}

// Filter chip that opens a menu of options (e.g. "All Teams ▾").
export default function FilterChipMenu({ label, ariaLabel, items }: FilterChipMenuProps) {
  return (
    <RowActionsMenu
      ariaLabel={ariaLabel}
      className={FILTER_CHIP}
      trigger={
        <>
          {label}
          <ChevronDown className="size-4" strokeWidth={2} />
        </>
      }
      items={items}
    />
  );
}
