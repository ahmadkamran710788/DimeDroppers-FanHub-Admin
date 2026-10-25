import type { SponsorPackages } from "@/utils/types/sponsor-packages";

// How a tournament event's games are counted for the price: each division's teams and games under the
// event's format, and the total the packages multiply by. Nothing for a school (priced by teams).
export default function GamesBreakdown({ priceBasis }: { priceBasis: SponsorPackages["priceBasis"] }) {
  if (priceBasis.basis !== "GAMES" || priceBasis.divisions.length === 0) return null;
  return (
    <details className="rounded-[10px] border border-[#262626] bg-[#0b0b0b] text-white">
      <summary className="cursor-pointer px-4 py-3 text-[13px] font-bold tracking-[1px]">
        {`HOW GAMES ARE COUNTED · ${priceBasis.quantity} GAMES`}
      </summary>
      <div className="px-4 pb-4 flex flex-col gap-2">
        {priceBasis.tournamentFormatLabel && (
          <p className="text-[13px] text-[#a8a8a8]">{`${priceBasis.tournamentFormatLabel}, ${priceBasis.teamCount} teams`}</p>
        )}
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[#a8a8a8]">
              <th className="py-1.5 font-semibold">Division</th>
              <th className="py-1.5 font-semibold text-right w-20">Teams</th>
              <th className="py-1.5 font-semibold text-right w-20">Games</th>
            </tr>
          </thead>
          <tbody>
            {priceBasis.divisions.map((d, i) => (
              <tr key={d.divisionId ?? `division-${i}`} className="border-t border-[#222]">
                <td className="py-1.5 pr-2">{d.name ?? "No division"}</td>
                <td className="py-1.5 text-right">{d.teamCount}</td>
                <td className="py-1.5 text-right">{d.games}</td>
              </tr>
            ))}
            <tr className="border-t border-[#333] font-semibold">
              <td className="py-1.5">Total</td>
              <td className="py-1.5 text-right">{priceBasis.teamCount}</td>
              <td className="py-1.5 text-right">{priceBasis.quantity}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  );
}
