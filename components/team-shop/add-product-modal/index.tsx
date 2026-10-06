"use client";

import { useState, type ReactNode } from "react";
import { Check, Clapperboard, Gem, Shirt } from "lucide-react";
import Button from "@/components/common/button";
import CheckboxGroup from "@/components/common/checkbox-group";
import FileUpload from "@/components/common/file-upload";
import Input from "@/components/common/input";
import Modal from "@/components/common/modal";
import Select from "@/components/common/select";
import { addProductSchema } from "@/components/team-shop/add-product-modal/schema";
import {
  MERCH_SIZES,
  PRODUCT_TYPE_LABEL,
  RARITIES,
  SAMPLE_GAMES,
  type CollectibleRarity,
  type ProductStatus,
  type ProductType,
  type TeamShopProduct,
} from "@/components/team-shop/data";
import { cn } from "@/utils/cn";
import { validateAndSetErrors } from "@/utils/validation";

const TYPES: { type: ProductType; description: string; icon: ReactNode }[] = [
  { type: "Merch", description: "Shirts, hoodies and jerseys.", icon: <Shirt className="size-6" strokeWidth={1.75} /> },
  { type: "Video", description: "Game highlights fans can unlock.", icon: <Clapperboard className="size-6" strokeWidth={1.75} /> },
  { type: "Collectible", description: "Digital player cards.", icon: <Gem className="size-6" strokeWidth={1.75} /> },
];

const INITIAL = {
  type: "" as ProductType | "",
  name: "",
  image: "",
  price: "",
  dimes: "",
  status: "Active" as ProductStatus,
  stock: "",
  sizes: [] as string[],
  game: "",
  duration: "",
  rarity: "" as CollectibleRarity | "",
};
type Form = typeof INITIAL;

// Keeps a money field to digits and one decimal point with at most 2 decimals.
const asMoney = (v: string) => {
  const cleaned = v.replace(/[^\d.]/g, "");
  return /^\d*(\.\d{0,2})?$/.test(cleaned) ? cleaned : null;
};
const digits = (v: string) => v.replace(/\D/g, "");

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onAdd: (product: TeamShopProduct) => void;
}

