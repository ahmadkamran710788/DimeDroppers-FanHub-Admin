"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Check, Plus } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Modal from "@/components/common/modal";
import Select from "@/components/common/select";
import type { TeamShopProduct } from "@/components/team-shop/data";
import { TEAMS } from "@/components/teams/data";
import { useTeamShop } from "@/context/team-shop";
import { cn } from "@/utils/cn";

// Game content offered for sale: everything a store product needs except the team and prices.
export type StoreItem = Omit<TeamShopProduct, "id" | "teamId" | "status" | "stock"> & { sourceId: string };

const TEAM_OPTIONS = TEAMS.map((t) => ({ label: `${t.name} · ${t.headCoach}`, value: t.id }));

const asMoney = (v: string) => {
  const cleaned = v.replace(/[^\d.]/g, "");
  return /^\d*(\.\d{0,2})?$/.test(cleaned) ? cleaned : null;
};
const digits = (v: string) => v.replace(/\D/g, "");

interface AddToStoreProps {
  item: StoreItem;
  className?: string;
}

// "Add to Store" on game content (collectibles, videos, shop items): pick a team and price, then
// it lands in that team's Team Shop. Shows "In Store" once any team sells it.
export default function AddToStore({ item, className }: AddToStoreProps) {
  const { productsFor, addProduct, teamsWithSource } = useTeamShop();
  const [open, setOpen] = useState(false);
  const [teamId, setTeamId] = useState(TEAMS[0].id);
  const [price, setPrice] = useState(String(item.price));
  const [dimes, setDimes] = useState(String(item.dimes));
  const [stock, setStock] = useState("25");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inStore = teamsWithSource(item.sourceId).length > 0;

  const openPopup = () => {
    setPrice(String(item.price));
    setDimes(String(item.dimes));
    setErrors({});
    setOpen(true);
  };

  const save = () => {
    const next: Record<string, string> = {};
    if (!(Number(price) > 0)) next.price = "Enter a price greater than 0";
    if (!(Number(dimes) > 0)) next.dimes = "Enter Dimes greater than 0";
    if (item.type === "Merch" && stock === "") next.stock = "Stock is required";
    if (productsFor(teamId).some((p) => p.sourceId === item.sourceId)) next.teamId = "Already in this team's store";
    setErrors(next);
    if (Object.keys(next).length) return;

    addProduct({
      ...item,
      id: `product-${Date.now()}`,
      teamId,
      price: Number(price),
      dimes: Number(dimes),
      status: "Active",
      ...(item.type === "Merch" && { stock: Number(stock) }),
    });
    const team = TEAMS.find((t) => t.id === teamId);
    toast.success(`${item.name} added to ${team?.name ?? "the team"} store`);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          // Cards may be clickable themselves; this button only opens the popup.
          e.stopPropagation();
          openPopup();
        }}
        className={cn(
          "cursor-pointer h-9 px-3 rounded-[8px] flex items-center justify-center gap-1.5 text-sm font-medium transition-colors",
          inStore ? "bg-success/15 text-success hover:bg-success/25" : "bg-white/10 text-white hover:bg-white/20",
          className
        )}
      >
        {inStore ? <Check className="size-4" strokeWidth={2.5} /> : <Plus className="size-4" strokeWidth={2.5} />}
        {inStore ? "In Store" : "Add to Store"}
      </button>

      {/* Portalled: cards can sit under backdrop-blur (which traps fixed overlays) and clickable rows. */}
      {open &&
        createPortal(
          <div onClick={(e) => e.stopPropagation()}>
            <Modal isOpen={open} onClose={() => setOpen(false)} title="Add to Store" className="max-w-[min(480px,calc(100vw-2rem))] items-stretch">
              <div className="w-full flex flex-col gap-4">
                <p className="text-sm text-midnight-navy/70">
                  <span className="font-semibold text-midnight-navy">{item.name}</span>
                  {item.game ? ` · ${item.game}` : ""}
                </p>
                <Select
                  label="Team"
                  name="storeTeam"
                  required
                  value={teamId}
                  onChange={(e) => {
                    setTeamId(e.target.value);
                    if (errors.teamId) setErrors((prev) => ({ ...prev, teamId: "" }));
                  }}
                  options={TEAM_OPTIONS}
                  error={errors.teamId}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Price ($)"
                    name="storePrice"
                    required
                    value={price}
                    onChange={(e) => {
                      const v = asMoney(e.target.value);
                      if (v !== null) setPrice(v);
                    }}
                    error={errors.price}
                  />
                  <Input
                    label="Price (Dimes)"
                    name="storeDimes"
                    required
                    value={dimes}
                    onChange={(e) => setDimes(digits(e.target.value))}
                    error={errors.dimes}
                  />
                </div>
                {item.type === "Merch" && (
                  <Input
                    label="Stock"
                    name="storeStock"
                    required
                    value={stock}
                    onChange={(e) => setStock(digits(e.target.value))}
                    error={errors.stock}
                  />
                )}
              </div>
              <div className="w-full flex gap-3">
                <Button label="Cancel" variant="secondary" onClick={() => setOpen(false)} fullWidth className="cursor-pointer" />
                <Button label="Add to Store" variant="cta" onClick={save} fullWidth className="cursor-pointer" />
              </div>
            </Modal>
          </div>,
          document.body
        )}
    </>
  );
}
