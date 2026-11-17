import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import { CARD, OUTLINE_BUTTON } from "@/components/sponsor/styles";

interface LoadProblemProps {
  // The whole line, e.g. "Couldn't load your logos: <the backend's message>".
  message: string;
  onRetry: () => void;
}

// A section that failed to load, with Retry (Purchased Inventory, Logo Variants, the Brand Assets logos).
export default function LoadProblem({ message, onRetry }: LoadProblemProps) {
  return (
    <div role="alert" className={cn(CARD, "rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3")}>
      <p className="text-sm text-[#f0c36a]">{message}</p>
      <Button label="Retry" onClick={onRetry} className={cn(OUTLINE_BUTTON, "h-10 px-4 rounded-[10px] text-sm")} />
    </div>
  );
}
