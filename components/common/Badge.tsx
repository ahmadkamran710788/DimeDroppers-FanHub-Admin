import CheckCircle from "@/components/common/CheckCircle";
import { cn } from "@/utils/cn";

type BadgeVariant = "recommended" | "complete" | "connected" | "error" | "disconnected";

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
}

export default function Badge({ variant, label, className }: BadgeProps) {
  const defaults: Record<BadgeVariant, string> = {
    recommended: "Recommended",
    complete: "Complete",
    connected: "Connected",
    error: "Error",
    disconnected: "Not Connected",
  };

  const text = label ?? defaults[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-normal",
        variant === "recommended" && "bg-[rgba(0,0,0,0.2)] text-success backdrop-blur-[104px]",
        variant === "complete" && "text-success",
        variant === "connected" && "text-success",
        variant === "error" && "text-error",
        variant === "disconnected" && "text-white",
        className
      )}
    >
      {(variant === "complete" || variant === "connected") && (
        <CheckCircle size={12} />
      )}
      {text}
    </span>
  );
}
