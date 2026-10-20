export interface SponsorStat {
  label: string;
  value: string;
  // Background of the value bar.
  tint: string;
  caption: string;
}

// Sponsor stat: title, the value in a tinted bar, and a caption.
export default function StatTile({ label, value, tint, caption }: SponsorStat) {
  return (
    <div className="bg-[#141414] rounded-[14px] p-[26px] flex flex-col gap-4">
      <div className="font-bebas text-[30px] leading-none">{label}</div>
      <div
        className="rounded-[10px] h-[76px] flex items-center justify-center font-bebas text-[40px]"
        style={{ background: tint }}
      >
        {value}
      </div>
      <div className="text-[15px] text-[#d4d4d4]">{caption}</div>
    </div>
  );
}
