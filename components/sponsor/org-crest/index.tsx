export interface Crest {
  // Shield fill and its outline/stripe.
  color: string;
  trim: string;
}

interface OrgCrestProps extends Crest {
  orgName: string;
  width: number;
  height: number;
}

// An organization's shield logo, drawn in a 48×56 box and scaled to size.
export default function OrgCrest({ orgName, color, trim, width, height }: OrgCrestProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 48 56" role="img" aria-label={`${orgName} logo`} className="flex-none">
      <path d="M24 2L44 8v18c0 14-9 23-20 28C13 49 4 40 4 26V8z" fill={color} stroke={trim} strokeWidth="2.5" />
      <path d="M10 14h28" stroke={trim} strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}
