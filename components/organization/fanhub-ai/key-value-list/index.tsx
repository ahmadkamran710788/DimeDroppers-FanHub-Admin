import { fieldLabel, formatValue } from "@/components/organization/fanhub-ai/data";
import { cn } from "@/utils/cn";

interface KeyValueListProps {
  values: Record<string, unknown>;
  className?: string;
}

// A record's fields as label / value rows, in the order the API sent them.
export default function KeyValueList({ values, className }: KeyValueListProps) {
  const entries = Object.entries(values);
  if (entries.length === 0) return <p className="text-xs text-white/50">No details.</p>;
  return (
    <dl className={cn("grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-xs", className)}>
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-white/50 break-words">{fieldLabel(key)}</dt>
          <dd className="text-white break-words">{formatValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
