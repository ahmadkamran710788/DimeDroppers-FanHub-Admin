import { cn } from "@/utils/cn";
import { Search } from "lucide-react";

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  className?: string;
  // "light" (default): white field. "dark": translucent field on dark cards.
  variant?: "light" | "dark";
}

// Full-height search field with a leading magnifier (Teams list toolbar).
export default function SearchInput({ className, placeholder = "Search", variant = "light", ...props }: SearchInputProps) {
  const dark = variant === "dark";
  return (
    <div className={cn("relative w-full", className)}>
      <Search
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none",
          dark ? "text-white/70" : "text-midnight-navy/70"
        )}
      />
      <input
        type="search"
        placeholder={placeholder}
        className={cn(
          "h-12 w-full rounded-[8px] pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-steel-blue",
          dark
            ? "bg-white/[0.06] border border-white/15 text-white placeholder:text-white/50"
            : "bg-white text-midnight-navy placeholder:text-midnight-navy/50"
        )}
        {...props}
      />
    </div>
  );
}
