import { cn } from "@/utils/cn";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  className?: string;
}

// Page numbers to show: first 3, an ellipsis, then the last page (design pattern),
// always including the current page and its neighbours.
function pageItems(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set([1, 2, 3, page - 1, page, page + 1, pageCount]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ["…" as const, p] : [p]));
}

const circle =
  "size-8 rounded-full flex items-center justify-center text-xs font-medium text-white transition-colors";

export default function Pagination({ page, pageCount, onChange, className }: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        aria-label="Previous page"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className={cn(circle, "bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed")}
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      {pageItems(page, pageCount).map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} className={cn(circle, "bg-white/10")}>…</span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === page ? "page" : undefined}
            onClick={() => onChange(item)}
            className={cn(circle, item === page ? "bg-steel-blue" : "bg-white/10 hover:bg-white/20")}
          >
            {item}
          </button>
        )
      )}
      <button
        type="button"
        aria-label="Next page"
        disabled={page === pageCount}
        onClick={() => onChange(page + 1)}
        className={cn(circle, "bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed")}
      >
        <ArrowRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
