const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// Avatar initials, name and email: the first column of every Team Details list.
export default function PersonCell({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="size-10 shrink-0 rounded-full bg-white/15 flex items-center justify-center text-sm font-semibold text-white">
        {initials(name)}
      </span>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-sm font-semibold text-white truncate">{name}</span>
        <span className="text-xs text-white/40 truncate">{email}</span>
      </div>
    </div>
  );
}
