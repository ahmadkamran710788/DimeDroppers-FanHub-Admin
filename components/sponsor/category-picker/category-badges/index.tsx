import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";

const BADGE = "inline-flex items-center gap-1 max-w-full min-h-8 rounded-full border border-[#3a3a3a] bg-[#1a1a1a] text-sm text-white";

interface CategoryBadgesProps {
  // The categories to show, with their labels, in the order picked.
  categories: { value: string; label: string }[];
  // Set: each badge gets an × that removes it. Unset: the badges only show the categories.
  onRemove?: (value: string) => void;
  className?: string;
}

// A sponsor's categories as badges: under the category dropdown (removable), and on the sign-up review and the
// profile (read-only).
export default function CategoryBadges({ categories, onRemove, className }: CategoryBadgesProps) {
  if (categories.length === 0) return null;

  return (
    <ul aria-label="Sponsor categories" className={cn("flex flex-wrap gap-2", className)}>
      {categories.map((c) => (
        <li key={c.value} className={cn(BADGE, onRemove ? "pl-3 pr-1" : "px-3 py-1")}>
          <span className="min-w-0 break-words">{c.label}</span>
          {onRemove && (
            <Button
              size="icon"
              icon={<X className="size-3.5" strokeWidth={2.2} />}
              aria-label={`Remove ${c.label}`}
              onClick={() => onRemove(c.value)}
              className="size-7 bg-transparent text-[#bdbdbd] hover:bg-white/10 hover:text-white"
            />
          )}
        </li>
      ))}
    </ul>
  );
}
