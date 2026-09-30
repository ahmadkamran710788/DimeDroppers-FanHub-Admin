import { MapPin, ShieldCheck } from "lucide-react";
import { ORG_TYPE_OPTIONS, SPORT_OPTIONS, labelOf, type OrgFormState } from "@/components/organization/form";

// Converts "#0B6F81" → "rgba(11, 111, 129, <alpha>)". Falls back to black on bad input.
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return `rgba(0, 0, 0, ${alpha})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

interface PreviewCardProps {
  form: OrgFormState;
  logoUrl: string | null;
  title?: string;
  subtitle?: string;
}

// How the organization's Fan Hub looks to fans: brand-tinted hero with logo, name and sport,
// then type / location / conference rows. Used by the Setup Wizard and the Profile page.
export default function PreviewCard({ form, logoUrl, title = "Preview", subtitle }: PreviewCardProps) {
  const initials = form.organizationName
    ? form.organizationName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "TL";

  return (
    <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px]" style={{ background: "rgba(255,255,255,0.08)" }}>
      <div className="flex flex-col gap-2">
        <h3 className="font-display font-black text-[28px] uppercase text-white leading-none">{title}</h3>
        {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
      </div>

      {/* Inner image card */}
      <div
        className="rounded-[12px] relative outline-2 outline-solid -outline-offset-2 outline-border-subtle"
        style={{ backgroundImage: "url(/images/preview-bg.png)", backgroundSize: "cover", backgroundPosition: "center top" }}
      >
        {/* Gradient overlay — tinted with the selected Primary brand color */}
        <div
          className="absolute inset-0 rounded-[12px]"
          style={{
            background: `linear-gradient(180deg, ${hexToRgba(form.primaryColor, 0.7)} 0%, ${hexToRgba(form.primaryColor, 1)} 100%)`,
          }}
        />
        <div className="relative z-10 p-6 flex flex-col gap-4">
          {/* Avatar — the uploaded logo when present, else initials. */}
          <div
            className="w-24 h-24 rounded-full shrink-0 flex items-center justify-center overflow-hidden"
            style={{
              background: logoUrl ? "#231F20" : "rgba(255,255,255,0.15)",
              outline: "2px solid rgba(255,255,255,0.5)",
              outlineOffset: "-2px",
              backdropFilter: "blur(48px)",
            }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Team logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-sans font-normal" style={{ fontSize: 32, lineHeight: 1 }}>
                {initials}
              </span>
            )}
          </div>
          <h4 className="font-display font-black text-[40px] lg:text-[56px] uppercase text-white leading-none w-full break-words">
            {form.organizationName || "Twin Lakes Academy Middle School"}
          </h4>

          {/* Radial gradient separator */}
          <div
            className="w-full"
            style={{ height: "2px", background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)" }}
          />

          {form.sport && (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon-dribbble.svg" alt="" width={24} height={24} className="shrink-0" />
              <span className="text-white font-medium" style={{ fontSize: 14 }}>
                {SPORT_OPTIONS.find((o) => o.value === form.sport)?.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Info rows below the inner card */}
      <div className="flex flex-col gap-4">
        {form.organizationType && (
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-6 h-6 text-white shrink-0 mt-0.5" />
            <div className="flex flex-col gap-2">
              <span className="text-base font-semibold text-white">Organization Type</span>
              <span className="text-base font-normal text-white">{labelOf(ORG_TYPE_OPTIONS, form.organizationType)}</span>
            </div>
          </div>
        )}
        {(form.streetAddress || form.city || form.state || form.zipCode) && (
          <div className="flex items-start gap-2">
            <MapPin className="w-6 h-6 text-white shrink-0 mt-0.5" />
            <div className="flex flex-col gap-2">
              <span className="text-base font-semibold text-white">Location</span>
              <span className="text-base font-normal text-white">
                {[form.streetAddress, form.city, form.state, form.zipCode].filter(Boolean).join(", ")}
              </span>
            </div>
          </div>
        )}
        {form.conference && (
          <div className="flex items-start gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-help.svg" alt="" width={24} height={24} className="shrink-0 mt-0.5 opacity-80" />
            <div className="flex flex-col gap-2">
              <span className="text-base font-semibold text-white">Conference\League</span>
              <span className="text-base font-normal text-white">{form.conference}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
