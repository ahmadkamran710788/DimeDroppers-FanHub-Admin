export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-6 sm:py-10">
      {/* Blurred ambient background image — mirrors the setup wizard shell. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hub-bg-3c75bf.png"
        alt=""
        aria-hidden="true"
        className="absolute pointer-events-none select-none"
        style={{
          top: 0,
          right: 0,
          width: "80%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top right",
          filter: "blur(72px)",
          opacity: 0.6,
          zIndex: 0,
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[440px] px-4 sm:px-0">
        {/* Brand */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/logo-union.svg" alt="" width={32} height={28} className="shrink-0" />
          <span className="font-display font-black text-[28px] uppercase leading-none tracking-wide">
            <span className="text-white">DIME </span>
            <span
              style={{
                backgroundImage: "var(--gradient-cta)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              FAN HUB
            </span>
          </span>
        </div>

        {/* Glass card */}
        <div
          className="rounded-[8px] bg-[rgba(255,255,255,0.06)] p-5 sm:p-8 backdrop-blur-[48px]"
          style={{ boxShadow: "inset 0px 1px 0px 0px rgba(255,255,255,0.2)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
