import { cn } from "@/utils/cn";

interface SectionCardProps {
  /** Optional lettered badge shown before the title (e.g. "A", "B", "C"). */
  badge?: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export default function SectionCard({ badge, title, description, children, className }: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px]",
        "bg-[rgba(255,255,255,0.06)]",
        className
      )}
    >
      {(title || description) && (
        <div className="flex flex-col gap-2">
          {title && (
            <div className="flex items-center gap-2">
              {badge && (
                <span className="w-[34px] h-[34px] shrink-0 rounded-full bg-border-subtle flex items-center justify-center text-base font-semibold text-white leading-none">
                  {badge}
                </span>
              )}
              <h3 className="font-display font-black text-[28px] uppercase text-white leading-tight">
                {title}
              </h3>
            </div>
          )}
          {description && (
            <p className="text-base text-white/80">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
