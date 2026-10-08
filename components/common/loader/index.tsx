import { cn } from "@/utils/cn";

interface LoaderProps {
  className?: string;
}

// Centered spinner for a section that is loading.
export default function Loader({ className }: LoaderProps) {
  return (
    <div className={cn("flex justify-center items-center py-12", className)}>
      <span className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
    </div>
  );
}
