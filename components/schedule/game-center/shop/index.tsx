"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ChartLine,
  ChevronDown,
  CircleDot,
  CirclePlay,
  Flame,
  Palette,
  Shirt,
  ShoppingBag,
  SquareUser,
  Tag,
} from "lucide-react";
import RowActionsMenu from "@/components/common/row-actions-menu";
import type { ShopCategory, ShopProduct } from "@/components/schedule/game-center/data";
import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";

const ICON = "size-5 shrink-0";
const CATEGORIES: { label: ShopCategory; icon: ReactNode }[] = [
  { label: "Merch & Apparel", icon: <Tag className={ICON} strokeWidth={1.5} /> },
  { label: "Player Cards", icon: <SquareUser className={ICON} strokeWidth={1.5} /> },
  { label: "Highlights", icon: <CirclePlay className={ICON} strokeWidth={1.5} /> },
  { label: "Activity", icon: <ChartLine className={ICON} strokeWidth={1.5} /> },
];

type FilterKey = "apparelType" | "brand" | "color";
const FILTERS: { key: FilterKey; label: string; icon: ReactNode }[] = [
  { key: "apparelType", label: "Apparel Type", icon: <Shirt className={ICON} strokeWidth={1.5} /> },
  { key: "brand", label: "Brand", icon: <Tag className={ICON} strokeWidth={1.5} /> },
  { key: "color", label: "Color", icon: <Palette className={ICON} strokeWidth={1.5} /> },
];

const CHIP = "h-11 px-4 rounded-full flex items-center gap-2 text-base font-medium whitespace-nowrap transition-colors";
const IDLE_CHIP = "border border-white/15 bg-white/5 text-white/85 hover:bg-white/10";

interface ShopSectionProps {
  products: ShopProduct[];
  sponsorName: string;
  sponsorLogo: string;
  onSelectProduct: (p: ShopProduct) => void;
  onSeeAll: () => void;
  // Skip the heading, sponsor and category/filter chips; show only the featured grid.
  featuredOnly?: boolean;
  className?: string;
}

function ProductCard({ product, onSelect }: { product: ShopProduct; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group text-left rounded-[8px] overflow-hidden border border-white/10 bg-[#111C2E] hover:border-white/30 transition-colors"
    >
      <div className="relative aspect-[4/3] bg-[#F1F2F4]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt="" className="absolute inset-0 size-full object-cover" />
        {product.trending && (
          <span
            className="absolute top-3 left-3 h-7 px-2.5 rounded-full flex items-center gap-1 text-sm font-medium text-white"
            style={{ background: "var(--gradient-cta)" }}
          >
            <Flame className="size-4 fill-white" strokeWidth={0} />
            Trending
          </span>
        )}
      </div>
      <div className="px-5 py-4 flex flex-col gap-2">
        <span className="text-lg font-medium text-white truncate">{product.name}</span>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-base text-white">{formatMoney(product.price)}</span>
          <span className="h-8 px-3 rounded-full flex items-center gap-2 bg-white/10 text-sm text-white/85">
            <CircleDot className="size-4 text-[#A855F7]" strokeWidth={2.5} />
            {`${product.dimes.toLocaleString("en-US")} Dimes`}
          </span>
        </div>
      </div>
    </button>
  );
}

// "Shop" tab: category chips, apparel filters and the game's featured merch (or just the merch).
export default function ShopSection({
  products,
  sponsorName,
  sponsorLogo,
  onSelectProduct,
  onSeeAll,
  featuredOnly = false,
  className,
}: ShopSectionProps) {
  const [category, setCategory] = useState<ShopCategory>("Merch & Apparel");
  const [filters, setFilters] = useState<Partial<Record<FilterKey, string>>>({});

  // Each dropdown offers the values present in the catalogue.
  const options = (key: FilterKey) => [...new Set(products.map((p) => p[key]))].sort();

  const visible = useMemo(
    () =>
      products.filter(
        (p) => p.category === category && FILTERS.every(({ key }) => !filters[key] || p[key] === filters[key])
      ),
    [products, category, filters]
  );

  return (
    <div className={cn("px-6 py-8 flex flex-col gap-8", className)}>
      {!featuredOnly && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="flex items-center gap-4 text-4xl lg:text-[44px] font-semibold text-white">
              <ShoppingBag className="size-11 text-[#C04BF2]" strokeWidth={1.5} />
              Shop
            </h3>
            <div className="flex items-center gap-3 text-base text-white">
              Presented by
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sponsorLogo} alt={sponsorName} className="h-9 w-auto" />
            </div>
          </div>

          {/* Category chips + filter dropdowns */}
          <div className="flex flex-wrap gap-3 lg:gap-4">
            {CATEGORIES.map(({ label, icon }) => {
              const active = label === category;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setCategory(label)}
                  aria-pressed={active}
                  className={cn(CHIP, active ? "text-white" : IDLE_CHIP)}
                  style={active ? { background: "var(--gradient-cta)" } : undefined}
                >
                  {icon}
                  {label}
                </button>
              );
            })}
            {FILTERS.map(({ key, label, icon }) => (
              <RowActionsMenu
                key={key}
                ariaLabel={`Filter by ${label}`}
                // size-auto first so CHIP's h-11 overrides the trigger's default square size.
                className={cn("size-auto outline-0 backdrop-blur-none", CHIP, IDLE_CHIP)}
                trigger={
                  <>
                    {icon}
                    {filters[key] ?? label}
                    <ChevronDown className="size-4" strokeWidth={2} />
                  </>
                }
                items={[
                  { label: `All ${label === "Brand" ? "Brands" : label === "Color" ? "Colors" : "Types"}`, onSelect: () => setFilters((f) => ({ ...f, [key]: undefined })) },
                  ...options(key).map((value) => ({ label: value, onSelect: () => setFilters((f) => ({ ...f, [key]: value })) })),
                ]}
              />
            ))}
          </div>
        </>
      )}

      {/* Featured */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <h4 className="font-display font-extrabold text-[32px] lg:text-[40px] uppercase leading-none text-white">
            Featured
          </h4>
          <button
            type="button"
            onClick={onSeeAll}
            className="flex items-center gap-2 text-base font-medium text-white hover:opacity-80 transition-opacity"
          >
            See All
            <ArrowRight className="size-5" strokeWidth={1.5} />
          </button>
        </div>
        {visible.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} onSelect={() => onSelectProduct(p)} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-white/40">
            {category === "Merch & Apparel" ? "No items match these filters." : `${category} — coming soon.`}
          </p>
        )}
      </section>
    </div>
  );
}
