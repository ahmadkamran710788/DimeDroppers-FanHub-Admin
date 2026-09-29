import { cn } from "@/utils/cn";
import { Search } from "lucide-react";

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  className?: string;
}

// White, full-height search field with a leading magnifier (Teams list toolbar).
export default function SearchInput({ className, placeholder = "Search", ...props }: SearchInputProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-midnight-navy/70 pointer-events-none" />
      <input
        type="search"
        placeholder={placeholder}
        className="h-12 w-full rounded-[8px] bg-white pl-12 pr-4 text-base text-midnight-navy placeholder:text-midnight-navy/50 focus:outline-none focus:ring-2 focus:ring-steel-blue"
        {...props}
      />
    </div>
  );
}
