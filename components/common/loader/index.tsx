import { cn } from "@/utils/cn";

interface LoaderProps {
  className?: string;
  // "sm": a small inline spinner with no padding, e.g. inside a chip.
  size?: "md" | "sm";
}

// Centered spinner for a section that is loading.
export default function Loader({ className, size = "md" }: LoaderProps) {
  return (
    <div className={cn("flex justify-center items-center", size === "md" ? "py-12" : "shrink-0", className)}>
      <span
        className={cn(
          "rounded-full border-white/20 border-t-white/60 animate-spin",
          size === "md" ? "w-6 h-6 border-2" : "size-3.5 border-[1.5px]"
        )}
      />
    </div>
  );
}
