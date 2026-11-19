import { type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { EYEBROW } from "@/components/sponsor/styles";
import FramedLogo from "@/components/sponsor/logo-fit/framed-logo";
import type { LogoImage, LogoView } from "@/components/sponsor/logo-fit/render";
import type { VariantSpec } from "@/utils/types/sponsor-brand-assets";

interface SlotPreviewsProps {
  image: LogoImage;
  spec: VariantSpec;
  view: LogoView;
  // The colour filled around the logo in the saved file, if any.
  fill: string | null;
  // The icon's background class.
  iconBackground: string;
}

// The fitted logo at the size fans see it, in the app's own containers: the white "Presented by" banner (logo
// 30 px tall), the dark scoreboard credit (16 px) and the home sponsor strip tile (72×30 inside), or the icon badge.
export default function SlotPreviews({ image, spec, view, fill, iconBackground }: SlotPreviewsProps) {
  const logo = (className: string) => (
    <FramedLogo image={image} frame={spec.recommended} view={view} fill={fill} className={className} />
  );

  function previews() {
    if (spec.variant === "FULL_COLOR") {
      return (
        <Preview caption="“Presented by” banner on game cards and screens">
          <div className="h-[42px] w-full max-w-[354px] rounded-[8px] bg-white px-3 flex items-center justify-center gap-2">
            <span className="text-[11px] text-[#52525b] whitespace-nowrap">Presented by</span>
            {logo("h-[30px] shrink-0")}
          </div>
        </Preview>
      );
    }
    if (spec.variant === "WHITE") {
      return (
        <>
          <Preview caption="Scoreboards and live panels">
            <div className="self-start h-7 rounded-[6px] bg-black border border-[#262b35] px-3 flex items-center gap-2">
              <span className="text-[10px] tracking-[0.5px] text-white/60 whitespace-nowrap">PRESENTED BY</span>
              {logo("h-4 shrink-0")}
            </div>
          </Preview>
          <Preview caption="Home sponsor strip">
            <div className="w-[100px] h-[50px] rounded-[8px] bg-[#D8EBFD]/12 px-[14px] py-[10px] flex items-center justify-center">
              {logo("w-full")}
            </div>
          </Preview>
        </>
      );
    }
    return (
      <Preview caption="Partner Offers card · not shown in the app yet">
        {logo(cn("size-16 rounded-[12px]", iconBackground))}
      </Preview>
    );
  }

  return (
    <div className="rounded-[16px] bg-[#08090c] border border-[#2a2f3a] p-4 flex flex-col gap-4">
      <span className={EYEBROW}>HOW FANS SEE IT</span>
      {previews()}
    </div>
  );
}

function Preview({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-[#a8a8a8]">{caption}</span>
      {children}
    </div>
  );
}
