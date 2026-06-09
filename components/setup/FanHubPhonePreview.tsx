/* eslint-disable @next/next/no-img-element */

interface FanHubPhonePreviewProps {
  /** Backend-driven values. Defaults match the Figma design. */
  schoolName?: string;
  logoSrc?: string;
  heroSrc?: string;
  /** Teal accent: hero overlay, TODAY pill, active Home tab. */
  brandColor?: string;
  location?: string;
  website?: string;
}

const FILTERS = [
  { icon: "/icons/icon-sport.svg", label: "Activities", trailing: "chevron" },
  { icon: "/icons/icon-chart-bar.svg", label: "Level", trailing: "chevron" },
  { icon: "/icons/icon-users-alt.svg", label: "Gender (1)", trailing: "close" },
] as const;

const TABS = [
  { icon: "/icons/icon-tab-home.svg", label: "Home", active: true },
  { icon: "/icons/icon-tab-star.svg", label: "Favorites", active: false },
  { icon: "/icons/icon-tab-wallet.svg", label: "Wallet", active: false },
  { icon: "/icons/icon-tab-notification.svg", label: "Notifications", active: false },
  { icon: "/icons/icon-tab-more.svg", label: "More", active: false },
] as const;

export default function FanHubPhonePreview({
  schoolName = "Twin Lakes Academy Middle School",
  logoSrc = "/images/preview-crest.png",
  heroSrc = "/images/preview-hero.png",
  brandColor = "#0B6F81",
  location = "Jacksonville, FL",
  website = "Website",
}: FanHubPhonePreviewProps) {
  const radialDivider = {
    height: "2px",
    background:
      "radial-gradient(circle at 50% 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)",
  };

  return (
    <div
      className="w-[360px] shrink-0 rounded-[28px] overflow-hidden flex flex-col"
      style={{ background: "linear-gradient(180deg, rgba(6,8,14,1) 0%, rgba(0,0,0,1) 100%)" }}
    >
      {/* Header bar */}
      <div className="h-[56px] flex items-center justify-center gap-1.5 bg-black">
        <img src="/icons/logo-union.svg" alt="" width={19} height={16} className="shrink-0" />
        <span className="font-display font-black text-[19px] uppercase leading-none tracking-wide text-white">
          FAN HUB
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-9 px-[22px] pt-[14px] pb-3">
        {/* Hero card */}
        <div
          className="relative rounded-[12px] p-[22px] flex flex-col gap-4 overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(180deg, ${hexToRgba(brandColor, 0.7)} 0%, ${hexToRgba(
              brandColor,
              1
            )} 100%), url(${heroSrc})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Crest */}
          <div
            className="w-[86px] h-[86px] rounded-full shrink-0 overflow-hidden flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1.7px solid rgba(255,255,255,0.5)",
              backdropFilter: "blur(42px)",
            }}
          >
            <img src={logoSrc} alt="" className="w-[60px] h-[60px] object-contain" />
          </div>

          {/* School name */}
          <h4 className="font-display font-black text-[44px] uppercase text-white leading-[1.05] w-full">
            {schoolName}
          </h4>

          {/* Location + Website */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-white text-xs font-medium">
              <img src="/icons/icon-pin.svg" alt="" width={18} height={18} />
              {location}
            </span>
            <span className="flex items-center gap-1.5 text-white text-xs font-medium">
              <img src="/icons/icon-external-link.svg" alt="" width={18} height={18} />
              {website}
            </span>
          </div>

          <div style={radialDivider} />

          {/* Social icons */}
          <img src="/icons/icon-socials.svg" alt="Social links" className="w-full h-auto" />

          {/* Favorite / Share */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex-1 h-[41px] rounded-[7px] flex items-center justify-center gap-2 text-white text-sm font-medium"
              style={{ background: "rgba(235,235,235,0.25)", backdropFilter: "blur(41px)" }}
            >
              <img src="/icons/icon-star.svg" alt="" width={18} height={18} />
              Favorite
            </button>
            <button
              type="button"
              className="flex-1 h-[41px] rounded-[7px] flex items-center justify-center gap-2 text-white text-sm font-medium"
              style={{ background: "rgba(235,235,235,0.25)", backdropFilter: "blur(41px)" }}
            >
              <img src="/icons/icon-share.svg" alt="" width={18} height={18} />
              Share
            </button>
          </div>
        </div>

        {/* Schedule header + TODAY pill */}
        <div className="flex items-center justify-between">
          <h4 className="font-display font-black text-[24px] uppercase text-white leading-none">
            Schedule
          </h4>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px]"
            style={{ background: brandColor, backdropFilter: "blur(90px)" }}
          >
            <span className="font-display font-black text-[20px] uppercase text-white leading-none">
              Today
            </span>
            <img src="/icons/icon-angle-down.svg" alt="" width={18} height={18} />
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <span
              key={f.label}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-white text-xs font-medium"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(90px)" }}
            >
              <img src={f.icon} alt="" width={18} height={18} />
              {f.label}
              <img
                src={f.trailing === "close" ? "/icons/icon-close-sm.svg" : "/icons/icon-angle-down.svg"}
                alt=""
                width={14}
                height={14}
              />
            </span>
          ))}
        </div>
      </div>

      {/* Bottom tab bar */}
      <div className="mt-auto px-6 pb-6 pt-3">
        <div
          className="relative flex items-center justify-around rounded-full px-2 py-2"
          style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(34px)" }}
        >
          {TABS.map((tab) => (
            <div
              key={tab.label}
              className="relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-full"
              style={tab.active ? { background: brandColor } : undefined}
            >
              <img src={tab.icon} alt="" width={20} height={20} />
              <span className="text-white text-[8.5px] font-semibold leading-none">{tab.label}</span>
            </div>
          ))}
        </div>
        {/* Home indicator */}
        <div className="mx-auto mt-2 h-1 w-28 rounded-full bg-white/40" />
      </div>
    </div>
  );
}

/** Convert "#RRGGBB" to an rgba() string. Falls back to the input for non-hex values. */
function hexToRgba(hex: string, alpha: number): string {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!match) return hex;
  const r = parseInt(match[1], 16);
  const g = parseInt(match[2], 16);
  const b = parseInt(match[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
