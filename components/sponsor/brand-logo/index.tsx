import { cn } from "@/utils/cn";

// md: library thumbnails. lg: the brand profile preview.
const SIZES = {
  md: { mark: { width: 48, height: 36 }, word: "text-[32px]", gap: "gap-[10px]" },
  lg: { mark: { width: 54, height: 40 }, word: "text-[40px]", gap: "gap-3" },
};

interface BrandLogoProps {
  wordmark: string;
  // Each part is drawn only when its color is set.
  markFill?: string;
  wordColor?: string;
  size: keyof typeof SIZES;
}

// The sponsor's logo: a peak mark and/or the wordmark. Mock artwork until real logos are uploaded.
export default function BrandLogo({ wordmark, markFill, wordColor, size }: BrandLogoProps) {
  const s = SIZES[size];
  return (
    <div role="img" aria-label={`${wordmark} logo`} className={cn("flex items-center justify-center", s.gap)}>
      {markFill && (
        <svg width={s.mark.width} height={s.mark.height} viewBox="0 0 54 40" aria-hidden="true" className="flex-none">
          <path d="M2 38L20 8l9 14 6-9 17 25z" fill={markFill} />
          <path d="M20 8l5 8-5 3-4-4z" fill="#f4efe6" />
        </svg>
      )}
      {wordColor && (
        <span className={cn("font-display font-black leading-none tracking-[1px]", s.word)} style={{ color: wordColor }}>
          {wordmark}
        </span>
      )}
    </div>
  );
}
