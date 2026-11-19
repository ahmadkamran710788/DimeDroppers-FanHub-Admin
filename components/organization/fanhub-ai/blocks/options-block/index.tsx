import Button from "@/components/common/button";
import type { AgentOption } from "@/utils/types/organiser-agent";

interface OptionsBlockProps {
  options: AgentOption[];
  // Only the newest reply's options can be picked, and not while a reply is due.
  active: boolean;
  onPick: (option: AgentOption) => void;
}

// Choices the agent offers; tapping one sends its label with its id.
export default function OptionsBlock({ options, active, onPick }: OptionsBlockProps) {
  if (!options?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.id}
          size="sm"
          variant="outline"
          label={option.label}
          onClick={() => onPick(option)}
          disabled={!active}
          className="h-9 px-4 text-sm"
        />
      ))}
    </div>
  );
}
