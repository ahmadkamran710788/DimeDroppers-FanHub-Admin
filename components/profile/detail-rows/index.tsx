import type { ReactNode } from "react";

interface DetailRowsProps {
  rows: { label: string; value: ReactNode }[];
}

// Label / value pairs inside a ProfileSection; empty values show as "—".
export default function DetailRows({ rows }: DetailRowsProps) {
  return (
    <dl className="grid grid-cols-[minmax(0,180px)_minmax(0,1fr)] gap-x-6 gap-y-3 text-sm">
      {rows.map(({ label, value }) => (
        <div key={label} className="contents">
          <dt className="text-white/70">{label}</dt>
          <dd className="text-white break-words">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
