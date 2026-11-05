// A need's type as a small rounded tag (need rows, the sponsor preview).
export default function TypeChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[#638BFE]/60 bg-[#638BFE]/15 px-2.5 py-0.5 text-xs text-white">{label}</span>
  );
}