// Popup for adding a product to a team shop: pick merch, video or collectible, then its details.
export default function AddProductModal({ isOpen, onClose, teamId, onAdd }: AddProductModalProps) {
  const [form, setForm] = useState<Form>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const close = () => {
    setForm(INITIAL);
    setErrors({});
    onClose();
  };

  const save = async () => {
    if (!(await validateAndSetErrors(addProductSchema, form, setErrors))) return;
    const type = form.type as ProductType;
    onAdd({
      id: `product-${Date.now()}`,
      teamId,
      type,
      name: form.name.trim(),
      image: form.image,
      price: Number(form.price),
      dimes: Number(form.dimes),
      status: form.status,
      ...(type === "Merch" && { stock: Number(form.stock), sizes: form.sizes }),
      ...(type === "Video" && { duration: Number(form.duration), game: form.game }),
      ...(type === "Collectible" && { rarity: form.rarity as CollectibleRarity, game: form.game }),
    });
    close();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Add Product"
      className="max-w-[min(640px,calc(100vw-2rem))] items-stretch max-h-[calc(100vh-2rem)] overflow-y-auto"
    >
      <div className="w-full flex flex-col gap-5">
        {/* Type */}
        <div className="flex flex-col gap-2">
          <span className="text-base font-medium text-midnight-navy">
            What are you adding?<span className="text-error"> *</span>
          </span>
          <div role="radiogroup" aria-label="Product type" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TYPES.map(({ type, description, icon }) => {
              const selected = form.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => update("type", type)}
                  className={cn(
                    "cursor-pointer relative text-left rounded-[12px] border-2 p-4 flex flex-col gap-2 transition-colors",
                    selected ? "border-steel-blue bg-steel-blue/10" : "border-[rgba(11,28,45,0.12)] hover:border-steel-blue/50"
                  )}
                >
                  {selected && (
                    <span className="absolute top-3 right-3 size-5 rounded-full bg-steel-blue flex items-center justify-center">
                      <Check className="size-3.5 text-white" strokeWidth={3} />
                    </span>
                  )}
                  <span className="size-10 rounded-full bg-[#F5F6F8] text-steel-blue flex items-center justify-center">{icon}</span>
                  <span className="text-base font-semibold text-midnight-navy">{PRODUCT_TYPE_LABEL[type]}</span>
                  <span className="text-sm text-midnight-navy/60">{description}</span>
                </button>
              );
            })}
          </div>
          {errors.type && <p className="text-sm text-error">{errors.type}</p>}
        </div>

        {form.type && (
          <>
            <Input
              label="Name"
              name="productName"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder={form.type === "Merch" ? "Official Hoodie" : form.type === "Video" ? "Slam dunk" : "Gold Standard"}
              error={errors.name}
            />
            <div className="flex flex-col gap-2">
              <FileUpload
                label={form.type === "Video" ? "Thumbnail *" : "Image *"}
                helperText="PNG or JPG"
                accept="image/png,image/jpeg"
                tone="light"
                prompt={form.type === "Video" ? "Upload Thumbnail" : "Upload Image"}
                onFile={(_file, url) => update("image", url ?? "")}
                onClear={() => update("image", "")}
              />
              {errors.image && <p className="text-sm text-error">{errors.image}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Price ($)"
                name="price"
                required
                value={form.price}
                onChange={(e) => {
                  const v = asMoney(e.target.value);
                  if (v !== null) update("price", v);
                }}
                placeholder="49.99"
                error={errors.price}
              />
              <Input
                label="Price (Dimes)"
                name="dimes"
                required
                value={form.dimes}
                onChange={(e) => update("dimes", digits(e.target.value))}
                placeholder="8000"
                error={errors.dimes}
              />
            </div>

            {form.type === "Merch" && (
              <>
                <Input
                  label="Stock"
                  name="stock"
                  required
                  value={form.stock}
                  onChange={(e) => update("stock", digits(e.target.value))}
                  placeholder="25"
                  error={errors.stock}
                />
                <CheckboxGroup
                  label="Sizes *"
                  options={MERCH_SIZES}
                  value={form.sizes}
                  onChange={(v) => update("sizes", v)}
                  error={errors.sizes}
                  variant="light"
                />
              </>
            )}

            {(form.type === "Video" || form.type === "Collectible") && (
              <Select
                label="Game"
                name="game"
                required
                value={form.game}
                onChange={(e) => update("game", e.target.value)}
                options={SAMPLE_GAMES.map((g) => ({ label: g, value: g }))}
                placeholder="Select game"
                error={errors.game}
              />
            )}
            {form.type === "Video" && (
              <Input
                label="Duration (seconds)"
                name="duration"
                required
                value={form.duration}
                onChange={(e) => update("duration", digits(e.target.value))}
                placeholder="30"
                error={errors.duration}
              />
            )}
            {form.type === "Collectible" && (
              <Select
                label="Rarity"
                name="rarity"
                required
                value={form.rarity}
                onChange={(e) => update("rarity", e.target.value as CollectibleRarity)}
                options={RARITIES.map((r) => ({ label: r, value: r }))}
                placeholder="Select rarity"
                error={errors.rarity}
              />
            )}

            <Select
              label="Status"
              name="status"
              value={form.status}
              onChange={(e) => update("status", e.target.value as ProductStatus)}
              options={[
                { label: "Active — visible in the fan app", value: "Active" },
                { label: "Draft — hidden for now", value: "Draft" },
              ]}
            />
          </>
        )}
      </div>
      <div className="w-full flex gap-3">
        <Button label="Cancel" variant="secondary" onClick={close} fullWidth />
        <Button label="Add Product" variant="cta" onClick={save} fullWidth />
      </div>
    </Modal>
  );
}
