"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown, CircleDot } from "lucide-react";
import toast from "react-hot-toast";
import GenericTable, { type Column } from "@/components/common/generic-table";
import Pagination from "@/components/common/pagination";
import RowActionsMenu from "@/components/common/row-actions-menu";
import SearchInput from "@/components/common/search-input";
import Select from "@/components/common/select";
import StatCard from "@/components/common/stat-card";
import StatusPill from "@/components/common/status-pill";
import Tabs from "@/components/common/tabs";
import {
  PRODUCT_TYPE_LABEL,
  type ProductType,
  type TeamShopProduct,
} from "@/components/team-shop/data";
import { TEAMS } from "@/components/teams/data";
import { useTeamShop } from "@/context/team-shop";
import { formatMoney } from "@/utils/helper";

const PAGE_SIZE = 10;
const TABS = ["All", "Merch & Apparel", "Videos", "Digital Collectibles"] as const;
type Tab = (typeof TABS)[number];
const TAB_TYPE: Partial<Record<Tab, ProductType>> = {
  "Merch & Apparel": "Merch",
  Videos: "Video",
  "Digital Collectibles": "Collectible",
};

const STATUS_FILTERS = ["All Status", "Active", "Draft"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const TYPE_PILL: Record<ProductType, string> = {
  Merch: "bg-[#2F5BD3]",
  Video: "bg-[#5B3AA8]",
  Collectible: "bg-[#0E7C86]",
};

// Team names repeat in the sample list, so show the head coach too.
const TEAM_OPTIONS = TEAMS.map((t) => ({ label: `${t.name} · ${t.headCoach}`, value: t.id }));

const fmtDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// Merch stock, video length or collectible rarity — whatever matters for that type.
function productDetail(p: TeamShopProduct) {
  if (p.type === "Merch") {
    if (!p.stock) return <span className="text-error">Out of stock</span>;
    return <span>{`${p.stock} in stock`}</span>;
  }
  if (p.type === "Video") return <span>{p.duration ? fmtDuration(p.duration) : "—"}</span>;
  return <span>{p.rarity ?? "—"}</span>;
}

// Team Shop: the merch, highlight videos and digital collectibles a team sells.
export default function TeamShopPage() {
  const { productsFor, removeProduct, setStatus } = useTeamShop();
  const [teamId, setTeamId] = useState(TEAMS[0].id);
  const [tab, setTab] = useState<Tab>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All Status");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // Shared store, so items added from Media and Digital Collectibles show up here too.
  const products = productsFor(teamId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const type = TAB_TYPE[tab];
    return products.filter(
      (p) =>
        (!type || p.type === type) &&
        (statusFilter === "All Status" || p.status === statusFilter) &&
        (!q || [p.name, p.game ?? "", PRODUCT_TYPE_LABEL[p.type]].some((v) => v.toLowerCase().includes(q)))
    );
  }, [products, tab, statusFilter, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const count = (type?: ProductType) => products.filter((p) => !type || p.type === type).length;
  const remove = (p: TeamShopProduct) => {
    removeProduct(teamId, p.id);
    toast.success(`${p.name} removed`);
  };

  const columns: Column<TeamShopProduct>[] = [
    {
      header: "Product",
      cls: "flex-1 min-w-[220px] py-4",
      cell: (p) => (
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src={p.image}
            alt=""
            width={56}
            height={56}
            // Newly added products use a local blob: preview until uploads go to the API.
            unoptimized={p.image.startsWith("blob:")}
            className="size-14 shrink-0 rounded-[8px] object-cover bg-white/10"
          />
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm font-semibold text-white truncate">{p.name}</span>
            <span className="text-xs text-white/50 truncate">
              {p.type === "Merch" ? (p.sizes?.join(", ") ?? "") : (p.game ?? "")}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      cls: "w-40 shrink-0 py-4",
      cell: (p) => (
        <StatusPill label={PRODUCT_TYPE_LABEL[p.type]} color={TYPE_PILL[p.type]} className="px-2.5" textClassName="text-white" />
      ),
    },
    {
      header: "Price",
      cls: "w-40 shrink-0 py-4",
      cell: (p) => (
        <div className="flex flex-col gap-1 leading-4">
          <span>{formatMoney(p.price)}</span>
          <span className="flex items-center gap-1 text-white/60">
            <CircleDot className="size-3.5 text-[#C04BF2]" strokeWidth={2.5} />
            {`${p.dimes.toLocaleString("en-US")} Dimes`}
          </span>
        </div>
      ),
    },
    { header: "Details", cls: "w-32 shrink-0 py-4", cell: productDetail },
    {
      header: "Status",
      cls: "w-24 shrink-0 py-4",
      cell: (p) => <StatusPill label={p.status} color={p.status === "Active" ? "bg-success" : "bg-white/30"} />,
    },
    {
      header: "Actions",
      cls: "w-20 shrink-0 py-4 justify-end",
      cell: (p) => (
        <RowActionsMenu
          ariaLabel={`Actions for ${p.name}`}
          className="bg-white/25 hover:bg-white/35"
          items={[
            // Editing needs the product API; status and delete work on the sample list.
            { label: "Edit Product", onSelect: () => toast("Coming soon.") },
            p.status === "Active"
              ? { label: "Move to Draft", onSelect: () => setStatus(teamId, p.id, "Draft") }
              : { label: "Publish", onSelect: () => setStatus(teamId, p.id, "Active") },
            { label: "Delete Product", onSelect: () => remove(p), variant: "destructive" },
          ]}
        />
      ),
    },
  ];

  return (
    // Pointer cursor on everything clickable in the Team Shop.
    <div className="flex flex-col gap-10 [&_button:not(:disabled)]:cursor-pointer [&_select]:cursor-pointer [&_[role=button]]:cursor-pointer">
      {/* Title + team + add */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex flex-col gap-2 text-white">
          <h2 className="font-display font-black text-[32px] sm:text-[40px] lg:text-[56px] uppercase leading-none">Team Shop</h2>
          <p className="text-base text-white/80">
            Manage the merch, videos and digital collectibles your team sells. Add items from Media and Digital
            Collectibles with Add to Store.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <Select
            variant="dark"
            label="Team"
            name="teamId"
            value={teamId}
            onChange={(e) => {
              setTeamId(e.target.value);
              setPage(1);
            }}
            options={TEAM_OPTIONS}
            labelClassName="text-white text-sm"
            // Wide enough for "Team name · Head coach"; pr-10 keeps long names clear of the arrow.
            className="sm:w-[28rem]"
            selectClassName="pr-10 truncate"
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-10">
        <StatCard label="Total Products" value={String(count())} tint="rgba(99,139,254,0.5)" caption="This team" />
        <StatCard label="Merch & Apparel" value={String(count("Merch"))} tint="rgba(47,91,211,0.5)" caption="Shirts, hoodies, jerseys" />
        <StatCard label="Videos" value={String(count("Video"))} tint="rgba(157,98,193,0.5)" caption="Game highlights" />
        <StatCard label="Collectibles" value={String(count("Collectible"))} tint="rgba(14,124,134,0.6)" caption="Digital cards" />
      </div>

      {/* Products */}
      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px] bg-surface-07">
        <Tabs
          tabs={TABS}
          active={tab}
          onChange={(t) => {
            setTab(t);
            setPage(1);
          }}
          counts={{
            All: count(),
            "Merch & Apparel": count("Merch"),
            Videos: count("Video"),
            "Digital Collectibles": count("Collectible"),
          }}
          className="overflow-x-auto overflow-y-hidden pb-px"
        />

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <SearchInput
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search products"
            aria-label="Search products"
            className="sm:max-w-sm"
          />
          <RowActionsMenu
            ariaLabel="Filter by status"
            className="size-auto h-12 px-4 gap-2 rounded-[8px] outline-0 bg-[rgba(235,235,235,0.25)] hover:bg-white/35 text-base font-medium text-white whitespace-nowrap"
            trigger={
              <>
                {statusFilter}
                <ChevronDown className="size-5" strokeWidth={2} />
              </>
            }
            items={STATUS_FILTERS.map((s) => ({
              label: s,
              onSelect: () => {
                setStatusFilter(s);
                setPage(1);
              },
            }))}
          />
        </div>

        <div className="flex flex-col">
          <GenericTable
            columns={columns}
            rows={rows}
            getKey={(p) => p.id}
            empty={query || statusFilter !== "All Status" ? "No products match these filters." : "No products yet. Add your first one."}
          />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-white/20">
            <span className="text-xs text-white/80">{`Showing ${from} to ${to} of ${filtered.length} products`}</span>
            <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
          </div>
        </div>
      </div>
    </div>
  );
}
